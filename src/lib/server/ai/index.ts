/**
 * Health QA service using Google Gemini with fallback to OpenRouter.
 */

const SYSTEM_INSTRUCTION = `You are a medical assistant for Bloodline Pathology.
Provide concise, clinically accurate answers about lab test preparations (fasting requirements for sugar, jaundice LFT, TB, CBC), test turnaround times, and normal range interpretation.
Always remind the patient that laboratory test values must be reviewed by their consulting physician.
Keep tone professional, clear, and reassuring. Do not hallucinate.`;

export async function askMedicalAI(prompt: string): Promise<string> {
	const geminiApiKey = process.env.GEMINI_API_KEY;
	const openRouterApiKey = process.env.OPENROUTER_API_KEY;

	// Primary: Google Gemini
	if (geminiApiKey) {
		try {
			const res = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
						contents: [{ parts: [{ text: prompt }] }]
					})
				}
			);

			if (res.ok) {
				const data = await res.json();
				const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
				if (text) return text;
			}
		} catch (err) {
			console.warn('Gemini query error, attempting fallback:', err);
		}
	}

	// Fallback: OpenRouter
	if (openRouterApiKey) {
		try {
			const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${openRouterApiKey}`
				},
				body: JSON.stringify({
					model: 'meta-llama/llama-3.1-8b-instruct:free',
					messages: [
						{ role: 'system', content: SYSTEM_INSTRUCTION },
						{ role: 'user', content: prompt }
					]
				})
			});

			if (res.ok) {
				const data = await res.json();
				const text = data.choices?.[0]?.message?.content;
				if (text) return text;
			}
		} catch (err) {
			console.warn('OpenRouter query error:', err);
		}
	}

	// Built-in rule-based medical FAQ fallback for offline/development environments
	const lower = prompt.toLowerCase();
	if (lower.includes('sugar') || lower.includes('glucose')) {
		return 'For Fasting Blood Sugar, you must fast strictly for 8 to 10 hours overnight. Water is permitted. For Post-Prandial (PP) Sugar, have your regular meal and provide the blood sample exactly 2 hours after finishing your food.';
	}
	if (lower.includes('jaundice') || lower.includes('bilirubin') || lower.includes('lft') || lower.includes('liver')) {
		return 'For Liver Function Test (LFT) and Jaundice evaluation, 8 to 12 hours of fasting is recommended. Please avoid alcohol and excessively oily meals for 24 hours prior to sample collection.';
	}
	if (lower.includes('tb') || lower.includes('tuberculosis')) {
		return 'For the TB Gold IGRA blood test, no special fasting is required. The test checks your immune cells response (Interferon-gamma) to Mycobacterium tuberculosis antigens.';
	}
	if (lower.includes('cbc') || lower.includes('hemoglobin')) {
		return 'Complete Blood Count (CBC) does not require fasting. Keep yourself well hydrated before the home collection phlebotomist arrives.';
	}

	return 'For accurate blood test preparation instructions, check the details card on the booking page. Generally, fasting tests require 8-10 hours overnight water-only fasting. Always consult your treating doctor for comprehensive clinical correlation.';
}
