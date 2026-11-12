import { env } from '$env/dynamic/private';

function getPaymentSecret(): string {
	return (
		env.RAZORPAY_KEY_SECRET ||
		env.JWT_SECRET ||
		process.env.JWT_SECRET ||
		'bloodline-demo-payment-secret-2026'
	);
}

async function signHmacHex(message: string, secret: string): Promise<string> {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
	return Array.from(new Uint8Array(signatureBuffer))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

function constantTimeHexEqual(a: string, b: string): boolean {
	const encoder = new TextEncoder();
	const expectedBytes = encoder.encode(a);
	const providedBytes = encoder.encode(b);
	if (expectedBytes.length !== providedBytes.length) return false;
	let result = 0;
	for (let i = 0; i < expectedBytes.length; i++) {
		result |= expectedBytes[i] ^ providedBytes[i];
	}
	return result === 0;
}

// ── Razorpay Order Creation ──────────────────────────────────────────────────

export async function createOrder(
	amount: number,
	receipt: string
): Promise<{ id: string; amount: number; currency: string; receipt: string; status: string }> {
	const keyId = env.RAZORPAY_KEY_ID || '';
	const keySecret = env.RAZORPAY_KEY_SECRET || '';
	if (!keyId || !keySecret || keyId.includes('mock') || keySecret.includes('mock')) {
		throw new Error('Using local mock Razorpay gateway');
	}
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
	const expectedSignature = await signHmacHex(`${orderId}|${paymentId}`, getPaymentSecret());
	return constantTimeHexEqual(expectedSignature, signature);
}

export async function createScopedPaymentProof(params: {
	orderId: string;
	paymentId: string;
	amount: number;
	scopeId: string;
}): Promise<string> {
	const payload = `${params.orderId}|${params.paymentId}|${params.amount.toFixed(2)}|${params.scopeId}`;
	return signHmacHex(payload, getPaymentSecret());
}

export async function verifyScopedPaymentProof(params: {
	orderId: string;
	paymentId: string;
	amount: number;
	scopeId: string;
	signature: string;
}): Promise<boolean> {
	if (!params.orderId || !params.paymentId || !params.signature || !params.scopeId) {
		return false;
	}
	const payload = `${params.orderId}|${params.paymentId}|${params.amount.toFixed(2)}|${params.scopeId}`;
	const expected = await signHmacHex(payload, getPaymentSecret());
	return constantTimeHexEqual(expected, params.signature);
}

export function createAppointmentPaymentProof(params: {
	orderId: string;
	paymentId: string;
	amount: number;
	doctorId: string;
}): Promise<string> {
	return createScopedPaymentProof({
		orderId: params.orderId,
		paymentId: params.paymentId,
		amount: params.amount,
		scopeId: params.doctorId
	});
}

export function verifyAppointmentPaymentProof(params: {
	orderId: string;
	paymentId: string;
	amount: number;
	doctorId: string;
	signature: string;
}): Promise<boolean> {
	return verifyScopedPaymentProof({
		orderId: params.orderId,
		paymentId: params.paymentId,
		amount: params.amount,
		scopeId: params.doctorId,
		signature: params.signature
	});
}
