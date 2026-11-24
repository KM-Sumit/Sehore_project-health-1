export type ExpressServiceType = 'lab_test' | 'doctor_consultation' | 'general';

export interface ExpressBookingRecord {
	id: string;
	reference: string;
	name: string | null;
	phone: string;
	gender: string | null;
	age: number | null;
	serviceType: ExpressServiceType;
	serviceName: string | null;
	preferredDate: string | null;
	preferredSlot: string | null;
	notes: string | null;
	status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
	createdAt: string;
}

/**
 * In-memory fallback used when the database is unreachable, so the
 * Express Booking flow never fails for the patient. Mirrors the pattern
 * used by adminStore for appointments.
 */
class ExpressStore {
	private bookings: ExpressBookingRecord[] = [];

	public create(data: Omit<ExpressBookingRecord, 'id' | 'createdAt' | 'status'>): ExpressBookingRecord {
		const record: ExpressBookingRecord = {
			...data,
			id: crypto.randomUUID(),
			status: 'pending',
			createdAt: new Date().toISOString()
		};
		this.bookings.unshift(record);
		return record;
	}

	public getAll(): ExpressBookingRecord[] {
		return [...this.bookings];
	}

	public getByReference(reference: string): ExpressBookingRecord | undefined {
		return this.bookings.find((b) => b.reference === reference);
	}

	public updateStatus(reference: string, status: ExpressBookingRecord['status']): boolean {
		const booking = this.bookings.find((b) => b.reference === reference);
		if (!booking) return false;
		booking.status = status;
		return true;
	}
}

export const expressStore = new ExpressStore();
