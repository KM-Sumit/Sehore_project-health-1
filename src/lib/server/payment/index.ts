import { env } from '$env/dynamic/private';

// ── Razorpay Order Creation ──────────────────────────────────────────────────

export async function createOrder(
	amount: number,
	receipt: string
): Promise<{ id: string; amount: number; currency: string; receipt: string; status: string }> {
	const keyId = env.RAZORPAY_KEY_ID!;
	const keySecret = env.RAZORPAY_KEY_SECRET!;
	const credentials = btoa(`${keyId}:${keySecret}`);

	const res = await fetch('https://api.razorpay.com/v1/orders', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Basic ${credentials}`
		},
		body: JSON.stringify({
			amount: Math.round(amount * 100), // Razorpay expects amount in paise
			currency: 'INR',
			receipt
		})
	});

	if (!res.ok) {
		const error = await res.text();
		throw new Error(`Razorpay order creation failed: ${error}`);
	}

	return res.json();
}

// ── Payment Verification ────────────────────────────────────────────────────

export async function verifyPayment(
	orderId: string,
	paymentId: string,
	signature: string
): Promise<boolean> {
	const keySecret = env.RAZORPAY_KEY_SECRET!;

	// Generate expected signature using HMAC SHA256
	const message = `${orderId}|${paymentId}`;
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(keySecret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);

	const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(message));

	// Convert to hex string
	const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

	// Constant-time comparison to prevent timing attacks
	const expectedBytes = encoder.encode(expectedSignature);
	const providedBytes = encoder.encode(signature);

	if (expectedBytes.length !== providedBytes.length) {
		return false;
	}

	let result = 0;
	for (let i = 0; i < expectedBytes.length; i++) {
		result |= expectedBytes[i] ^ providedBytes[i];
	}

	return result === 0;
}
