import {
	pgTable,
	text,
	timestamp,
	integer,
	boolean,
	decimal,
	uuid,
	date,
	time,
	pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'doctor']);

export const appointmentStatusEnum = pgEnum('appointment_status', [
	'pending',
	'confirmed',
	'completed',
	'cancelled'
]);

export const testBookingStatusEnum = pgEnum('test_booking_status', [
	'pending',
	'confirmed',
	'sample_collected',
	'processing',
	'completed',
	'cancelled'
]);

export const paymentStatusEnum = pgEnum('payment_status', [
	'created',
	'paid',
	'failed',
	'refunded'
]);

// ── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	phone: text('phone'),
	passwordHash: text('password_hash'),
	role: userRoleEnum('role').notNull().default('user'),
	googleId: text('google_id').unique(),
	avatarUrl: text('avatar_url'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const usersRelations = relations(users, ({ many }) => ({
	appointments: many(appointments),
	testBookings: many(testBookings),
	payments: many(payments),
	sessions: many(sessions)
}));

// ── Doctors ──────────────────────────────────────────────────────────────────

export const doctors = pgTable('doctors', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').references(() => users.id),
	name: text('name').notNull(),
	specialty: text('specialty').notNull(),
	qualification: text('qualification').notNull(),
	experienceYears: integer('experience_years').notNull(),
	bio: text('bio').notNull(),
	imageUrl: text('image_url'),
	consultationFee: decimal('consultation_fee', { precision: 10, scale: 2 }).notNull(),
	isActive: boolean('is_active').notNull().default(true),
	qrCode: text('qr_code').unique(),
	commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).default('15.00'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
	user: one(users, { fields: [doctors.userId], references: [users.id] }),
	slots: many(doctorSlots),
	appointments: many(appointments)
}));

// ── Doctor Slots ─────────────────────────────────────────────────────────────

export const doctorSlots = pgTable('doctor_slots', {
	id: uuid('id').primaryKey().defaultRandom(),
	doctorId: uuid('doctor_id')
		.notNull()
		.references(() => doctors.id),
	date: date('date').notNull(),
	startTime: time('start_time').notNull(),
	endTime: time('end_time').notNull(),
	isBooked: boolean('is_booked').notNull().default(false)
});

export const doctorSlotsRelations = relations(doctorSlots, ({ one }) => ({
	doctor: one(doctors, { fields: [doctorSlots.doctorId], references: [doctors.id] })
}));

// ── Payments ─────────────────────────────────────────────────────────────────

export const payments = pgTable('payments', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').references(() => users.id),
	amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
	razorpayOrderId: text('razorpay_order_id'),
	razorpayPaymentId: text('razorpay_payment_id'),
	razorpaySignature: text('razorpay_signature'),
	status: paymentStatusEnum('status').notNull().default('created'),
	type: text('type').notNull(), // 'appointment' | 'test'
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const paymentsRelations = relations(payments, ({ one }) => ({
	user: one(users, { fields: [payments.userId], references: [users.id] })
}));

// ── Appointments ─────────────────────────────────────────────────────────────

export const appointments = pgTable('appointments', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').references(() => users.id),
	doctorId: uuid('doctor_id')
		.notNull()
		.references(() => doctors.id),
	slotId: uuid('slot_id')
		.notNull()
		.references(() => doctorSlots.id),
	reason: text('reason').notNull(),
	patientName: text('patient_name'),
	patientPhone: text('patient_phone'),
	bookingSource: text('booking_source').notNull().default('direct'), // 'direct' | 'doctor_qr'
	referralQrCode: text('referral_qr_code'),
	referringDoctorId: uuid('referring_doctor_id').references(() => doctors.id),
	consultationFee: decimal('consultation_fee', { precision: 10, scale: 2 }).default('0.00'),
	commissionAmount: decimal('commission_amount', { precision: 10, scale: 2 }).default('0.00'),
	status: appointmentStatusEnum('status').notNull().default('pending'),
	paymentId: uuid('payment_id').references(() => payments.id),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const appointmentsRelations = relations(appointments, ({ one }) => ({
	user: one(users, { fields: [appointments.userId], references: [users.id] }),
	doctor: one(doctors, { fields: [appointments.doctorId], references: [doctors.id] }),
	slot: one(doctorSlots, { fields: [appointments.slotId], references: [doctorSlots.id] }),
	payment: one(payments, { fields: [appointments.paymentId], references: [payments.id] })
}));

// ── Tests ────────────────────────────────────────────────────────────────────

export const tests = pgTable('tests', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	description: text('description').notNull(),
	price: decimal('price', { precision: 8, scale: 2 }).notNull(),
	category: text('category').notNull(),
	preparationInstructions: text('preparation_instructions'),
	turnaroundHours: integer('turnaround_hours').notNull().default(24),
	isActive: boolean('is_active').notNull().default(true)
});

// ── Test Bookings ────────────────────────────────────────────────────────────

export const testBookings = pgTable('test_bookings', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id),
	patientName: text('patient_name').notNull(),
	patientPhone: text('patient_phone').notNull(),
	patientAge: integer('patient_age').notNull(),
	patientGender: text('patient_gender').notNull(),
	address: text('address').notNull(),
	collectionDate: date('collection_date').notNull(),
	collectionSlot: text('collection_slot').notNull(),
	status: testBookingStatusEnum('status').notNull().default('pending'),
	totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
	paymentId: uuid('payment_id').references(() => payments.id),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const testBookingsRelations = relations(testBookings, ({ one, many }) => ({
	user: one(users, { fields: [testBookings.userId], references: [users.id] }),
	payment: one(payments, { fields: [testBookings.paymentId], references: [payments.id] }),
	items: many(testBookingItems),
	reports: many(reports)
}));

// ── Test Booking Items ───────────────────────────────────────────────────────

export const testBookingItems = pgTable('test_booking_items', {
	id: uuid('id').primaryKey().defaultRandom(),
	bookingId: uuid('booking_id')
		.notNull()
		.references(() => testBookings.id),
	testId: uuid('test_id')
		.notNull()
		.references(() => tests.id)
});

export const testBookingItemsRelations = relations(testBookingItems, ({ one }) => ({
	booking: one(testBookings, {
		fields: [testBookingItems.bookingId],
		references: [testBookings.id]
	}),
	test: one(tests, { fields: [testBookingItems.testId], references: [tests.id] })
}));

// ── Reports ──────────────────────────────────────────────────────────────────

export const reports = pgTable('reports', {
	id: uuid('id').primaryKey().defaultRandom(),
	bookingId: uuid('booking_id')
		.notNull()
		.references(() => testBookings.id),
	testId: uuid('test_id')
		.notNull()
		.references(() => tests.id),
	fileUrl: text('file_url').notNull(),
	resultSummary: text('result_summary'),
	uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow()
});

export const reportsRelations = relations(reports, ({ one }) => ({
	booking: one(testBookings, { fields: [reports.bookingId], references: [testBookings.id] }),
	test: one(tests, { fields: [reports.testId], references: [tests.id] })
}));

// ── Sessions ──────────────────────────────────────────────────────────────────

export const sessions = pgTable('sessions', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	accessTokenHash: text('access_token_hash').notNull().unique(),
	refreshTokenHash: text('refresh_token_hash').notNull().unique(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	revokedAt: timestamp('revoked_at', { withTimezone: true }),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] })
}));
