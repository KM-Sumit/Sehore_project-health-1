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

export interface AppointmentRecord {
	id: string;
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
	consultationFee: number;
	commissionRate: number;
	commissionAmount: number;
	paymentStatus: 'paid' | 'pending' | 'pay_at_clinic';
	paymentMethod?: string;
	paymentId?: string;
	createdAt: string;
}

// In-memory persistent state (survives requests during server lifecycle)
class AdminStore {
	private doctors: Map<string, DoctorReferralProfile> = new Map();
	private appointments: AppointmentRecord[] = [];

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
		this.appointments = [
			{
				id: 'APT-982101',
				patientName: 'Sunil Kumar Verma',
				patientPhone: '+91 98234 56789',
				patientEmail: 'sunil.verma@example.com',
				doctorId: '11111111-1111-1111-1111-111111111101',
				doctorName: 'Dr. Rajesh Sharma',
				doctorSpecialty: 'Cardiology',
				appointmentDate: '2026-11-07',
				appointmentTime: '10:00 AM',
				slotId: 'slot-11111111-1111-1111-1111-111111111101-2026-11-07-1',
				reason: 'Hypertension checkup and recent chest heaviness after exertion',
				status: 'pending',
				bookingSource: 'doctor_qr',
				referralQrCode: 'DOC-QR-RAJESH-101',
				consultationFee: 800,
				commissionRate: 15.0,
				commissionAmount: 120.0,
				paymentStatus: 'paid',
				createdAt: '2026-11-06T09:30:00.000Z'
			},
			{
				id: 'APT-982102',
				patientName: 'Pooja Tiwari',
				patientPhone: '+91 98765 43211',
				patientEmail: 'pooja.t@example.com',
				doctorId: '11111111-1111-1111-1111-111111111102',
				doctorName: 'Dr. Priya Patel',
				doctorSpecialty: 'Dermatology',
				appointmentDate: '2026-11-07',
				appointmentTime: '11:00 AM',
				slotId: 'slot-11111111-1111-1111-1111-111111111102-2026-11-07-2',
				reason: 'Persistent skin rash and itching on arms since 2 weeks',
				status: 'confirmed',
				bookingSource: 'doctor_qr',
				referralQrCode: 'DOC-QR-PRIYA-102',
				consultationFee: 600,
				commissionRate: 15.0,
				commissionAmount: 90.0,
				paymentStatus: 'paid',
				createdAt: '2026-11-06T08:15:00.000Z'
			},
			{
				id: 'APT-982103',
				patientName: 'Mohan Lal Sharma',
				patientPhone: '+91 94250 12345',
				patientEmail: 'mohan.sharma@example.com',
				doctorId: '11111111-1111-1111-1111-111111111105',
				doctorName: 'Dr. Vikram Singh',
				doctorSpecialty: 'General Physician',
				appointmentDate: '2026-11-07',
				appointmentTime: '02:00 PM',
				slotId: 'slot-11111111-1111-1111-1111-111111111105-2026-11-07-3',
				reason: 'High fever and weakness for 3 days, requested typhoid screening',
				status: 'pending',
				bookingSource: 'direct',
				referralQrCode: null,
				consultationFee: 400,
				commissionRate: 0,
				commissionAmount: 0.0,
				paymentStatus: 'pay_at_clinic',
				createdAt: '2026-11-06T10:00:00.000Z'
			},
			{
				id: 'APT-982104',
				patientName: 'Anita Saxena',
				patientPhone: '+91 97555 88990',
				patientEmail: 'anita.saxena@example.com',
				doctorId: '11111111-1111-1111-1111-111111111103',
				doctorName: 'Dr. Amit Verma',
				doctorSpecialty: 'Orthopedics',
				appointmentDate: '2026-11-08',
				appointmentTime: '09:00 AM',
				slotId: 'slot-11111111-1111-1111-1111-111111111103-2026-11-08-0',
				reason: 'Severe knee pain and difficulty climbing stairs',
				status: 'confirmed',
				bookingSource: 'doctor_qr',
				referralQrCode: 'DOC-QR-AMIT-103',
				consultationFee: 700,
				commissionRate: 18.0,
				commissionAmount: 126.0,
				paymentStatus: 'paid',
				createdAt: '2026-11-05T14:20:00.000Z'
			},
			{
				id: 'APT-982105',
				patientName: 'Deepak Chouhan',
				patientPhone: '+91 98930 44556',
				patientEmail: 'deepak.c@example.com',
				doctorId: '11111111-1111-1111-1111-111111111101',
				doctorName: 'Dr. Rajesh Sharma',
				doctorSpecialty: 'Cardiology',
				appointmentDate: '2026-11-05',
				appointmentTime: '03:00 PM',
				slotId: 'slot-11111111-1111-1111-1111-111111111101-2026-11-05-4',
				reason: 'Annual ECG review and cholesterol prescription follow-up',
				status: 'completed',
				bookingSource: 'doctor_qr',
				referralQrCode: 'DOC-QR-RAJESH-101',
				consultationFee: 800,
				commissionRate: 15.0,
				commissionAmount: 120.0,
				paymentStatus: 'paid',
				createdAt: '2026-11-04T11:00:00.000Z'
			},
			{
				id: 'APT-982106',
				patientName: 'Ritu Malviya',
				patientPhone: '+91 91112 33445',
				patientEmail: 'ritu.m@example.com',
				doctorId: '11111111-1111-1111-1111-111111111104',
				doctorName: 'Dr. Sneha Gupta',
				doctorSpecialty: 'Pediatrics',
				appointmentDate: '2026-11-06',
				appointmentTime: '10:00 AM',
				slotId: 'slot-11111111-1111-1111-1111-111111111104-2026-11-06-1',
				reason: 'Child vaccination (MMR booster) and growth assessment',
				status: 'completed',
				bookingSource: 'direct',
				referralQrCode: null,
				consultationFee: 500,
				commissionRate: 0,
				commissionAmount: 0.0,
				paymentStatus: 'paid',
				createdAt: '2026-11-05T16:45:00.000Z'
			},
			{
				id: 'APT-982107',
				patientName: 'Vikramaditya Solanki',
				patientPhone: '+91 96300 77889',
				patientEmail: 'v.solanki@example.com',
				doctorId: '11111111-1111-1111-1111-111111111106',
				doctorName: 'Dr. Kavita Nair',
				doctorSpecialty: 'Neurology',
				appointmentDate: '2026-11-08',
				appointmentTime: '11:00 AM',
				slotId: 'slot-11111111-1111-1111-1111-111111111106-2026-11-08-2',
				reason: 'Chronic migraine episodes triggered by sunlight and lack of sleep',
				status: 'pending',
				bookingSource: 'doctor_qr',
				referralQrCode: 'DOC-QR-KAVITA-106',
				consultationFee: 900,
				commissionRate: 20.0,
				commissionAmount: 180.0,
				paymentStatus: 'pay_at_clinic',
				createdAt: '2026-11-06T11:10:00.000Z'
			},
			{
				id: 'APT-982108',
				patientName: 'Meena Rathore',
				patientPhone: '+91 99260 11223',
				patientEmail: 'meena.r@example.com',
				doctorId: '11111111-1111-1111-1111-111111111105',
				doctorName: 'Dr. Vikram Singh',
				doctorSpecialty: 'General Physician',
				appointmentDate: '2026-11-07',
				appointmentTime: '04:00 PM',
				slotId: 'slot-11111111-1111-1111-1111-111111111105-2026-11-07-5',
				reason: 'Blood sugar checkup and dietary guidance for prediabetes',
				status: 'confirmed',
				bookingSource: 'direct',
				referralQrCode: null,
				consultationFee: 400,
				commissionRate: 0,
				commissionAmount: 0.0,
				paymentStatus: 'paid',
				createdAt: '2026-11-06T07:45:00.000Z'
			}
		];
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

		const nameSlug = doc.name.replace(/dr\.?\s+/i, '').replace(/[^a-zA-Z]/g, '').slice(0, 6).toUpperCase();
		const randomNum = Math.floor(100 + Math.random() * 900);
		const newCode = customCode?.trim().toUpperCase() || `DOC-QR-${nameSlug}-${randomNum}`;

		doc.qrCode = newCode;
		this.doctors.set(doctorId, doc);
		return newCode;
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

	public createAppointment(data: {
		patientName: string;
		patientPhone: string;
		patientEmail?: string;
		doctorId: string;
		slotId: string;
		appointmentDate?: string;
		appointmentTime?: string;
		reason: string;
		referralCode?: string | null;
		paymentStatus?: 'paid' | 'pending' | 'pay_at_clinic';
		paymentMethod?: string;
		paymentId?: string;
	}): AppointmentRecord {
		const doc = this.doctors.get(data.doctorId) || MOCK_DOCTORS.find((d) => d.id === data.doctorId);
		const fee = parseFloat(doc?.consultationFee || '500');

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

		const commRate = isQr ? (matchingDoc?.commissionRate ?? 15.0) : 0;
		const commAmount = isQr ? (fee * commRate) / 100 : 0;

		const appointmentId = `APT-${Date.now().toString().slice(-6)}`;
		const isPaid = data.paymentStatus === 'paid';

		const newAppointment: AppointmentRecord = {
			id: appointmentId,
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
			consultationFee: fee,
			commissionRate: commRate,
			commissionAmount: commAmount,
			paymentStatus: data.paymentStatus || (isPaid ? 'paid' : 'pay_at_clinic'),
			paymentMethod: data.paymentMethod || (isPaid ? 'Demo Online Payment' : 'Pay at Clinic'),
			paymentId: data.paymentId || (isPaid ? `TXN-DEMO-${Date.now().toString().slice(-6)}` : undefined),
			createdAt: new Date().toISOString()
		};

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

		return {
			totalAppointments: total,
			qrAppointmentsCount: qrAppts.length,
			directAppointmentsCount: directAppts.length,
			qrSharePercentage: total > 0 ? Math.round((qrAppts.length / total) * 100) : 0,
			totalCommissionEarned: totalCommission,
			totalConsultationRevenue: totalRevenue,
			pendingAppointmentsCount: pendingAppts.length,
			confirmedAppointmentsCount: confirmedAppts.length,
			completedAppointmentsCount: completedAppts.length,
			totalDoctors: this.doctors.size
		};
	}
}

// Global singleton instance across app lifetime
export const adminStore = new AdminStore();

