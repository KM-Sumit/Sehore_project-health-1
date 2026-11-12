<script lang="ts">
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import {
		Stethoscope,
		Clock,
		IndianRupee,
		GraduationCap,
		Calendar,
		ChevronRight,
		QrCode,
		Globe,
		CheckCircle2,
		User,
		Phone,
		Mail,
		CreditCard,
		Smartphone,
		ShieldCheck,
		Printer,
		Building2,
		AlertCircle,
		Sparkles,
		Tag,
		History,
		Lock
	} from 'lucide-svelte';
	import Card from '$components/Card.svelte';
	import Button from '$components/Button.svelte';
	import Modal from '$components/Modal.svelte';
	import { addToast } from '$utils/toast';

	let { data, form } = $props();
	let doctor = $derived(data.doctor);
	let pricing = $derived(data.pricing);

	let selectedDate = $state('');
	let selectedSlotId = $state('');
	let reason = $state('');
	let patientName = $state('');
	let patientPhone = $state('');
	let patientEmail = $state('');

	$effect(() => {
		if (data.user) {
			if (!patientName) patientName = data.user.name || '';
			if (!patientPhone) patientPhone = data.user.phone || '';
			if (!patientEmail) patientEmail = data.user.email || '';
		}
	});

	// Payment Mode: 'demo_online' | 'pay_at_clinic'
	let selectedPaymentMode = $state<'demo_online' | 'pay_at_clinic'>('demo_online');

	// Demo Payment Modal State
	let paymentModalOpen = $state(false);
	let paymentTab = $state<'upi' | 'card'>('upi');
	let selectedUpiApp = $state('Google Pay');
	let demoUpiId = $state('patient@okaxis');
	let isProcessingPayment = $state(false);
	let paymentProcessingStep = $state('');

	// Hidden form state for server-verified submission after payment
	let formElement: HTMLFormElement | null = $state(null);
	let hiddenPaymentMode = $state<'demo_online' | 'pay_at_clinic'>('demo_online');
	let hiddenPaymentMethod = $state('UPI (Demo Instant)');
	let hiddenPaymentOrderId = $state('');
	let hiddenPaymentId = $state('');
	let hiddenPaymentSignature = $state('');

	// Optional post-booking account creation state
	let showOptionalAccountForm = $state(true);
	let optName = $state('');
	let optEmail = $state('');
	let optPhone = $state('');
	let optPassword = $state('');
	let optConfirmPassword = $state('');
	let creatingAccount = $state(false);

	$effect(() => {
		if (form?.success && !form?.accountCreated) {
			if (!optName) optName = form.accountName || form.patientName || '';
			if (!optEmail) optEmail = form.accountEmail || form.patientEmail || '';
			if (!optPhone) optPhone = form.accountPhone || form.patientPhone || '';
		}
	});

	// Generate next 7 days
	let dates = $derived.by(() => {
		const result: { date: string; label: string; day: string }[] = [];
		const today = new Date();
		for (let i = 0; i < 7; i++) {
			const d = new Date(today);
			d.setDate(d.getDate() + i);
			const dateStr = d.toISOString().split('T')[0];
			const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
			const day = d.toLocaleDateString('en-IN', { weekday: 'short' });
			result.push({ date: dateStr, label, day });
		}
		return result;
	});

	// Slots for selected date
	let slotsForDate = $derived(
		doctor.slots.filter((slot: any) => slot.date === selectedDate)
	);

	let selectedSlot = $derived(
		doctor.slots.find((slot: any) => slot.id === selectedSlotId)
	);

	// Auto-select first available date
	$effect(() => {
		if (!selectedDate && dates.length > 0) {
			const firstDateWithSlots = dates.find((d) =>
				doctor.slots.some((s: any) => s.date === d.date)
			);
			selectedDate = firstDateWithSlots?.date ?? dates[0].date;
		}
	});

	$effect(() => {
		if (form?.accountCreated) {
			addToast('Account created! Booking history saved and 15% repeat-booking discount unlocked.', 'success');
		} else if (form?.success) {
			addToast(
				form.paymentStatus === 'paid'
					? 'Payment received & appointment confirmed!'
					: 'Appointment booked!',
				'success'
			);
		}
		if (form?.error) {
			addToast(form.error, 'error');
		}
		if (form?.accountError) {
			addToast(form.accountError, 'error');
		}
	});

	function validateFormInputs(): boolean {
		if (!selectedSlotId) {
			addToast('Please pick a consultation time slot.', 'error');
			return false;
		}
		if (!patientName || patientName.trim().length < 2) {
			addToast('Please provide the patient full name.', 'error');
			return false;
		}
		if (!patientPhone || patientPhone.replace(/\D/g, '').length < 10) {
			addToast('Please provide a valid 10-digit mobile phone number.', 'error');
			return false;
		}
		if (!reason || reason.trim().length < 3) {
			addToast('Please enter the reason for your visit.', 'error');
			return false;
		}
		return true;
	}

	function handleFormSubmit(e: SubmitEvent) {
		if (!validateFormInputs()) {
			e.preventDefault();
			return;
		}

		if (selectedPaymentMode === 'demo_online') {
			if (!hiddenPaymentSignature) {
				e.preventDefault();
				paymentModalOpen = true;
			}
			return;
		}

		hiddenPaymentMode = 'pay_at_clinic';
		hiddenPaymentMethod = 'Pay at Clinic / Cash';
		hiddenPaymentOrderId = '';
		hiddenPaymentId = '';
		hiddenPaymentSignature = '';
	}

	async function simulatePaymentSuccess() {
		isProcessingPayment = true;
		paymentProcessingStep = 'Creating payment order...';

		try {
			const orderRes = await fetch('/api/payment/create-order', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					doctorId: doctor.id,
					amount: pricing.finalFee
				})
			});
			const orderData = await orderRes.json();

			if (!orderRes.ok || !orderData.id || !orderData.paymentId || !orderData.paymentSignature) {
				throw new Error(orderData.error || 'Could not initialize payment order');
			}

			paymentProcessingStep = 'Authorizing transaction...';
			await new Promise((r) => setTimeout(r, 500));

			paymentProcessingStep = 'Payment verified! Confirming your appointment...';
			await new Promise((r) => setTimeout(r, 400));

			hiddenPaymentMode = 'demo_online';
			hiddenPaymentMethod =
				paymentTab === 'upi' ? `UPI Demo (${selectedUpiApp})` : 'Card Demo (Visa/Mastercard)';
			hiddenPaymentOrderId = orderData.id;
			hiddenPaymentId = orderData.paymentId;
			hiddenPaymentSignature = orderData.paymentSignature;

			await tick();
			isProcessingPayment = false;
			paymentModalOpen = false;

			if (formElement) {
				formElement.submit();
			}
		} catch (err: any) {
			isProcessingPayment = false;
			addToast(err?.message || 'Payment failed. Please try again.', 'error');
		}
	}

	function printSlip() {
		if (typeof window !== 'undefined') {
			window.print();
		}
	}
</script>

<svelte:head>
	<title>{doctor.name} | Direct Appointment Booking | Bloodline Pathology</title>
</svelte:head>

<div class="container mx-auto px-4 max-w-4xl py-8">
	{#if form?.success}
		<!-- Confirmation Card with Print Option -->
		<div id="booking-receipt" class="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 text-center relative overflow-hidden">
			<!-- Top accent strip -->
			<div class="bg-emerald-600 text-white py-1.5 px-4 -mx-8 -mt-8 mb-6 flex items-center justify-between text-xs">
				<span class="font-bold uppercase tracking-wider">Bloodline Pathology</span>
				<span class="font-mono text-[11px]">Appointment Receipt</span>
			</div>

			<div class="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-100">
				<CheckCircle2 class="w-7 h-7 stroke-[2.5]" />
			</div>

			<span class="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
				{form.paymentStatus === 'paid' ? 'Payment Verified & Confirmed' : 'Appointment Scheduled (Pay at Clinic)'}
			</span>
			<h2 class="text-xl sm:text-2xl font-extrabold text-slate-900">
				{form.paymentStatus === 'paid' ? 'Consultation Confirmed & Paid!' : 'Consultation Booked!'}
			</h2>
			<p class="text-xs text-slate-500 mt-1">
				{data.user
					? 'Saved to your account history.'
					: 'Booked directly without creating an account.'}
				Confirmation details sent for <span class="font-semibold text-slate-700">{form.patientPhone}</span>.
			</p>

			<!-- Summary receipt box -->
			<div class="mt-6 text-left bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200 space-y-2.5 text-xs">
				<div class="flex justify-between border-b border-slate-200 pb-2">
					<span class="text-slate-500">Appointment ID</span>
					<span class="font-mono font-bold text-slate-900">{form.appointmentId}</span>
				</div>
				<div class="flex justify-between border-b border-slate-200 pb-2">
					<span class="text-slate-500">Patient Name</span>
					<span class="font-semibold text-slate-900">{form.patientName}</span>
				</div>
				<div class="flex justify-between border-b border-slate-200 pb-2">
					<span class="text-slate-500">Doctor</span>
					<span class="font-semibold text-slate-900">{form.doctorName} ({form.doctorSpecialty})</span>
				</div>
				<div class="flex justify-between border-b border-slate-200 pb-2">
					<span class="text-slate-500">Date & Slot</span>
					<span class="font-semibold text-slate-900">{form.appointmentDate} at {form.appointmentTime}</span>
				</div>
				<div class="flex justify-between border-b border-slate-200 pb-2">
					<span class="text-slate-500">Booking Channel</span>
					{#if form.bookingSource === 'doctor_qr'}
						<span class="font-bold text-purple-700 flex items-center gap-1">
							<QrCode class="w-3.5 h-3.5" /> Doctor QR ({form.referralQrCode})
						</span>
					{:else}
						<span class="font-medium text-slate-700 flex items-center gap-1">
							<Globe class="w-3.5 h-3.5 text-slate-500" /> Direct Web Booking
						</span>
					{/if}
				</div>
				<div class="flex justify-between border-b border-slate-200 pb-2">
					<span class="text-slate-500">Payment Status</span>
					{#if form.paymentStatus === 'paid'}
						<span class="font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded">
							<ShieldCheck class="w-3.5 h-3.5" /> PAID ({form.paymentMethod || 'Online'})
						</span>
					{:else}
						<span class="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
							Pay at Clinic on Visit
						</span>
					{/if}
				</div>
				{#if form.paymentId}
					<div class="flex justify-between border-b border-slate-200 pb-2">
						<span class="text-slate-500">Transaction ID</span>
						<span class="font-mono text-slate-700">{form.paymentId}</span>
					</div>
				{/if}
				{#if (form.discountPercent ?? 0) > 0}
					<div class="flex justify-between border-b border-slate-200 pb-2">
						<span class="text-slate-500">Standard Consultation Fee</span>
						<span class="line-through text-slate-400">₹{form.originalFee}</span>
					</div>
					<div class="flex justify-between border-b border-slate-200 pb-2 text-emerald-700 font-semibold">
						<span>Repeat-Booking Member Discount ({form.discountPercent}%)</span>
						<span>-₹{form.discountAmount}</span>
					</div>
				{/if}
				<div class="flex justify-between pt-1">
					<span class="text-slate-700 font-bold">Total {form.paymentStatus === 'paid' ? 'Paid' : 'Payable'}</span>
					<span class="font-extrabold text-slate-900 text-sm">₹{form.consultationFee}</span>
				</div>
			</div>

			<div class="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
				<button
					type="button"
					onclick={printSlip}
					class="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
				>
					<Printer class="w-3.5 h-3.5" />
					Print Slip / Receipt
				</button>
				<Button variant="primary" size="sm" href="/book-appointment">
					Book Another Consultation
				</Button>
				{#if data.user || form.accountCreated}
					<Button variant="outline" size="sm" href="/dashboard?tab=appointments">
						View My History
					</Button>
				{:else}
					<Button variant="outline" size="sm" href="/">
						Return to Home
					</Button>
				{/if}
			</div>
		</div>

		<!-- Optional Account Creation Card (only for guests after booking) -->
		{#if form.accountCreated}
			<div class="max-w-xl mx-auto mt-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-xs text-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div class="flex items-start gap-3">
					<div class="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
						<Tag class="w-4 h-4" />
					</div>
					<div>
						<h3 class="font-bold text-sm text-emerald-900">Account Created &amp; Booking Linked!</h3>
						<p class="text-emerald-800 mt-0.5">
							Signed in as <span class="font-semibold">{form.createdUserEmail}</span>. Your history is saved and your <strong>15% Repeat-Booking Discount</strong> is now unlocked for your next appointment!
						</p>
					</div>
				</div>
				<Button variant="primary" size="sm" href="/dashboard?tab=appointments">
					Open Dashboard
				</Button>
			</div>
		{:else if !data.user && showOptionalAccountForm}
			<div class="max-w-xl mx-auto mt-6 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 text-xs">
				<div class="flex items-start justify-between gap-3 mb-4">
					<div class="flex items-start gap-3">
						<div class="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
							<History class="w-4 h-4" />
						</div>
						<div>
							<span class="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold text-[10px] uppercase tracking-wide mb-1">
								Optional • Not Required
							</span>
							<h3 class="text-sm font-bold text-slate-900">
								Want to save booking history &amp; get 15% OFF your 2nd appointment?
							</h3>
							<p class="text-slate-500 mt-0.5">
								Your appointment is already confirmed. Create a free account below if you'd like to track past visits and automatically receive 15% off on your next booking.
							</p>
						</div>
					</div>
					<button
						type="button"
						onclick={() => (showOptionalAccountForm = false)}
						class="text-slate-400 hover:text-slate-600 text-[11px] font-medium shrink-0 cursor-pointer"
					>
						Skip
					</button>
				</div>

				{#if form?.accountError}
					<div class="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200 flex items-center gap-2">
						<AlertCircle class="w-4 h-4 shrink-0" />
						<span>{form.accountError}</span>
					</div>
				{/if}

				<form
					method="POST"
					action="?/createAccount"
					use:enhance={() => {
						creatingAccount = true;
						return async ({ update }) => {
							creatingAccount = false;
							await update();
							await invalidateAll();
						};
					}}
					class="space-y-3"
				>
					<input type="hidden" name="appointmentId" value={form.appointmentId} />
					<input type="hidden" name="storeAppointmentId" value={form.storeAppointmentId || form.appointmentId} />

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<label for="optName" class="block font-semibold text-slate-700 mb-1">Full Name</label>
							<input
								id="optName"
								name="name"
								type="text"
								required
								bind:value={optName}
								class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
							/>
						</div>
						<div>
							<label for="optPhone" class="block font-semibold text-slate-700 mb-1">Mobile Number</label>
							<input
								id="optPhone"
								name="phone"
								type="tel"
								required
								bind:value={optPhone}
								class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
							/>
						</div>
					</div>

					<div>
						<label for="optEmail" class="block font-semibold text-slate-700 mb-1">Email Address</label>
						<input
							id="optEmail"
							name="email"
							type="email"
							required
							bind:value={optEmail}
							placeholder="you@example.com"
							class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
						/>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<label for="optPassword" class="block font-semibold text-slate-700 mb-1">Create Password</label>
							<input
								id="optPassword"
								name="password"
								type="password"
								required
								minlength="6"
								bind:value={optPassword}
								placeholder="Min. 6 characters"
								class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
							/>
						</div>
						<div>
							<label for="optConfirmPassword" class="block font-semibold text-slate-700 mb-1">Confirm Password</label>
							<input
								id="optConfirmPassword"
								name="confirmPassword"
								type="password"
								required
								minlength="6"
								bind:value={optConfirmPassword}
								placeholder="Re-enter password"
								class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
							/>
						</div>
					</div>

					<div class="pt-1 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
						<button
							type="submit"
							disabled={creatingAccount}
							class="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
						>
							<Lock class="w-3.5 h-3.5" />
							<span>{creatingAccount ? 'Creating Account...' : 'Create Optional Account & Save Booking'}</span>
						</button>
						<button
							type="button"
							onclick={() => (showOptionalAccountForm = false)}
							class="text-slate-500 hover:text-slate-700 text-xs font-medium cursor-pointer"
						>
							No thanks, continue without account
						</button>
					</div>
				</form>
			</div>
		{/if}
	{:else}
		<!-- Back link -->
		<a href="/book-appointment" class="text-xs text-slate-500 hover:text-red-600 transition-colors mb-3 inline-flex items-center gap-1">
			← Back to all doctors
		</a>

		<!-- Direct Booking / Member Discount Banner -->
		{#if pricing.isReturningMember}
			<div class="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
				<div class="flex items-center gap-2 text-emerald-900">
					<Tag class="w-4 h-4 text-emerald-600 shrink-0" />
					<span>
						<strong>{pricing.discountPercent}% Repeat-Booking Discount Applied!</strong>
						You save <strong>₹{pricing.discountAmount}</strong> as a returning member ({pricing.previousBookingsCount} previous booking{pricing.previousBookingsCount > 1 ? 's' : ''}).
					</span>
				</div>
				<span class="text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-semibold shrink-0">
					{data.user?.name}
				</span>
			</div>
		{:else if data.user}
			<div class="mb-4 bg-sky-50 border border-sky-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
				<div class="flex items-center gap-2 text-sky-900">
					<Sparkles class="w-4 h-4 text-sky-600 shrink-0" />
					<span>
						<strong>Account Active:</strong> This appointment will be saved to your history &amp; unlocks <strong>15% off</strong> on your 2nd appointment!
					</span>
				</div>
				<span class="text-[11px] text-sky-800 bg-sky-100 px-2 py-0.5 rounded font-medium shrink-0">
					Logged in as {data.user.name}
				</span>
			</div>
		{:else}
			<div class="mb-4 bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
				<div class="flex items-center gap-2 text-emerald-800">
					<ShieldCheck class="w-4 h-4 text-emerald-600 shrink-0" />
					<span>
						<strong>Direct Booking (No Account Required):</strong> Complete payment to confirm right away. Optionally create an account later to save history &amp; get <strong>15% off</strong> your 2nd booking.
					</span>
				</div>
				<a href="/login?redirectTo=/book-appointment/{doctor.id}" class="text-[11px] font-semibold text-emerald-800 underline hover:text-emerald-950 shrink-0">
					Have an account? Sign in
				</a>
			</div>
		{/if}

		<!-- QR Referral Attribution Banner (if scanned via clinic QR standee) -->
		{#if data.isQrReferral}
			<div class="mb-4 bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center gap-3 text-xs">
				<div class="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
					<QrCode class="w-4 h-4" />
				</div>
				<div class="flex-1">
					<p class="font-bold text-purple-900 flex items-center gap-1.5">
						<span>Referred via Dr. {doctor.name}'s Clinic QR Code</span>
						<span class="font-mono bg-purple-200 text-purple-900 px-1.5 py-0.2 rounded text-[10px]">
							{data.referralCode}
						</span>
					</p>
					<p class="text-[11px] text-purple-700 mt-0.5">
						Your appointment is directly prioritized under Dr. {doctor.name}'s consultation queue.
					</p>
				</div>
			</div>
		{/if}

		<!-- Doctor Summary Card -->
		<Card class="mt-2">
			<div class="flex flex-col sm:flex-row items-start gap-4">
				<div class="w-16 h-16 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-2xl font-bold shrink-0 border border-red-100">
					+
				</div>
				<div class="flex-1 min-w-0">
					<div class="flex flex-wrap items-center gap-2">
						<h1 class="text-xl font-bold text-slate-900">{doctor.name}</h1>
						<span class="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-semibold">
							{doctor.specialty}
						</span>
					</div>

					<div class="flex flex-wrap gap-3 mt-2 text-xs text-slate-600">
						<span class="flex items-center gap-1">
							<GraduationCap class="w-3.5 h-3.5 text-slate-400" />
							{doctor.qualification}
						</span>
						<span class="flex items-center gap-1">
							<Clock class="w-3.5 h-3.5 text-slate-400" />
							{doctor.experienceYears} yrs experience
						</span>
						<span class="flex items-center gap-1 font-bold text-slate-900">
							<IndianRupee class="w-3.5 h-3.5 text-slate-400" />
							{#if pricing.discountPercent > 0}
								<span class="line-through text-slate-400 font-normal">₹{pricing.originalFee}</span>
								<span class="text-emerald-700">₹{pricing.finalFee}</span>
								<span class="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
									{pricing.discountPercent}% OFF
								</span>
							{:else}
								₹{doctor.consultationFee} fee
							{/if}
						</span>
					</div>
				</div>
			</div>
		</Card>

		<!-- Date & Slot Picker -->
		<div class="mt-6 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
			<h2 class="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
				<Calendar class="w-4 h-4 text-red-600" />
				Step 1: Choose Appointment Date & Time
			</h2>

			<!-- Date Tabs -->
			<div class="flex gap-2 overflow-x-auto pb-2 mb-4">
				{#each dates as dateItem}
					{@const hasSlots = doctor.slots.some((s: any) => s.date === dateItem.date)}
					<button
						type="button"
						onclick={() => { selectedDate = dateItem.date; selectedSlotId = ''; }}
						class="flex flex-col items-center px-3.5 py-2 rounded-xl border-2 transition-all min-w-[75px] shrink-0 cursor-pointer
							{selectedDate === dateItem.date
								? 'border-red-600 bg-red-50 text-red-700 font-bold'
								: hasSlots
									? 'border-slate-200 bg-white text-slate-700 hover:border-red-300'
									: 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'}"
						disabled={!hasSlots}
					>
						<span class="text-[10px] font-medium">{dateItem.day}</span>
						<span class="text-xs font-bold mt-0.5">{dateItem.label}</span>
					</button>
				{/each}
			</div>

			<!-- Time Slots Grid -->
			{#if slotsForDate.length === 0}
				<div class="text-center py-6 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-500">
					No slots available for this date. Please select another date.
				</div>
			{:else}
				<div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
					{#each slotsForDate as slot}
						<button
							type="button"
							onclick={() => (selectedSlotId = slot.id)}
							class="px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer text-center
								{selectedSlotId === slot.id
									? 'border-red-600 bg-red-600 text-white shadow-2xs'
									: 'border-slate-200 bg-white text-slate-700 hover:border-red-300 hover:bg-red-50'}"
						>
							{slot.startTime.slice(0, 5)}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Patient Information & Direct Payment Form -->
		<div class="mt-6 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
			<h2 class="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
				<User class="w-4 h-4 text-red-600" />
				Step 2: Patient Details & Payment
			</h2>

			<form
				method="POST"
				action="?/book"
				bind:this={formElement}
				onsubmit={handleFormSubmit}
				class="space-y-4 text-xs"
			>
				<input type="hidden" name="doctorId" value={doctor.id} />
				<input type="hidden" name="slotId" value={selectedSlotId} />
				<input type="hidden" name="referralCode" value={data.referralCode} />
				<input type="hidden" name="appointmentDate" value={selectedSlot?.date || ''} />
				<input type="hidden" name="appointmentTime" value={selectedSlot ? `${selectedSlot.startTime.slice(0, 5)} - ${selectedSlot.endTime.slice(0, 5)}` : ''} />
				<input type="hidden" name="paymentMode" value={hiddenPaymentMode} />
				<input type="hidden" name="paymentMethod" value={hiddenPaymentMethod} />
				<input type="hidden" name="paymentOrderId" value={hiddenPaymentOrderId} />
				<input type="hidden" name="paymentId" value={hiddenPaymentId} />
				<input type="hidden" name="paymentSignature" value={hiddenPaymentSignature} />

				<!-- Patient Name & Phone Inputs -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label for="patientName" class="block font-semibold text-slate-700 mb-1">
							Patient Full Name <span class="text-red-500">*</span>
						</label>
						<input
							id="patientName"
							name="patientName"
							type="text"
							required
							bind:value={patientName}
							placeholder="e.g. Ramesh Kumar"
							class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
						/>
					</div>
					<div>
						<label for="patientPhone" class="block font-semibold text-slate-700 mb-1">
							Mobile Number <span class="text-red-500">*</span>
						</label>
						<input
							id="patientPhone"
							name="patientPhone"
							type="tel"
							required
							bind:value={patientPhone}
							placeholder="e.g. 9876543210"
							class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
						/>
					</div>
				</div>

				<!-- Optional Email -->
				<div>
					<label for="patientEmail" class="block font-semibold text-slate-700 mb-1">
						Email Address <span class="text-slate-400 font-normal">(optional, for digital receipt)</span>
					</label>
					<input
						id="patientEmail"
						name="patientEmail"
						type="email"
						bind:value={patientEmail}
						placeholder="patient@example.com"
						class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
					/>
				</div>

				<!-- Consultation Reason -->
				<div>
					<label for="reason" class="block font-semibold text-slate-700 mb-1">
						Symptoms / Reason for Visit <span class="text-red-500">*</span>
					</label>
					<textarea
						id="reason"
						name="reason"
						bind:value={reason}
						rows="2"
						required
						minlength="3"
						placeholder="e.g. High fever, chest pain follow-up, general health evaluation..."
						class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
					></textarea>
				</div>

				<!-- Payment Options Selector -->
				<div class="pt-2">
					<span class="block font-semibold text-slate-800 mb-2">Select Payment Method</span>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<!-- Option 1: Demo Instant Online Payment -->
						<label
							class="relative flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all
								{selectedPaymentMode === 'demo_online'
									? 'border-red-600 bg-red-50/40 text-slate-900 shadow-2xs'
									: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}"
						>
							<input
								type="radio"
								name="paymentModeRadio"
								value="demo_online"
								bind:group={selectedPaymentMode}
								class="mt-0.5 text-red-600 focus:ring-red-500"
							/>
							<div class="flex-1">
								<div class="flex items-center gap-1.5 font-bold text-xs">
									<Sparkles class="w-3.5 h-3.5 text-red-600" />
									<span>Demo Instant Payment (UPI / Cards)</span>
								</div>
								<span class="block text-[11px] text-slate-500 mt-0.5">
									Instant confirmation with demo gateway simulation (no real card charged).
								</span>
							</div>
						</label>

						<!-- Option 2: Pay at Clinic -->
						<label
							class="relative flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all
								{selectedPaymentMode === 'pay_at_clinic'
									? 'border-red-600 bg-red-50/40 text-slate-900 shadow-2xs'
									: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}"
						>
							<input
								type="radio"
								name="paymentModeRadio"
								value="pay_at_clinic"
								bind:group={selectedPaymentMode}
								class="mt-0.5 text-red-600 focus:ring-red-500"
							/>
							<div class="flex-1">
								<div class="flex items-center gap-1.5 font-bold text-xs">
									<Building2 class="w-3.5 h-3.5 text-slate-700" />
									<span>Pay at Clinic on Visit</span>
								</div>
								<span class="block text-[11px] text-slate-500 mt-0.5">
									Confirm your slot now and pay cash or UPI at the clinic reception.
								</span>
							</div>
						</label>
					</div>
				</div>

				<!-- Summary Card -->
				<div class="bg-slate-50 rounded-xl p-3.5 border border-slate-200 mt-2 space-y-1.5 text-xs">
					<div class="flex justify-between">
						<span class="text-slate-500">Doctor Consultation:</span>
						<span class="font-bold text-slate-900">{doctor.name} ({doctor.specialty})</span>
					</div>
					{#if selectedSlot}
						<div class="flex justify-between">
							<span class="text-slate-500">Scheduled Date & Slot:</span>
							<span class="font-semibold text-slate-800">{selectedSlot.date} at {selectedSlot.startTime.slice(0, 5)}</span>
						</div>
					{/if}
					{#if pricing.discountPercent > 0}
						<div class="flex justify-between">
							<span class="text-slate-500">Consultation Fee:</span>
							<span class="text-slate-600 line-through">₹{pricing.originalFee}</span>
						</div>
						<div class="flex justify-between text-emerald-700 font-semibold">
							<span>Repeat-Booking Discount ({pricing.discountPercent}%):</span>
							<span>-₹{pricing.discountAmount}</span>
						</div>
					{/if}
					<div class="flex justify-between pt-1 border-t border-slate-200 text-sm">
						<span class="text-slate-800 font-bold">Total Payable:</span>
						<span class="font-extrabold text-red-600">₹{pricing.finalFee}</span>
					</div>
				</div>

				<!-- Submit Button -->
				<button
					type="submit"
					class="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
				>
					{#if selectedPaymentMode === 'demo_online'}
						<span>Pay ₹{pricing.finalFee} &amp; Book Appointment</span>
						<ChevronRight class="w-4 h-4" />
					{:else}
						<span>Confirm Appointment (Pay at Clinic)</span>
						<ChevronRight class="w-4 h-4" />
					{/if}
				</button>
			</form>
		</div>
	{/if}
</div>

<!-- Interactive Demo Payment Simulator Modal -->
<Modal bind:open={paymentModalOpen} title="Bloodline Pathology — Demo Payment Gateway" size="md">
	<div class="space-y-4 text-xs">
		<!-- Transaction Amount Header -->
		<div class="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between">
			<div>
				<span class="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Simulated Checkout</span>
				<p class="text-sm font-bold">{doctor.name} Consultation</p>
			</div>
			<div class="text-right">
				<span class="text-[10px] text-slate-400 block">Payable</span>
				<span class="text-lg font-extrabold text-emerald-400">₹{pricing.finalFee}</span>
			</div>
		</div>

		<!-- Payment Tabs -->
		<div class="flex border-b border-slate-200">
			<button
				type="button"
				onclick={() => (paymentTab = 'upi')}
				class="flex-1 py-2 font-bold text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer
					{paymentTab === 'upi' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'}"
			>
				<Smartphone class="w-3.5 h-3.5" />
				UPI (GPay / PhonePe / Paytm)
			</button>
			<button
				type="button"
				onclick={() => (paymentTab = 'card')}
				class="flex-1 py-2 font-bold text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer
					{paymentTab === 'card' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'}"
			>
				<CreditCard class="w-3.5 h-3.5" />
				Credit / Debit Card (Demo)
			</button>
		</div>

		{#if paymentTab === 'upi'}
			<!-- UPI Demo Options -->
			<div class="space-y-3">
				<span class="text-[11px] text-slate-500 block">Select Instant Demo UPI App:</span>
				<div class="grid grid-cols-3 gap-2">
					{#each ['Google Pay', 'PhonePe', 'Paytm'] as app}
						<button
							type="button"
							onclick={() => (selectedUpiApp = app)}
							class="p-2.5 rounded-xl border text-center transition-all cursor-pointer
								{selectedUpiApp === app
									? 'border-red-600 bg-red-50 text-red-700 font-bold shadow-2xs'
									: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}"
						>
							<span class="block text-xs font-semibold">{app}</span>
							<span class="block text-[9px] text-slate-400">Demo Instant</span>
						</button>
					{/each}
				</div>

				<div>
					<label for="demoUpiId" class="block font-semibold text-slate-700 mb-1">UPI ID</label>
					<input
						id="demoUpiId"
						type="text"
						bind:value={demoUpiId}
						class="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono text-slate-700 bg-slate-50"
					/>
				</div>
			</div>
		{:else}
			<!-- Card Demo Options -->
			<div class="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
				<div>
					<label for="demoCardNum" class="block text-[11px] font-semibold text-slate-600 mb-1">Simulated Card Number</label>
					<input
						id="demoCardNum"
						type="text"
						readonly
						value="4111 •••• •••• 4444"
						class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-mono bg-white"
					/>
				</div>
				<div class="grid grid-cols-2 gap-2">
					<div>
						<label for="demoCardExp" class="block text-[11px] font-semibold text-slate-600 mb-1">Expiry</label>
						<input
							id="demoCardExp"
							type="text"
							readonly
							value="12 / 28"
							class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-mono bg-white"
						/>
					</div>
					<div>
						<label for="demoCardCvv" class="block text-[11px] font-semibold text-slate-600 mb-1">CVV</label>
						<input
							id="demoCardCvv"
							type="text"
							readonly
							value="••• (123)"
							class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-mono bg-white"
						/>
					</div>
				</div>
				<p class="text-[10px] text-slate-400">This is a sandbox test card. No real money is charged.</p>
			</div>
		{/if}

		<!-- Security reassurance -->
		<div class="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-slate-500 text-[11px]">
			<ShieldCheck class="w-4 h-4 text-emerald-600 shrink-0" />
			<span>Simulated 256-bit encrypted clinical payment checkout.</span>
		</div>

		<!-- Action buttons -->
		<div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
			<button
				type="button"
				onclick={() => (paymentModalOpen = false)}
				class="px-3 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium text-xs cursor-pointer"
				disabled={isProcessingPayment}
			>
				Cancel
			</button>

			<button
				type="button"
				onclick={simulatePaymentSuccess}
				disabled={isProcessingPayment}
				class="flex-1 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
			>
				{#if isProcessingPayment}
					<span class="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
					<span>{paymentProcessingStep}</span>
				{:else}
					<span>Pay ₹{pricing.finalFee} (Demo Success)</span>
					<ChevronRight class="w-4 h-4" />
				{/if}
			</button>
		</div>
	</div>
</Modal>
