import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
	throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(DATABASE_URL);
const db = drizzle(client, { schema });

async function seed() {
	console.log('🌱 Seeding database...\n');

	// ── Seed Doctors ───────────────────────────────────────────────────────────

	const doctorsData = [
		{
			name: 'Dr. Rajesh Sharma',
			specialty: 'Cardiologist',
			qualification: 'MBBS, MD (Cardiology), DM',
			experienceYears: 18,
			bio: 'Dr. Rajesh Sharma is a senior cardiologist with over 18 years of experience in interventional cardiology and heart failure management. He has performed 5000+ cardiac procedures and is known for his patient-centric approach.',
			consultationFee: '800.00',
			imageUrl: null
		},
		{
			name: 'Dr. Priya Patel',
			specialty: 'Dermatologist',
			qualification: 'MBBS, MD (Dermatology)',
			experienceYears: 12,
			bio: 'Dr. Priya Patel specializes in medical and cosmetic dermatology. With 12 years of experience, she is an expert in treating skin disorders, acne, eczema, psoriasis, and provides advanced skin care treatments.',
			consultationFee: '600.00',
			imageUrl: null
		},
		{
			name: 'Dr. Amit Verma',
			specialty: 'Orthopedic',
			qualification: 'MBBS, MS (Orthopedics), Fellowship in Joint Replacement',
			experienceYears: 15,
			bio: 'Dr. Amit Verma is an orthopedic surgeon specializing in joint replacement surgery, sports injuries, and fracture management. He has successfully performed over 3000 joint replacement surgeries.',
			consultationFee: '700.00',
			imageUrl: null
		},
		{
			name: 'Dr. Sneha Gupta',
			specialty: 'Pediatrician',
			qualification: 'MBBS, MD (Pediatrics), IAP Fellowship in Neonatology',
			experienceYears: 10,
			bio: 'Dr. Sneha Gupta is a compassionate pediatrician dedicated to child healthcare. She has 10 years of experience in managing childhood illnesses, vaccinations, growth monitoring, and newborn care.',
			consultationFee: '500.00',
			imageUrl: null
		},
		{
			name: 'Dr. Vikram Singh',
			specialty: 'General Physician',
			qualification: 'MBBS, MD (Internal Medicine)',
			experienceYears: 20,
			bio: 'Dr. Vikram Singh is a highly experienced general physician with a special focus on preventive medicine, chronic disease management including diabetes and hypertension, and health check-ups.',
			consultationFee: '400.00',
			imageUrl: null
		},
		{
			name: 'Dr. Kavita Nair',
			specialty: 'Neurologist',
			qualification: 'MBBS, MD (Neurology), DM (Neurology)',
			experienceYears: 14,
			bio: 'Dr. Kavita Nair is a renowned neurologist specializing in headache disorders, epilepsy, stroke management, and neurodegenerative diseases. She has published over 30 research papers in leading journals.',
			consultationFee: '900.00',
			imageUrl: null
		}
	];

	const insertedDoctors = await db.insert(schema.doctors).values(doctorsData).returning();
	console.log(`✅ Inserted ${insertedDoctors.length} doctors`);

	// ── Seed Doctor Slots ──────────────────────────────────────────────────────

	const slotsData: {
		doctorId: string;
		date: string;
		startTime: string;
		endTime: string;
	}[] = [];

	const today = new Date();

	for (const doctor of insertedDoctors) {
		for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
			const slotDate = new Date(today);
			slotDate.setDate(today.getDate() + dayOffset);

			// Skip Sundays
			if (slotDate.getDay() === 0) continue;

			const dateStr = slotDate.toISOString().split('T')[0];

			// Generate 30-minute slots from 9 AM to 5 PM
			for (let hour = 9; hour < 17; hour++) {
				for (let minute = 0; minute < 60; minute += 30) {
					const startH = hour.toString().padStart(2, '0');
					const startM = minute.toString().padStart(2, '0');
					const endMinute = minute + 30;
					const endH = (endMinute >= 60 ? hour + 1 : hour).toString().padStart(2, '0');
					const endM = (endMinute % 60).toString().padStart(2, '0');

					slotsData.push({
						doctorId: doctor.id,
						date: dateStr,
						startTime: `${startH}:${startM}`,
						endTime: `${endH}:${endM}`
					});
				}
			}
		}
	}

	// Insert slots in batches to avoid parameter limits
	const BATCH_SIZE = 500;
	let totalSlots = 0;
	for (let i = 0; i < slotsData.length; i += BATCH_SIZE) {
		const batch = slotsData.slice(i, i + BATCH_SIZE);
		await db.insert(schema.doctorSlots).values(batch);
		totalSlots += batch.length;
	}
	console.log(`✅ Inserted ${totalSlots} doctor slots`);

	// ── Seed Tests ─────────────────────────────────────────────────────────────

	const testsData = [
		{
			name: 'Complete Blood Count (CBC)',
			description:
				'Measures red blood cells, white blood cells, hemoglobin, hematocrit, and platelets. Helps detect infections, anemia, and other disorders.',
			price: '350.00',
			category: 'Routine',
			preparationInstructions: 'No special preparation required. Fasting is not necessary.',
			turnaroundHours: 6
		},
		{
			name: 'Blood Sugar (Fasting)',
			description:
				'Measures blood glucose levels after an overnight fast. Used to diagnose diabetes and pre-diabetes.',
			price: '200.00',
			category: 'Diabetes',
			preparationInstructions:
				'Fast for 8-12 hours before the test. Only water is allowed during fasting.',
			turnaroundHours: 4
		},
		{
			name: 'Blood Sugar (PP - Post Prandial)',
			description:
				'Measures blood glucose 2 hours after a meal. Helps monitor how the body processes sugar after eating.',
			price: '200.00',
			category: 'Diabetes',
			preparationInstructions:
				'Eat a normal meal, then wait exactly 2 hours before sample collection.',
			turnaroundHours: 4
		},
		{
			name: 'HbA1c (Glycated Hemoglobin)',
			description:
				'Provides average blood sugar levels over the past 2-3 months. Essential for diabetes monitoring and management.',
			price: '550.00',
			category: 'Diabetes',
			preparationInstructions: 'No fasting required. Can be done at any time of the day.',
			turnaroundHours: 12
		},
		{
			name: 'Thyroid Profile (T3, T4, TSH)',
			description:
				'Comprehensive panel measuring T3, T4, and TSH hormone levels. Diagnoses hypothyroidism, hyperthyroidism, and other thyroid disorders.',
			price: '650.00',
			category: 'Thyroid',
			preparationInstructions:
				'No fasting required. Best done in the morning. Inform about any thyroid medications.',
			turnaroundHours: 12
		},
		{
			name: 'Liver Function Test (LFT)',
			description:
				'Evaluates liver health by measuring enzymes (SGOT, SGPT, ALP), bilirubin, albumin, and total protein.',
			price: '600.00',
			category: 'Liver',
			preparationInstructions:
				'Fasting for 10-12 hours is recommended. Avoid alcohol 24 hours before the test.',
			turnaroundHours: 12
		},
		{
			name: 'Kidney Function Test (KFT/RFT)',
			description:
				'Assesses kidney health by measuring creatinine, urea, BUN, uric acid, and electrolytes.',
			price: '600.00',
			category: 'Kidney',
			preparationInstructions:
				'Fasting for 8-10 hours is recommended. Stay well hydrated the day before.',
			turnaroundHours: 12
		},
		{
			name: 'Lipid Profile',
			description:
				'Measures total cholesterol, HDL, LDL, VLDL, and triglycerides. Essential for assessing cardiovascular risk.',
			price: '500.00',
			category: 'Heart',
			preparationInstructions:
				'Fasting for 10-12 hours is required. Avoid fatty foods the night before.',
			turnaroundHours: 12
		},
		{
			name: 'Vitamin D (25-Hydroxy)',
			description:
				'Measures Vitamin D levels in the blood. Detects deficiency that can lead to bone weakness, fatigue, and immune issues.',
			price: '900.00',
			category: 'Vitamin',
			preparationInstructions: 'No special preparation required.',
			turnaroundHours: 24
		},
		{
			name: 'Vitamin B12',
			description:
				'Measures Vitamin B12 levels. Deficiency can cause anemia, nerve damage, fatigue, and cognitive issues.',
			price: '800.00',
			category: 'Vitamin',
			preparationInstructions: 'Fasting for 6-8 hours is recommended for accurate results.',
			turnaroundHours: 24
		},
		{
			name: 'Urine Routine & Microscopy',
			description:
				'Basic urine analysis checking color, pH, specific gravity, glucose, protein, and microscopic examination for cells and crystals.',
			price: '250.00',
			category: 'Routine',
			preparationInstructions:
				'Collect midstream clean-catch urine sample. Morning sample is preferred.',
			turnaroundHours: 4
		},
		{
			name: 'Complete Urine Analysis',
			description:
				'Comprehensive urine examination including physical, chemical, and microscopic analysis. Detects UTIs, kidney disease, and metabolic disorders.',
			price: '400.00',
			category: 'Routine',
			preparationInstructions:
				'Collect midstream clean-catch first morning urine sample for best results.',
			turnaroundHours: 6
		},
		{
			name: 'Dengue NS1 Antigen',
			description:
				'Detects dengue virus NS1 antigen in early stage of infection (first 1-5 days of fever). Crucial for early diagnosis.',
			price: '700.00',
			category: 'Infection',
			preparationInstructions: 'No special preparation required. Test as soon as dengue is suspected.',
			turnaroundHours: 4
		},
		{
			name: 'Malaria (Parasite & Antigen)',
			description:
				'Detects malaria parasites and antigens in the blood. Includes both smear examination and rapid antigen detection.',
			price: '450.00',
			category: 'Infection',
			preparationInstructions:
				'No special preparation required. Best collected during or just after a fever episode.',
			turnaroundHours: 4
		},
		{
			name: 'Widal Test',
			description:
				'Serological test for typhoid fever. Detects antibodies against Salmonella typhi and paratyphi.',
			price: '350.00',
			category: 'Infection',
			preparationInstructions: 'No special preparation required.',
			turnaroundHours: 6
		},
		{
			name: 'ESR (Erythrocyte Sedimentation Rate)',
			description:
				'Measures the rate at which red blood cells settle. Non-specific marker for inflammation, infection, and autoimmune conditions.',
			price: '200.00',
			category: 'General',
			preparationInstructions: 'No fasting required.',
			turnaroundHours: 4
		},
		{
			name: 'CRP (C-Reactive Protein)',
			description:
				'Measures CRP levels produced by the liver in response to inflammation. Helps assess infection severity and inflammatory conditions.',
			price: '500.00',
			category: 'General',
			preparationInstructions: 'No special preparation required.',
			turnaroundHours: 6
		},
		{
			name: 'Blood Group (ABO & Rh Typing)',
			description:
				'Determines ABO blood group and Rh factor. Essential for blood transfusion, pregnancy, and emergency situations.',
			price: '250.00',
			category: 'General',
			preparationInstructions: 'No special preparation required.',
			turnaroundHours: 2
		},
		{
			name: 'HIV 1 & 2 (ELISA)',
			description:
				'Screens for HIV antibodies using ELISA method. Highly sensitive and specific test for HIV detection.',
			price: '500.00',
			category: 'Infection',
			preparationInstructions:
				'No special preparation required. Results are strictly confidential.',
			turnaroundHours: 24
		},
		{
			name: 'HBsAg (Hepatitis B Surface Antigen)',
			description:
				'Screens for Hepatitis B virus infection by detecting surface antigens. Important for liver health screening.',
			price: '450.00',
			category: 'Infection',
			preparationInstructions: 'No special preparation required.',
			turnaroundHours: 12
		}
	];

	const insertedTests = await db.insert(schema.tests).values(testsData).returning();
	console.log(`✅ Inserted ${insertedTests.length} tests`);

	console.log('\n🎉 Seeding complete!');
	process.exit(0);
}

seed().catch((err) => {
	console.error('❌ Seed failed:', err);
	process.exit(1);
});
