import { z } from 'zod';

const indianPhoneRegex = /^[6-9]\d{9}$/;

// ── Auth Schemas ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
	email: z.string().email('Please enter a valid email address'),
	password: z.string().min(6, 'Password must be at least 6 characters')
});

export const registerSchema = z
	.object({
		name: z.string().min(2, 'Name must be at least 2 characters'),
		email: z.string().email('Please enter a valid email address'),
		phone: z.string().regex(indianPhoneRegex, 'Please enter a valid 10-digit Indian phone number'),
		password: z.string().min(6, 'Password must be at least 6 characters'),
		confirmPassword: z.string()
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword']
	});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// ── Appointment Schema ───────────────────────────────────────────────────────

export const appointmentSchema = z.object({
	doctorId: z.string().uuid('Invalid doctor ID'),
	slotId: z.string().uuid('Invalid slot ID'),
	reason: z
		.string()
		.min(5, 'Please describe your reason in at least 5 characters')
		.max(500, 'Reason must not exceed 500 characters')
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;

// ── Test Booking Schema ──────────────────────────────────────────────────────

export const testBookingSchema = z.object({
	patientName: z.string().min(2, 'Patient name must be at least 2 characters'),
	patientPhone: z
		.string()
		.regex(indianPhoneRegex, 'Please enter a valid 10-digit Indian phone number'),
	patientAge: z
		.number()
		.int()
		.min(1, 'Age must be at least 1')
		.max(150, 'Age must be at most 150'),
	patientGender: z.enum(['male', 'female', 'other']),
	address: z.string().min(10, 'Address must be at least 10 characters'),
	testIds: z.array(z.string().min(1)).min(1, 'Please select at least one test'),
	collectionDate: z.string().min(1, 'Please select a collection date'),
	collectionSlot: z.enum(['8AM-10AM', '10AM-12PM', '12PM-2PM', '2PM-4PM'])
});

export type TestBookingInput = z.infer<typeof testBookingSchema>;

// ── Express Booking Schema (quick guest booking from navbar) ─────────────────

export const EXPRESS_SLOTS = ['8AM-10AM', '10AM-12PM', '12PM-2PM', '2PM-4PM'] as const;
export const EXPRESS_SERVICE_TYPES = ['lab_test', 'doctor_consultation', 'general'] as const;

const emptyToUndefined = (value: unknown) =>
	value === '' || value === null || value === undefined ? undefined : value;

const optionalText = (max: number) =>
	z.preprocess(
		(value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
		z.string().trim().max(max).optional()
	);

export const expressBookingSchema = z.object({
	name: optionalText(120),
	phone: z
		.string()
		.trim()
		.regex(indianPhoneRegex, 'Please enter a valid 10-digit Indian phone number'),
	gender: z.preprocess(
		emptyToUndefined,
		z.enum(['male', 'female', 'other'], 'Please select a valid gender').optional()
	),
	age: z.preprocess(
		emptyToUndefined,
		z.coerce
			.number()
			.int('Age must be a whole number')
			.min(1, 'Age must be at least 1')
			.max(150, 'Age must be at most 150')
			.optional()
	),
	serviceType: z.enum(EXPRESS_SERVICE_TYPES).default('lab_test'),
	serviceName: optionalText(160),
	preferredDate: z.preprocess(
		emptyToUndefined,
		z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid preferred date')
			.optional()
	),
	preferredSlot: z.preprocess(emptyToUndefined, z.enum(EXPRESS_SLOTS).optional()),
	notes: optionalText(500)
});

export type ExpressBookingInput = z.infer<typeof expressBookingSchema>;
