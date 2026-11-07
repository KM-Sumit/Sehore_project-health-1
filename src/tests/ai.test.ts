import { describe, expect, it } from 'bun:test';
import { askMedicalAI } from '../lib/server/ai';

describe('AI Medical Guidance Assistant', () => {
	it('provides preparation advice for fasting blood sugar tests', async () => {
		const answer = await askMedicalAI('How do I prepare for fasting sugar test?');
		expect(answer.toLowerCase()).toContain('fast');
		expect(answer.toLowerCase()).toContain('hour');
	});

	it('provides preparation instructions for jaundice and liver function tests', async () => {
		const answer = await askMedicalAI('What precautions are needed for jaundice LFT report?');
		expect(answer.toLowerCase()).toContain('jaundice');
		expect(answer.toLowerCase()).toContain('fasting');
	});

	it('provides info on TB Gold IGRA test', async () => {
		const answer = await askMedicalAI('Do I need to fast for TB test?');
		expect(answer.toLowerCase()).toContain('tb');
	});
});

