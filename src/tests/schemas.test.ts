import { describe, expect, it } from 'bun:test';
import { loginSchema, registerSchema, testBookingSchema, appointmentSchema } from '../lib/schemas';

describe('Validation Schemas (Zod)', () => {
	it('validates correct login credentials', () => {
		const valid = loginSchema.safeParse({
			email: 'patient@bloodlinepathology.in',
			password: 'password123'
		});
		expect(valid.success).toBe(true);
	});

	it('rejects invalid email for login', () => {
		const invalid = loginSchema.safeParse({
			email: 'not-an-email',
			password: 'password123'
		});
		expect(invalid.success).toBe(false);
	});

	it('validates blood sample booking form details', () => {
		const valid = testBookingSchema.safeParse({
			patientName: 'Ramesh Kumar',
			patientPhone: '9876543210',
			patientAge: 45,
			patientGender: 'male',
			address: 'Sector 15, Vasundhara, New Delhi 110001',
			testIds: ['22222222-2222-2222-2222-222222222202'],
			collectionDate: '2026-11-06',
			collectionSlot: '8AM-10AM'
		});
		expect(valid.success).toBe(true);
	});

	it('rejects blood sample booking with no tests chosen', () => {
		const invalid = testBookingSchema.safeParse({
			patientName: 'Ramesh Kumar',
			patientPhone: '9876543210',
			patientAge: 45,
			patientGender: 'male',
			address: 'Sector 15, Vasundhara, New Delhi 110001',
			testIds: [],
			collectionDate: '2026-11-06',
			collectionSlot: '8AM-10AM'
		});
		expect(invalid.success).toBe(false);
	});
});

