import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { tests, testBookings, testBookingItems, payments } from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { testBookingSchema } from '$lib/schemas';
import { createOrder, verifyScopedPaymentProof } from '$lib/server/payment';
import { MOCK_TESTS } from '$lib/server/mockData';
import { adminStore } from '$lib/server/adminStore';
import { registerUserAccount } from '$lib/server/auth/accounts';

export const load: PageServerLoad = async ({ url, locals }) => {
	let allTests: any[] = [];
	try {
		allTests = await db.query.tests.findMany({
			where: eq(tests.isActive, true),
			orderBy: (tests, { asc }) => [asc(tests.category), asc(tests.name)]
		});
	} catch (err) {
		console.warn('DB query failed for tests, falling back to MOCK_TESTS:', err);
	}

	if (!allTests || allTests.length === 0) {
		allTests = MOCK_TESTS.filter((t) => t.isActive);
	}

	return {
		tests: allTests,
		user: locals.user ?? null,
		initialCategory: url.searchParams.get('category') || 'All',
		initialSearch: url.searchParams.get('search') || ''
	};
};

export const actions: Actions = {
	book: async ({ request, locals }) => {
		const formData = await request.formData();
		const patientName = String(formData.get('patientName') || locals.user?.name || '').trim();
		const rawPhone = String(formData.get('patientPhone') || locals.user?.phone || '').trim();
		const digitsOnly = rawPhone.replace(/\D/g, '');
		const patientPhone = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;
		const patientEmail = String(formData.get('patientEmail') || locals.user?.email || '').trim();
		const patientAge = parseInt(String(formData.get('patientAge') || '0'), 10);
		const patientGender = String(formData.get('patientGender') || '');
		const address = String(formData.get('address') || '').trim();
		const collectionDate = String(formData.get('collectionDate') || '').trim();
		const collectionSlot = String(formData.get('collectionSlot') || '');
		const rawTestIds = formData.getAll('testIds').map(String);

		const paymentMode = String(formData.get('paymentMode') || 'demo_online');
		const paymentOrderId = String(formData.get('paymentOrderId') || '').trim();
		const paymentIdInput = String(formData.get('paymentId') || '').trim();
		const paymentSignature = String(formData.get('paymentSignature') || '').trim();
		const paymentMethodInput = String(formData.get('paymentMethod') || '').trim();

		const parsed = testBookingSchema.safeParse({
			patientName,
			patientPhone,
			patientAge,
			patientGender,
			address,
			testIds: rawTestIds,
			collectionDate,
			collectionSlot
		});

		if (!parsed.success) {
			const errors = parsed.error.flatten().fieldErrors;
			const firstError = Object.values(errors)[0]?.[0] || 'Please complete all required fields';
			return fail(400, {
				error: firstError,
				values: {
					patientName,
					patientPhone: rawPhone,
					patientEmail,
					patientAge,
					patientGender,
					address,
					collectionDate,
					collectionSlot,
					testIds: rawTestIds
				}
			});
		}

		// Resolve test details & authoritative total from DB first, falling back to MOCK_TESTS
		let catalogTests: Array<{ id: string; name: string; price: string; category: string }> = [];
		try {
			const dbTests = await db
				.select({
					id: tests.id,
					name: tests.name,
					price: tests.price,
					category: tests.category
				})
				.from(tests)
				.where(and(inArray(tests.id, rawTestIds), eq(tests.isActive, true)));
			catalogTests = dbTests.map((t) => ({
				id: t.id,
				name: t.name,
				price: String(t.price),
				category: t.category
			}));
		} catch (err) {
			console.warn('DB test price lookup fallback to MOCK_TESTS:', err);
		}

		if (catalogTests.length === 0) {
			catalogTests = MOCK_TESTS.filter((t) => t.isActive && rawTestIds.includes(t.id)).map((t) => ({
				id: t.id,
				name: t.name,
				price: String(t.price),
				category: t.category
			}));
		}

		const testMap = new Map(catalogTests.map((t) => [t.id, t]));
		const selectedTests: Array<{ id: string; name: string; price: string; category: string }> = [];
		let total = 0;

		for (const id of rawTestIds) {
			const found = testMap.get(id);
			if (found) {
				selectedTests.push(found);
				total += Number(found.price);
			}
		}

		if (selectedTests.length === 0 || total <= 0) {
			return fail(400, { error: 'No valid tests selected' });
		}

		const validTestIds = selectedTests.map((t) => t.id);

		// Verify payment when online payment was selected
		let paymentStatus: 'paid' | 'pending' = 'pending';
		let resolvedPaymentMethod = 'Pay on Sample Collection';
		let resolvedPaymentId: string | undefined;

		if (paymentMode !== 'pay_at_collection') {
			const scopeId = `tests:${validTestIds.slice().sort().join(',')}`;
			const isProofValid = await verifyScopedPaymentProof({
				orderId: paymentOrderId,
				paymentId: paymentIdInput,
				amount: total,
				scopeId,
				signature: paymentSignature
			});

			if (!isProofValid) {
				return fail(400, {
					error: 'Payment verification failed or expired. Please complete payment to confirm your booking.'
				});
			}

			paymentStatus = 'paid';
			resolvedPaymentMethod = paymentMethodInput || 'Demo Instant Payment';
			resolvedPaymentId = paymentIdInput;
		}

		const storedBooking = adminStore.createTestBooking({
			userId: locals.user?.id ?? null,
			patientName,
			patientPhone,
			patientEmail: patientEmail || undefined,
			patientAge,
			patientGender,
			address,
			collectionDate,
			collectionSlot,
			totalAmount: total,
			paymentStatus,
			paymentMethod: resolvedPaymentMethod,
			paymentId: resolvedPaymentId,
			tests: selectedTests
		});

		let bookingId = storedBooking.id;

		// Persist to PostgreSQL when available and user is authenticated (test_bookings.user_id is NOT NULL)
		if (locals.user?.id) {
			try {
				let orderId = paymentOrderId || null;
				if (!orderId) {
					try {
						const order = await createOrder(total, `order_${bookingId}`);
						orderId = order.id;
					} catch {
						// Ignore Razorpay fallback in local mode
					}
				}

				const [payment] = await db
					.insert(payments)
					.values({
						userId: locals.user.id,
						amount: total.toFixed(2),
						type: 'test',
						razorpayOrderId: orderId,
						razorpayPaymentId: resolvedPaymentId || null,
						razorpaySignature: paymentSignature || null,
						status: paymentStatus === 'paid' ? 'paid' : 'created'
					})
					.returning();

				const [booking] = await db
					.insert(testBookings)
					.values({
						userId: locals.user.id,
						patientName,
						patientPhone,
						patientAge,
						patientGender,
						address,
						collectionDate,
						collectionSlot,
						status: paymentStatus === 'paid' ? 'confirmed' : 'pending',
						totalAmount: total.toFixed(2),
						paymentId: payment?.id ?? null
					})
					.returning();

				if (booking?.id) {
					bookingId = booking.id;
					for (const testId of validTestIds) {
						await db.insert(testBookingItems).values({
							bookingId: booking.id,
							testId
						});
					}
				}
			} catch (e) {
				console.warn('Test booking DB save fallback to adminStore:', e);
			}
		}

		return {
			success: true,
			bookingId,
			storeBookingId: storedBooking.id,
			patientName,
			patientPhone,
			patientEmail,
			totalAmount: total,
			testCount: selectedTests.length,
			selectedTests,
			collectionDate,
			collectionSlot,
			paymentStatus,
			paymentMethod: resolvedPaymentMethod,
			paymentId: resolvedPaymentId,
			isGuestBooking: !locals.user,
			message:
				paymentStatus === 'paid'
					? 'Payment received! Home blood sample collection confirmed.'
					: 'Booking scheduled! Pay on sample collection.'
		};
	},

	createAccount: async ({ request, cookies }) => {
		const formData = await request.formData();
		const name = String(formData.get('name') || '').trim();
		const email = String(formData.get('email') || '').trim().toLowerCase();
		const phone = String(formData.get('phone') || '').trim();
		const password = String(formData.get('password') || '');
		const confirmPassword = String(formData.get('confirmPassword') || '');
		const bookingId = String(formData.get('bookingId') || '').trim() || null;
		const storeBookingId = String(formData.get('storeBookingId') || '').trim() || null;

		const booking =
			(storeBookingId ? adminStore.getTestBookingById(storeBookingId) : null) ||
			(bookingId ? adminStore.getTestBookingById(bookingId) : null);

		const result = await registerUserAccount(
			{
				name,
				email,
				phone,
				password,
				confirmPassword,
				bookingId: storeBookingId || bookingId
			},
			{ request, cookies }
		);

		const receiptSnapshot = booking
			? {
					success: true,
					bookingId: bookingId || booking.id,
					storeBookingId: booking.id,
					patientName: booking.patientName,
					patientPhone: booking.patientPhone,
					patientEmail: booking.patientEmail || email,
					totalAmount: booking.totalAmount,
					testCount: booking.items.length,
					selectedTests: booking.items.map((i) => i.test),
					collectionDate: booking.collectionDate,
					collectionSlot: booking.collectionSlot,
					paymentStatus: booking.paymentStatus,
					paymentMethod: booking.paymentMethod,
					paymentId: booking.paymentId
				}
			: {};

		if (!result.ok) {
			return fail(result.status, {
				accountError: result.error,
				accountName: name,
				accountEmail: email,
				accountPhone: phone,
				...receiptSnapshot
			});
		}

		return {
			...receiptSnapshot,
			success: true,
			accountCreated: true,
			createdUserEmail: result.user.email,
			isGuestBooking: false
		};
	}
};
