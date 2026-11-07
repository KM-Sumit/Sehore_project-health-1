/**
 * Generates a clinical laboratory PDF report using pdf-lib (proper PDF generation).
 * Replaces the previous hand-rolled PDF which had malformed xref tables and no text escaping.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface TestReportData {
	bookingId: string;
	patientName: string;
	patientAge: number | string;
	patientGender: string;
	patientPhone: string;
	collectionDate: string;
	reportDate: string;
	tests: Array<{
		name: string;
		category: string;
		value: string;
		unit: string;
		referenceRange: string;
		status: 'Normal' | 'High' | 'Borderline';
	}>;
}

const COLOR_RED = rgb(0.75, 0.1, 0.1);
const COLOR_DARK = rgb(0.15, 0.15, 0.2);
const COLOR_GRAY = rgb(0.5, 0.5, 0.5);
const COLOR_BG = rgb(0.97, 0.97, 0.98);

function statusColor(status: string) {
	switch (status) {
		case 'Normal': return rgb(0.1, 0.55, 0.15);
		case 'High': return COLOR_RED;
		case 'Borderline': return rgb(0.85, 0.55, 0.1);
		default: return COLOR_DARK;
	}
}

export async function generatePdfReport(data: TestReportData): Promise<Uint8Array> {
	const pdfDoc = await PDFDocument.create();
	const page = pdfDoc.addPage([595, 842]); // A4
	const { width, height } = page.getSize();

	const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
	const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

	let y = height - 50;

	// ── Header ──
	page.drawText('BLOODLINE PATHOLOGY DIAGNOSTIC LABORATORIES', {
		x: 50, y, size: 18, font: boldFont, color: COLOR_DARK
	});
	y -= 22;
	page.drawText('NABL Accredited Medical Diagnostics Lab | ISO 15189 Certified', {
		x: 50, y, size: 9, font, color: COLOR_GRAY
	});
	y -= 14;
	page.drawText('24x7 Helpline: +91 1800-123-BLOOD | Email: reports@bloodlinepathology.in', {
		x: 50, y, size: 9, font, color: COLOR_GRAY
	});
	y -= 30;

	// ── Patient Info ──
	page.drawText('PATIENT DEMOGRAPHICS & SAMPLE INFORMATION', {
		x: 50, y, size: 11, font: boldFont, color: COLOR_DARK
	});
	y -= 16;
	page.drawText(`Booking ID: ${data.bookingId}   Patient: ${data.patientName}   Age/Gender: ${data.patientAge} Y / ${String(data.patientGender).toUpperCase()}`, {
		x: 50, y, size: 9, font
	});
	y -= 14;
	page.drawText(`Contact: ${data.patientPhone}   Collection Date: ${data.collectionDate}   Report Date: ${data.reportDate}`, {
		x: 50, y, size: 9, font
	});
	y -= 26;

	// ── Test Table Header ──
	const colX = [50, 200, 320, 400, 480];
	const headers = ['TEST NAME', 'OBSERVED VALUE', 'UNITS', 'REFERENCE RANGE', 'STATUS'];
	page.drawRectangle({ x: 45, y: y + 10, width: 505, height: 20, color: COLOR_BG });
	headers.forEach((h, i) => {
		page.drawText(h, { x: colX[i], y: y + 4, size: 8, font: boldFont, color: COLOR_DARK });
	});
	y -= 14;

	// ── Test Rows ──
	for (const t of data.tests) {
		// Check page overflow
		if (y < 100) {
			page.drawText('(continued on next page...)', { x: 50, y: 40, size: 9, font, color: COLOR_GRAY });
			const newPage = pdfDoc.addPage([595, 842]);
			y = newPage.getSize().height - 50;
			// Redraw header on new page
			newPage.drawText('TEST NAME', { x: colX[0], y: y + 4, size: 8, font: boldFont, color: COLOR_DARK });
			newPage.drawText('OBSERVED VALUE', { x: colX[1], y: y + 4, size: 8, font: boldFont, color: COLOR_DARK });
			newPage.drawText('UNITS', { x: colX[2], y: y + 4, size: 8, font: boldFont, color: COLOR_DARK });
			newPage.drawText('REFERENCE RANGE', { x: colX[3], y: y + 4, size: 8, font: boldFont, color: COLOR_DARK });
			newPage.drawText('STATUS', { x: colX[4], y: y + 4, size: 8, font: boldFont, color: COLOR_DARK });
			y -= 14;
		}

		const rowColor = y % 40 < 20 ? rgb(1, 1, 1) : COLOR_BG;
		page.drawRectangle({ x: 45, y: y + 2, width: 505, height: 16, color: rowColor });

		const statusFill = statusColor(t.status);
		page.drawText(t.name, { x: colX[0], y: y + 4, size: 8, font, color: COLOR_DARK });
		page.drawText(t.value, { x: colX[1], y: y + 4, size: 8, font, color: COLOR_DARK });
		page.drawText(t.unit, { x: colX[2], y: y + 4, size: 8, font, color: COLOR_DARK });
		page.drawText(t.referenceRange, { x: colX[3], y: y + 4, size: 8, font, color: COLOR_DARK });
		page.drawText(t.status, { x: colX[4], y: y + 4, size: 8, font: boldFont, color: statusFill });
		y -= 18;
	}

	y -= 20;

	// ── Footer ──
	page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: COLOR_GRAY });
	y -= 18;
	page.drawText('CLINICAL REMARKS & METHODOLOGY:', { x: 50, y, size: 9, font: boldFont, color: COLOR_DARK });
	y -= 14;
	const remarks = [
		'- Fasting glucose estimated via Hexokinase method.',
		'- Serum Bilirubin tested via Diazo Jendrassik-Grof method.',
		'- TB testing performed via Interferon-Gamma Release Assay (IGRA).',
		'- Tests calibrated against international WHO standards. Clinical correlation advised by treating doctor.'
	];
	for (const r of remarks) {
		page.drawText(r, { x: 50, y, size: 8, font, color: COLOR_GRAY });
		y -= 12;
	}

	y -= 18;
	page.drawText(`Verified by: Dr. Anjali Mehta, MD (Pathology)   Chief Lab Director: Dr. S. K. Rastogi, FRCPath`, {
		x: 50, y, size: 9, font, color: COLOR_DARK
	});

	const pdfBytes = await pdfDoc.save();
	return pdfBytes;
}
