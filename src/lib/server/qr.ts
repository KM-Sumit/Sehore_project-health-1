import QRCode from 'qrcode';

/**
 * Generate a PNG Data URL for a given string/URL.
 */
export async function generateQrDataUrl(text: string): Promise<string> {
	try {
		return await QRCode.toDataURL(text, {
			errorCorrectionLevel: 'H',
			margin: 2,
			width: 320,
			color: {
				dark: '#991B1B', // Red-800 branding
				light: '#FFFFFF'
			}
		});
	} catch (err) {
		console.error('Failed to generate QR data URL:', err);
		// Fallback simple SVG data URI
		return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fee2e2"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%23991b1b">QR Code Unavailable</text></svg>`;
	}
}

/**
 * Generate an SVG string for a given string/URL.
 */
export async function generateQrSvg(text: string): Promise<string> {
	try {
		return await QRCode.toString(text, {
			type: 'svg',
			errorCorrectionLevel: 'H',
			margin: 2,
			color: {
				dark: '#991B1B',
				light: '#FFFFFF'
			}
		});
	} catch (err) {
		console.error('Failed to generate QR SVG:', err);
		return '';
	}
}

