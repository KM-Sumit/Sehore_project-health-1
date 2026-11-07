import { json } from '@sveltejs/kit';
import { askMedicalAI } from '$lib/server/ai';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { question } = await request.json();
		if (!question || typeof question !== 'string') {
			return json({ error: 'Please provide a valid medical question' }, { status: 400 });
		}

		const answer = await askMedicalAI(question);
		return json({ answer });
	} catch (err) {
		console.error('AI consult endpoint error:', err);
		return json({ error: 'Failed to process inquiry' }, { status: 500 });
	}
};

