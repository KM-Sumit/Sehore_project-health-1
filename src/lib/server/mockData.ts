export interface MockDoctor {
	id: string;
	name: string;
	specialty: string;
	qualification: string;
	experienceYears: number;
	bio: string;
	consultationFee: string;
	imageUrl: string | null;
	isActive: boolean;
	slots?: Array<{
		id: string;
		doctorId: string;
		date: string;
		startTime: string;
		endTime: string;
		isBooked: boolean;
	}>;
}

export interface MockTest {
	id: string;
	name: string;
	description: string;
	price: string;
	category: string;
	preparationInstructions: string;
	turnaroundHours: number;
	isActive: boolean;
}

export const MOCK_DOCTORS: MockDoctor[] = [
	{
		id: '11111111-1111-1111-1111-111111111101',
		name: 'Dr. Rajesh Sharma',
		specialty: 'Cardiology',
		qualification: 'MBBS, MD, DM (Cardiology)',
		experienceYears: 18,
		bio: 'Senior cardiologist with over 18 years of clinical experience in preventive heart care, hypertension management, and non-invasive diagnostics.',
		consultationFee: '800.00',
		imageUrl: null,
		isActive: true
	},
	{
		id: '11111111-1111-1111-1111-111111111102',
		name: 'Dr. Priya Patel',
		specialty: 'Dermatology',
		qualification: 'MBBS, MD (Dermatology)',
		experienceYears: 12,
		bio: 'Specialist in clinical dermatology, allergy assessments, hair disorders, and modern therapeutic skin care treatments.',
		consultationFee: '600.00',
		imageUrl: null,
		isActive: true
	},
	{
		id: '11111111-1111-1111-1111-111111111103',
		name: 'Dr. Amit Verma',
		specialty: 'Orthopedics',
		qualification: 'MBBS, MS (Orthopedics)',
		experienceYears: 15,
		bio: 'Orthopedic specialist focusing on joint pain management, sports injuries, spine rehabilitation, and arthritis therapies.',
		consultationFee: '700.00',
		imageUrl: null,
		isActive: true
	},
	{
		id: '11111111-1111-1111-1111-111111111104',
		name: 'Dr. Sneha Gupta',
		specialty: 'Pediatrics',
		qualification: 'MBBS, MD (Pediatrics)',
		experienceYears: 10,
		bio: 'Compassionate pediatrician focusing on childhood immunization, neonatal care, nutrition, and common pediatric conditions.',
		consultationFee: '500.00',
		imageUrl: null,
		isActive: true
	},
	{
		id: '11111111-1111-1111-1111-111111111105',
		name: 'Dr. Vikram Singh',
		specialty: 'General Physician',
		qualification: 'MBBS, MD (Internal Medicine)',
		experienceYears: 20,
		bio: 'Senior consultant in family medicine, infectious diseases, routine health checkups, and chronic lifestyle conditions.',
		consultationFee: '400.00',
		imageUrl: null,
		isActive: true
	},
	{
		id: '11111111-1111-1111-1111-111111111106',
		name: 'Dr. Kavita Nair',
		specialty: 'Neurology',
		qualification: 'MBBS, MD, DM (Neurology)',
		experienceYears: 14,
		bio: 'Experienced neurologist managing migraine, neuropathy, sleep disorders, dizziness, and neurovascular health.',
		consultationFee: '900.00',
		imageUrl: null,
		isActive: true
	}
];

export const MOCK_TESTS: MockTest[] = [
	{
		id: '22222222-2222-2222-2222-222222222201',
		name: 'Complete Blood Count (CBC)',
		description: 'Measures RBC, WBC, Platelets, Hemoglobin, and Hematocrit. Identifies anemia, infection, and general hematological health.',
		price: '350.00',
		category: 'Routine',
		preparationInstructions: 'No fasting required. Maintain normal hydration before sample collection.',
		turnaroundHours: 6,
		isActive: true
	},
	{
		id: '22222222-2222-2222-2222-222222222202',
		name: 'Blood Sugar (Fasting)',
		description: 'Measures blood glucose levels after an overnight fast. Essential test to diagnose diabetes and prediabetes.',
		price: '150.00',
		category: 'Sugar',
		preparationInstructions: 'Requires strict 8-10 hours overnight fasting. Only water is permitted.',
		turnaroundHours: 4,
		isActive: true
	},
	{
		id: '22222222-2222-2222-2222-222222222203',
		name: 'Blood Sugar (PP - Post Prandial)',
		description: 'Measures blood glucose 2 hours after a meal to evaluate insulin response and glucose clearance.',
		price: '150.00',
		category: 'Sugar',
		preparationInstructions: 'Have your usual meal and give blood sample exactly 2 hours after finishing food.',
		turnaroundHours: 4,
		isActive: true
	},
	{
		id: '22222222-2222-2222-2222-222222222204',
		name: 'HbA1c (Glycated Hemoglobin)',
		description: 'Measures your average 3-month blood glucose levels for comprehensive diabetes tracking.',
		price: '550.00',
		category: 'Sugar',
		preparationInstructions: 'No fasting required. Can be done anytime during the day.',
		turnaroundHours: 12,
		isActive: true
	},
	{
		id: '22222222-2222-2222-2222-222222222205',
		name: 'Jaundice / Liver Function Panel (LFT)',
		description: 'Screening for jaundice and liver inflammation: Total/Direct Bilirubin, SGOT (AST), SGPT (ALT), ALP, and Albumin.',
		price: '600.00',
		category: 'Jaundice',
		preparationInstructions: '8-10 hours fasting recommended. Avoid alcohol or fatty foods for 24 hours prior.',
		turnaroundHours: 12,
		isActive: true
	},
	{
		id: '22222222-2222-2222-2222-222222222206',
		name: 'Tuberculosis (TB) Gold Gamma Interferon / TB Panel',
		description: 'High-accuracy blood test (IGRA) for Mycobacterium tuberculosis detection without cross-reaction with BCG vaccine.',
		price: '1800.00',
		category: 'TB',
		preparationInstructions: 'No special fasting needed. Sample collected under sterile cold-chain conditions.',
		turnaroundHours: 36,
		isActive: true
	},
	{
		id: '22222222-2222-2222-2222-222222222207',
		name: 'Thyroid Profile (Total T3, T4, TSH)',
		description: 'Evaluates thyroid hormone production to diagnose hypothyroidism, hyperthyroidism, and metabolism issues.',
		price: '650.00',
		category: 'Thyroid',
		preparationInstructions: 'Early morning sample preferred. Please mention if taking thyroid supplements.',
		turnaroundHours: 12,
		isActive: true
	},
	{
		id: '22222222-2222-2222-2222-222222222208',
		name: 'Kidney Function Test (KFT / RFT)',
		description: 'Evaluates renal filtration: Serum Creatinine, Blood Urea, BUN, Uric Acid, and Electrolytes.',
		price: '550.00',
		category: 'Kidney',
		preparationInstructions: 'Overnight 8-hour fasting recommended. Stay normally hydrated.',
		turnaroundHours: 12,
		isActive: true
	},
	{
		id: '22222222-2222-2222-2222-222222222209',
		name: 'Lipid Profile (Heart Health)',
		description: 'Measures Total Cholesterol, HDL (good), LDL (bad), VLDL, and Triglycerides for cardiovascular risk rating.',
		price: '500.00',
		category: 'Heart',
		preparationInstructions: 'Requires strict 10-12 hours fasting. Avoid heavy dinner the night before.',
		turnaroundHours: 12,
		isActive: true
	},
	{
		id: '22222222-2222-2222-2222-222222222210',
		name: 'Vitamin D (25-OH)',
		description: 'Measures circulating Vitamin D concentration to identify deficiency causing bone aches and low immunity.',
		price: '850.00',
		category: 'Vitamin',
		preparationInstructions: 'No fasting required. Can be done anytime.',
		turnaroundHours: 24,
		isActive: true
	},
	{
		id: '22222222-2222-2222-2222-222222222211',
		name: 'Vitamin B12 (Cyanocobalamin)',
		description: 'Evaluates B12 levels essential for nerve health, brain function, and red blood cell production.',
		price: '800.00',
		category: 'Vitamin',
		preparationInstructions: 'Overnight 6-8 hours fasting recommended.',
		turnaroundHours: 24,
		isActive: true
	},
	{
		id: '22222222-2222-2222-2222-222222222212',
		name: 'Urine Routine & Microscopic Examination',
		description: 'Screens for urinary tract infections (UTI), proteinuria, micro-hematuria, and kidney stones.',
		price: '200.00',
		category: 'Routine',
		preparationInstructions: 'First morning clean-catch midstream urine sample is ideal.',
		turnaroundHours: 4,
		isActive: true
	},
	{
		id: '22222222-2222-2222-2222-222222222213',
		name: 'Dengue NS1 Antigen & Antibody Panel',
		description: 'Rapid diagnostic detection of Dengue viral antigen in acute fever phase (Day 1 to 5).',
		price: '750.00',
		category: 'Infection',
		preparationInstructions: 'No fasting required. Recommended at onset of high fever and joint pain.',
		turnaroundHours: 6,
		isActive: true
	},
	{
		id: '22222222-2222-2222-2222-222222222214',
		name: 'Widal Test for Typhoid Fever',
		description: 'Serological test for Salmonella typhi and paratyphi bacterial antibodies.',
		price: '280.00',
		category: 'Infection',
		preparationInstructions: 'No fasting needed.',
		turnaroundHours: 6,
		isActive: true
	}
];

export function getMockSlots(doctorId: string) {
	const slots = [];
	const today = new Date();
	for (let d = 0; d < 7; d++) {
		const dateObj = new Date(today);
		dateObj.setDate(today.getDate() + d);
		if (dateObj.getDay() === 0) continue; // skip Sunday
		const dateStr = dateObj.toISOString().split('T')[0];

		const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
		for (let i = 0; i < times.length; i++) {
			slots.push({
				id: `slot-${doctorId}-${dateStr}-${i}`,
				doctorId,
				date: dateStr,
				startTime: times[i],
				endTime: `${parseInt(times[i].split(':')[0]) + 1}:00`,
				isBooked: false
			});
		}
	}
	return slots;
}

