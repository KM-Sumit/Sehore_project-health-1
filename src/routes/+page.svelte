<script lang="ts">
	import {
		FlaskConical,
		Stethoscope,
		Clock,
		ArrowRight,
		Phone
	} from 'lucide-svelte';

	const keyTests = [
		{
			name: 'Blood Sugar (Fasting & PP)',
			tag: 'Diabetes',
			price: 150,
			reportTime: 'Same Day',
			prep: '10-12 hrs fasting required'
		},
		{
			name: 'Liver Function Test (LFT / Jaundice)',
			tag: 'Liver Health',
			price: 500,
			reportTime: '12 Hours',
			prep: 'Bilirubin, SGOT, SGPT & Proteins'
		},
		{
			name: 'Complete Blood Count (CBC)',
			tag: 'Routine',
			price: 350,
			reportTime: '4-6 Hours',
			prep: 'Hemoglobin, Platelets, TLC, DLC'
		},
		{
			name: 'TB Gold (Interferon Gamma IGRA)',
			tag: 'Tuberculosis',
			price: 2400,
			reportTime: '24 Hours',
			prep: 'Blood test for active & latent TB'
		},
		{
			name: 'Thyroid Profile (T3, T4, TSH)',
			tag: 'Thyroid',
			price: 600,
			reportTime: '12 Hours',
			prep: 'Morning sample recommended'
		},
		{
			name: 'Full Body Health Package',
			tag: 'Comprehensive',
			price: 1499,
			reportTime: '24 Hours',
			prep: 'Liver, Kidney, Lipid, Sugar & CBC'
		}
	];
</script>

<svelte:head>
	<title>Bloodline Pathology | Blood Tests & Doctor Appointments</title>
	<meta
		name="description"
		content="Book diagnostic blood tests (Blood Sugar, Jaundice LFT, TB Gold, CBC, Thyroid) and doctor appointments with Bloodline Pathology."
	/>
</svelte:head>

<!-- Hero Section -->
<section class="bg-white border-b border-slate-200">
	<div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
		<h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
			Accurate Blood Tests & <span class="text-red-600">Doctor Consultations</span>
		</h1>

		<p class="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
			Book routine blood tests (Sugar, Jaundice, TB, CBC, Thyroid) and schedule appointments with specialist doctors with sample collection at your address.
		</p>

		<div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
			<a
				href="/book-test"
				class="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-xs transition-colors text-sm sm:text-base cursor-pointer"
			>
				<FlaskConical class="w-5 h-5" />
				Book Blood Test
			</a>
			<a
				href="/book-appointment"
				class="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors text-sm sm:text-base border border-slate-300"
			>
				<Stethoscope class="w-5 h-5 text-red-600" />
				Consult Doctor
			</a>
		</div>
	</div>
</section>

<!-- Diagnostic Tests Grid -->
<section class="py-14 bg-slate-50/70">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
			<div>
				<h2 class="text-2xl font-bold text-slate-900">
					Available Diagnostic Tests
				</h2>
				<p class="text-sm text-slate-500 mt-1">
					Select a test to schedule blood sample collection at your preferred time.
				</p>
			</div>
			<a
				href="/book-test"
				class="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700"
			>
				View all tests
				<ArrowRight class="w-4 h-4" />
			</a>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
			{#each keyTests as test}
				<div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-red-300 transition-all flex flex-col justify-between">
					<div>
						<div class="mb-2">
							<span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
								{test.tag}
							</span>
						</div>

						<h3 class="text-base font-bold text-slate-900">{test.name}</h3>
						<p class="text-xs text-slate-500 mt-1 leading-relaxed">{test.prep}</p>

						<div class="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1">
							<Clock class="w-3.5 h-3.5 text-slate-400" />
							<span>Report in {test.reportTime}</span>
						</div>
					</div>

					<div class="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
						<div>
							<span class="text-[11px] text-slate-400 block">Price</span>
							<span class="text-lg font-bold text-slate-900">₹{test.price}</span>
						</div>
						<a
							href="/book-test"
							class="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors"
						>
							Book Test
						</a>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Doctor Consultations Section -->
<section class="py-14 bg-white border-t border-slate-200">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
			<div class="space-y-4">
				<h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900">
					Doctor Consultations
				</h2>
				<p class="text-sm text-slate-600 leading-relaxed">
					Consult specialist doctors for clinical evaluation of your health and test reports. Book appointments with General Physicians, Cardiologists, Pediatricians, and Dermatologists.
				</p>
				<div class="pt-2">
					<a
						href="/book-appointment"
						class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
					>
						<Stethoscope class="w-4 h-4 text-red-400" />
						Find Specialist Doctors
					</a>
				</div>
			</div>

			<!-- Doctor Cards -->
			<div class="space-y-3">
				<div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="w-11 h-11 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-sm">
							AK
						</div>
						<div>
							<h4 class="text-sm font-bold text-slate-900">Dr. Anand K. Sharma</h4>
							<p class="text-xs text-red-600 font-medium">MD (General Medicine)</p>
							<p class="text-[11px] text-slate-400">12 Years Experience • General Physician</p>
						</div>
					</div>
					<div class="text-right">
						<span class="text-xs font-bold text-slate-900 block">₹500</span>
						<a href="/book-appointment" class="text-xs font-bold text-red-600 hover:underline">Book</a>
					</div>
				</div>

				<div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="w-11 h-11 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-sm">
							SM
						</div>
						<div>
							<h4 class="text-sm font-bold text-slate-900">Dr. Sneha Mukherjee</h4>
							<p class="text-xs text-red-600 font-medium">DM (Cardiology)</p>
							<p class="text-[11px] text-slate-400">10 Years Experience • Cardiologist</p>
						</div>
					</div>
					<div class="text-right">
						<span class="text-xs font-bold text-slate-900 block">₹800</span>
						<a href="/book-appointment" class="text-xs font-bold text-red-600 hover:underline">Book</a>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Call to Action -->
<section class="bg-red-600 py-10 text-white">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-3">
		<h2 class="text-2xl font-bold tracking-tight">
			Need a Blood Test?
		</h2>
		<p class="text-red-100 text-sm max-w-lg mx-auto">
			Book your test online in minutes or reach out directly to our helpline.
		</p>
		<div class="pt-2 flex flex-col sm:flex-row justify-center gap-3">
			<a
				href="/book-test"
				class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white text-red-600 hover:bg-red-50 text-xs font-bold shadow-xs transition-colors"
			>
				<FlaskConical class="w-4 h-4" />
				Schedule Test
			</a>
			<a
				href="tel:+919876543210"
				class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold border border-red-500 transition-colors"
			>
				<Phone class="w-4 h-4" />
				Call +91 98765 43210
			</a>
		</div>
	</div>
</section>
