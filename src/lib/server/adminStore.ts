import { MOCK_DOCTORS } from './mockData';
import { generateQrDataUrl } from './qr';

export interface DoctorReferralProfile {
	id: string;
	name: string;
	specialty: string;
	qualification: string;
	experienceYears: number;
	consultationFee: string;
	qrCode: string;
	commissionRate: number; // percentage, e.g. 15 for 15%
	clinicName: string;
}

export const REPEAT_BOOKING_DISCOUNT_PERCENT = 15;

function normalizePhone(phone?: string | null): string {
	const digits = (phone || '').replace(/\D/g, '');
	return digits.length > 10 ? digits.slice(-10) : digits;
}

export interface AppointmentPricing {
	originalFee: number;
	discountPercent: number;
	discountAmount: number;
	finalFee: number;
}

export interface AppointmentRecord {
	id: string;
	userId?: string | null;
	patientName: string;
	patientPhone: string;
	patientEmail?: string;
	doctorId: string;
	doctorName: string;
	doctorSpecialty: string;
	appointmentDate: string;
	appointmentTime: string;
	slotId: string;
	reason: string;
	status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
	bookingSource: 'direct' | 'doctor_qr';
	referralQrCode: string | null;
	originalFee?: number;
	discountPercent?: number;
	discountAmount?: number;
	consultationFee: number;
	commissionRate: number;
	commissionAmount: number;
	paymentStatus: 'paid' | 'pending' | 'pay_at_clinic';
	paymentMethod?: string;
	paymentId?: string;
	createdAt: string;
}

export interface TestBookingRecord {
	id: string;
	userId?: string | null;
	patientName: string;
	patientPhone: string;
	patientEmail?: string;
	patientAge: number;
	patientGender: string;
	address: string;
	collectionDate: string;
	collectionSlot: string;
	status: 'pending' | 'confirmed' | 'sample_collected' | 'processing' | 'completed' | 'cancelled';
	totalAmount: number;
	paymentStatus: 'paid' | 'pending';
	paymentMethod?: string;
	paymentId?: string;
	items: Array<{
		testId: string;
		test: { id: string; name: string; price: string; category: string };
	}>;
	createdAt: string;
}

// In-memory persistent state (survives requests during server lifecycle)
class AdminStore {
	private doctors: Map<string, DoctorReferralProfile> = new Map();
	private appointments: AppointmentRecord[] = [];
	private testBookings: TestBookingRecord[] = [];
	private bookedSlotIds: Set<string> = new Set();

	constructor() {
		this.initDoctors();
		this.initAppointments();
	}

	private initDoctors() {
		const initialProfiles: DoctorReferralProfile[] = [
			{
				id: '11111111-1111-1111-1111-111111111101',
				name: 'Dr. Rajesh Sharma',
				specialty: 'Cardiology',
				qualification: 'MBBS, MD, DM (Cardiology)',
				experienceYears: 18,
				consultationFee: '800.00',
				qrCode: 'DOC-QR-RAJESH-101',
				commissionRate: 15.0,
				clinicName: 'Heart Care Clinic, Sehore'
			},
			{
				id: '11111111-1111-1111-1111-111111111102',
				name: 'Dr. Priya Patel',
				specialty: 'Dermatology',
				qualification: 'MBBS, MD (Dermatology)',
				experienceYears: 12,
				consultationFee: '600.00',
				qrCode: 'DOC-QR-PRIYA-102',
				commissionRate: 15.0,
				clinicName: 'Skin & Allergy Center, Bhopal'
			},
			{
				id: '11111111-1111-1111-1111-111111111103',
				name: 'Dr. Amit Verma',
				specialty: 'Orthopedics',
				qualification: 'MBBS, MS (Orthopedics)',
				experienceYears: 15,
				consultationFee: '700.00',
				qrCode: 'DOC-QR-AMIT-103',
				commissionRate: 18.0,
				clinicName: 'Joint & Spine Clinic, Civil Lines'
			},
			{
				id: '11111111-1111-1111-1111-111111111104',
				name: 'Dr. Sneha Gupta',
				specialty: 'Pediatrics',
				qualification: 'MBBS, MD (Pediatrics)',
				experienceYears: 10,
				consultationFee: '500.00',
				qrCode: 'DOC-QR-SNEHA-104',
				commissionRate: 12.0,
				clinicName: 'Mother & Child Care, Sehore'
			},
			{
				id: '11111111-1111-1111-1111-111111111105',
				name: 'Dr. Vikram Singh',
				specialty: 'General Physician',
				qualification: 'MBBS, MD (Internal Medicine)',
				experienceYears: 20,
				consultationFee: '400.00',
				qrCode: 'DOC-QR-VIKRAM-105',
				commissionRate: 15.0,
				clinicName: 'Arogya Medical Clinic, Sehore'
			},
			{
				id: '11111111-1111-1111-1111-111111111106',
				name: 'Dr. Kavita Nair',
				specialty: 'Neurology',
				qualification: 'MBBS, MD, DM (Neurology)',
				experienceYears: 14,
				consultationFee: '900.00',
				qrCode: 'DOC-QR-KAVITA-106',
				commissionRate: 20.0,
				clinicName: 'Neuro Wellness Clinic, Bhopal'
			}
		];

		for (const doc of initialProfiles) {
			this.doctors.set(doc.id, doc);
		}
	}

	private initAppointments() {
		this.appointments = [];
	}

	// ── Doctor QR & Commission Methods ─────────────────────────────────────────

	public getAllDoctors() {
		return Array.from(this.doctors.values());
	}

	public getDoctorById(id: string) {
		return this.doctors.get(id);
	}

	public getDoctorByQrCode(qrCode: string) {
		const clean = qrCode.trim().toUpperCase();
		for (const doc of this.doctors.values()) {
			if (doc.qrCode.toUpperCase() === clean) return doc;
		}
		return undefined;
	}

	public generateDoctorQrCode(doctorId: string, customCode?: string): string {
		const doc = this.doctors.get(doctorId);
		if (!doc) throw new Error('Doctor not found');

		let newCode: string;
		if (customCode?.trim()) {
			newCode = customCode.trim().toUpperCase();
		} else {
			const nameSlug = doc.name.replace(/dr\.?\s+/i, '').replace(/[^a-zA-Z]/g, '').slice(0, 6).toUpperCase();
			// Use 6-digit random for lower collision probability (matching addDoctor)
			let candidate: string;
			do {
				candidate = `DOC-QR-${nameSlug}-${Math.floor(100000 + Math.random() * 900000)}`;
			} while (this.isQrCodeTaken(candidate, doctorId));
			newCode = candidate;
		}

		doc.qrCode = newCode;
		this.doctors.set(doctorId, doc);
		return newCode;
	}

	/** Check whether a QR code string is already assigned to another doctor */
	private isQrCodeTaken(code: string, excludeDoctorId?: string): boolean {
		const upper = code.toUpperCase();
		for (const doc of this.doctors.values()) {
			if (doc.id !== excludeDoctorId && doc.qrCode.toUpperCase() === upper) return true;
		}
		return false;
	}

	public updateDoctorCommission(doctorId: string, commissionRate: number) {
		const doc = this.doctors.get(doctorId);
		if (!doc) throw new Error('Doctor not found');
		doc.commissionRate = Math.max(0, Math.min(100, commissionRate));
		this.doctors.set(doctorId, doc);
		return doc;
	}

	public async getDoctorWithStatsAndQr(doctorId: string, host = 'localhost:5173') {
		const doc = this.doctors.get(doctorId);
		if (!doc) return null;

		const appts = this.appointments.filter((a) => a.doctorId === doctorId);
		const qrAppts = appts.filter((a) => a.bookingSource === 'doctor_qr');
		const directAppts = appts.filter((a) => a.bookingSource === 'direct');
		const totalCommission = qrAppts.reduce((sum, a) => sum + (a.status !== 'cancelled' ? a.commissionAmount : 0), 0);

		// Booking URL scanned by patients
		const protocol = host.startsWith('localhost') ? 'http' : 'https';
		const bookingUrl = `${protocol}://${host}/book-appointment/${doc.id}?ref=${doc.qrCode}`;
		const qrDataUrl = await generateQrDataUrl(bookingUrl);

		return {
			...doc,
			totalAppointments: appts.length,
			qrAppointments: qrAppts.length,
			directAppointments: directAppts.length,
			totalCommission,
			bookingUrl,
			qrDataUrl
		};
	}

	public async getAllDoctorsWithStats(host = 'localhost:5173') {
		const results = [];
		for (const doc of this.doctors.values()) {
			const item = await this.getDoctorWithStatsAndQr(doc.id, host);
			if (item) results.push(item);
		}
		return results;
	}

	// ── Appointment Requests Methods ───────────────────────────────────────────

	public getAllAppointments(filters?: {
		source?: 'all' | 'direct' | 'doctor_qr';
		status?: string;
		doctorId?: string;
		search?: string;
	}) {
		let list = [...this.appointments];

		if (filters?.source && filters.source !== 'all') {
			list = list.filter((a) => a.bookingSource === filters.source);
		}

		if (filters?.status && filters.status !== 'all') {
			list = list.filter((a) => a.status === filters.status);
		}

		if (filters?.doctorId) {
			list = list.filter((a) => a.doctorId === filters.doctorId);
		}

		if (filters?.search) {
			const q = filters.search.toLowerCase();
			list = list.filter(
				(a) =>
					a.patientName.toLowerCase().includes(q) ||
					a.patientPhone.toLowerCase().includes(q) ||
					a.doctorName.toLowerCase().includes(q) ||
					(a.referralQrCode && a.referralQrCode.toLowerCase().includes(q)) ||
					a.id.toLowerCase().includes(q)
			);
		}

		// Sort newest first
		return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	}

	public getAppointmentById(id: string) {
		return this.appointments.find((a) => a.id === id);
	}

	public isSlotBooked(slotId: string): boolean {
		return this.bookedSlotIds.has(slotId);
	}

	public markSlotBooked(slotId: string): void {
		if (slotId) this.bookedSlotIds.add(slotId);
	}

	public calculateAppointmentPricing(baseFee: number, isReturningMember: boolean): AppointmentPricing {
		const originalFee = Math.round(baseFee * 100) / 100;
		const discountPercent = isReturningMember ? REPEAT_BOOKING_DISCOUNT_PERCENT : 0;
		const discountAmount = isReturningMember
			? Math.round(((originalFee * discountPercent) / 100) * 100) / 100
			: 0;
		const finalFee = Math.max(0, Math.round((originalFee - discountAmount) * 100) / 100);
		return { originalFee, discountPercent, discountAmount, finalFee };
	}

	public getAppointmentsForUser(identity: {
		userId?: string | null;
		email?: string | null;
		phone?: string | null;
	}): AppointmentRecord[] {
		const targetEmail = identity.email?.trim().toLowerCase() || '';
		const targetPhone = normalizePhone(identity.phone);

		return this.appointments
			.filter((a) => {
				if (identity.userId && a.userId === identity.userId) return true;
				if (targetEmail && a.patientEmail?.trim().toLowerCase() === targetEmail) return true;
				if (targetPhone && normalizePhone(a.patientPhone) === targetPhone) return true;
				return false;
			})
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	}

	public hasPreviousBooking(identity: {
		userId?: string | null;
		email?: string | null;
		phone?: string | null;
	}): boolean {
		return this.getAppointmentsForUser(identity).some((a) => a.status !== 'cancelled');
	}

	public linkGuestAppointmentsToUser(params: {
		userId: string;
		email?: string | null;
		phone?: string | null;
		appointmentId?: string | null;
	}): number {
		const targetEmail = params.email?.trim().toLowerCase() || '';
		const targetPhone = normalizePhone(params.phone);
		let linked = 0;

		for (const appt of this.appointments) {
			if (appt.userId) continue;
			const matchesId = Boolean(params.appointmentId && appt.id === params.appointmentId);
			const matchesEmail = Boolean(targetEmail && appt.patientEmail?.trim().toLowerCase() === targetEmail);
			const matchesPhone = Boolean(targetPhone && normalizePhone(appt.patientPhone) === targetPhone);
			if (matchesId || matchesEmail || matchesPhone) {
				appt.userId = params.userId;
				linked++;
			}
		}

		return linked;
	}

	public createAppointment(data: {
		userId?: string | null;
		patientName: string;
		patientPhone: string;
		patientEmail?: string;
		doctorId: string;
		slotId: string;
		appointmentDate?: string;
		appointmentTime?: string;
		reason: string;
		referralCode?: string | null;
		originalFee?: number;
		discountPercent?: number;
		discountAmount?: number;
		consultationFee?: number;
		paymentStatus?: 'paid' | 'pending' | 'pay_at_clinic';
		paymentMethod?: string;
		paymentId?: string;
	}): AppointmentRecord {
		const doc = this.doctors.get(data.doctorId) || MOCK_DOCTORS.find((d) => d.id === data.doctorId);
		const baseFee = parseFloat(doc?.consultationFee || '500');
		const fee = data.consultationFee ?? baseFee;

		// Check if referred by doctor QR code
		let isQr = false;
		let matchingDoc = doc;
		let matchedQrCode = data.referralCode?.trim() || null;

		if (matchedQrCode) {
			const refDoc = this.getDoctorByQrCode(matchedQrCode);
			if (refDoc) {
				isQr = true;
				matchingDoc = refDoc;
			} else if (matchedQrCode.toUpperCase().startsWith('DOC-QR')) {
				isQr = true;
			}
		}

		const commRate =
			isQr && matchingDoc && 'commissionRate' in matchingDoc ? matchingDoc.commissionRate : isQr ? 15.0 : 0;
		const commAmount = isQr ? (fee * commRate) / 100 : 0;

		let appointmentId = `APT-${Date.now().toString().slice(-6)}`;
		if (this.appointments.some((a) => a.id === appointmentId)) {
			appointmentId = `${appointmentId}-${Math.floor(10 + Math.random() * 90)}`;
		}
		const isPaid = data.paymentStatus === 'paid';

		const newAppointment: AppointmentRecord = {
			id: appointmentId,
			userId: data.userId ?? null,
			patientName: data.patientName,
			patientPhone: data.patientPhone,
			patientEmail: data.patientEmail,
			doctorId: data.doctorId,
			doctorName: doc?.name || 'Specialist Doctor',
			doctorSpecialty: doc?.specialty || 'General',
			appointmentDate: data.appointmentDate || new Date().toISOString().split('T')[0],
			appointmentTime: data.appointmentTime || '10:00 AM',
			slotId: data.slotId,
			reason: data.reason,
			status: isPaid ? 'confirmed' : 'pending',
			bookingSource: isQr ? 'doctor_qr' : 'direct',
			referralQrCode: isQr ? matchedQrCode : null,
			originalFee: data.originalFee ?? baseFee,
			discountPercent: data.discountPercent ?? 0,
			discountAmount: data.discountAmount ?? 0,
			consultationFee: fee,
			commissionRate: commRate,
			commissionAmount: commAmount,
			paymentStatus: data.paymentStatus || (isPaid ? 'paid' : 'pay_at_clinic'),
			paymentMethod: data.paymentMethod || (isPaid ? 'Demo Online Payment' : 'Pay at Clinic'),
			paymentId: data.paymentId || (isPaid ? `TXN-DEMO-${Date.now().toString().slice(-6)}` : undefined),
			createdAt: new Date().toISOString()
		};

		this.markSlotBooked(data.slotId);
		this.appointments.unshift(newAppointment);
		return newAppointment;
	}

	public updateAppointmentStatus(
		id: string,
		status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
	): boolean {
		const appt = this.appointments.find((a) => a.id === id);
		if (!appt) return false;
		appt.status = status;
		return true;
	}

	// ── Diagnostic Test Booking Methods ───────────────────────────────────────

	public createTestBooking(data: {
		id?: string;
		userId?: string | null;
		patientName: string;
		patientPhone: string;
		patientEmail?: string;
		patientAge: number;
		patientGender: string;
		address: string;
		collectionDate: string;
		collectionSlot: string;
		totalAmount: number;
		paymentStatus?: 'paid' | 'pending';
		paymentMethod?: string;
		paymentId?: string;
		tests: Array<{ id: string; name: string; price: string; category: string }>;
	}): TestBookingRecord {
		let bookingId = data.id || `TST-${Date.now().toString().slice(-6)}`;
		if (this.testBookings.some((b) => b.id === bookingId)) {
			bookingId = `${bookingId}-${Math.floor(10 + Math.random() * 90)}`;
		}
		const isPaid = data.paymentStatus === 'paid';

		const record: TestBookingRecord = {
			id: bookingId,
			userId: data.userId ?? null,
			patientName: data.patientName,
			patientPhone: data.patientPhone,
			patientEmail: data.patientEmail,
			patientAge: data.patientAge,
			patientGender: data.patientGender,
			address: data.address,
			collectionDate: data.collectionDate,
			collectionSlot: data.collectionSlot,
			status: isPaid ? 'confirmed' : 'pending',
			totalAmount: data.totalAmount,
			paymentStatus: isPaid ? 'paid' : 'pending',
			paymentMethod: data.paymentMethod || (isPaid ? 'Demo Online Payment' : 'Pay on Sample Collection'),
			paymentId: data.paymentId,
			items: data.tests.map((t) => ({ testId: t.id, test: t })),
			createdAt: new Date().toISOString()
		};

		this.testBookings.unshift(record);
		return record;
	}

	public getTestBookingById(id: string): TestBookingRecord | undefined {
		return this.testBookings.find((b) => b.id === id);
	}

	public getAllTestBookings(): TestBookingRecord[] {
		return [...this.testBookings].sort(
			(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);
	}

	public getTestBookingsForUser(identity: {
		userId?: string | null;
		email?: string | null;
		phone?: string | null;
	}): TestBookingRecord[] {
		const targetEmail = identity.email?.trim().toLowerCase() || '';
		const targetPhone = normalizePhone(identity.phone);

		return this.testBookings
			.filter((b) => {
				if (identity.userId && b.userId === identity.userId) return true;
				if (targetEmail && b.patientEmail?.trim().toLowerCase() === targetEmail) return true;
				if (targetPhone && normalizePhone(b.patientPhone) === targetPhone) return true;
				return false;
			})
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	}

	public linkGuestTestBookingsToUser(params: {
		userId: string;
		email?: string | null;
		phone?: string | null;
		bookingId?: string | null;
	}): number {
		const targetEmail = params.email?.trim().toLowerCase() || '';
		const targetPhone = normalizePhone(params.phone);
		let linked = 0;

		for (const booking of this.testBookings) {
			if (booking.userId) continue;
			const matchesId = Boolean(params.bookingId && booking.id === params.bookingId);
			const matchesEmail = Boolean(
				targetEmail && booking.patientEmail?.trim().toLowerCase() === targetEmail
			);
			const matchesPhone = Boolean(targetPhone && normalizePhone(booking.patientPhone) === targetPhone);
			if (matchesId || matchesEmail || matchesPhone) {
				booking.userId = params.userId;
				linked++;
			}
		}

		return linked;
	}

	public updateTestBookingStatus(
		id: string,
		status: TestBookingRecord['status']
	): boolean {
		const booking = this.testBookings.find((b) => b.id === id);
		if (!booking) return false;
		booking.status = status;
		return true;
	}

	// ── Overall Admin Metrics ──────────────────────────────────────────────────

	public getOverallMetrics() {
		const total = this.appointments.length;
		const qrAppts = this.appointments.filter((a) => a.bookingSource === 'doctor_qr');
		const directAppts = this.appointments.filter((a) => a.bookingSource === 'direct');

		const pendingAppts = this.appointments.filter((a) => a.status === 'pending');
		const confirmedAppts = this.appointments.filter((a) => a.status === 'confirmed');
		const completedAppts = this.appointments.filter((a) => a.status === 'completed');

		const totalCommission = qrAppts.reduce((sum, a) => {
			return a.status !== 'cancelled' ? sum + a.commissionAmount : sum;
		}, 0);

		const totalRevenue = this.appointments.reduce((sum, a) => {
			return a.status !== 'cancelled' ? sum + a.consultationFee : sum;
		}, 0);

		const qrSharePercentage = total > 0 ? Math.round((qrAppts.length / total) * 100) : 0;
		const directSharePercentage = total > 0 ? 100 - qrSharePercentage : 0;

		return {
			totalAppointments: total,
			qrAppointmentsCount: qrAppts.length,
			directAppointmentsCount: directAppts.length,
			qrSharePercentage,
			directSharePercentage,
			totalCommissionEarned: totalCommission,
			totalConsultationRevenue: totalRevenue,
			pendingAppointmentsCount: pendingAppts.length,
			confirmedAppointmentsCount: confirmedAppts.length,
			completedAppointmentsCount: completedAppts.length,
			totalDoctors: this.doctors.size,
			totalTestBookings: this.testBookings.length
		};
	}
}

const ADMIN_STORE_KEY = Symbol.for('bloodline.adminStore.clean');
const globalObj = globalThis as Record<symbol, AdminStore | undefined>;
export const adminStore: AdminStore =
	globalObj[ADMIN_STORE_KEY] ?? (globalObj[ADMIN_STORE_KEY] = new AdminStore());

