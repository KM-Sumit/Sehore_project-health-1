import { describe, expect, it } from 'bun:test';
import { generatePdfReport } from '../lib/server/pdf';
import { extractText } from 'unpdf';

describe('PDF Report Generation & Inspection (unpdf)', () => {
	it('generates a valid clinical lab PDF report containing patient and test details', async () => {
		const pdfBytes = generatePdfReport({
			bookingId: 'BK-TEST-001',
			patientName: 'Ramesh Kumar',
			patientAge: 42,
			patientGender: 'Male',
			patientPhone: '9876543210',
			collectionDate: '2026-11-05',
			reportDate: '2026-11-06',
			tests: [
				{
					name: 'Blood Sugar (Fasting Glucose)',
					category: 'Sugar',
					value: '94.2',
					unit: 'mg/dL',
					referenceRange: '70.0 - 99.0',
					status: 'Normal'
				},
				{
					name: 'Total Bilirubin (Jaundice)',
					category: 'Jaundice',
					value: '0.8',
					unit: 'mg/dL',
					referenceRange: '0.2 - 1.2',
					status: 'Normal'
				}
			]
		});

		expect(pdfBytes).toBeInstanceOf(Uint8Array);
		expect(pdfBytes.length).toBeGreaterThan(100);

		// Extract text using unpdf
		const { text } = await extractText(pdfBytes);
		const fullText = Array.isArray(text) ? text.join('\n') : String(text);
		expect(fullText).toContain('BLOODLINE PATHOLOGY');
		expect(fullText).toContain('BK-TEST-001');
		expect(fullText).toContain('Ramesh Kumar');
		expect(fullText).toContain('Blood Sugar');
	});
});
