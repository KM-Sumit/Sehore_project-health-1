<script lang="ts">
	import {
		Calendar,
		FlaskConical,
		FileText,
		Download,
		Clock,
		CheckCircle2,
		AlertCircle,
		MapPin,
		User,
		ArrowRight,
		Stethoscope,
		BookOpen,
		LayoutDashboard
	} from 'lucide-svelte';
	import Button from '$components/Button.svelte';
	import Card from '$components/Card.svelte';
	import Badge from '$components/Badge.svelte';
	import BookingStatus from '$components/BookingStatus.svelte';
	import katex from 'katex';
	import { marked } from 'marked';

	let { data } = $props();

	let activeTab = $state<'tests' | 'appointments' | 'reference'>('tests');

	// KaTeX formula string for blood test evaluation note
	const formulaHbA1c = katex.renderToString(
		'\\text{eAG (mg/dL)} = 28.7 \\times \\text{HbA1c} - 46.7',
		{ throwOnError: false }
	);

	const formulaBilirubin = katex.renderToString(
		'\\text{Total Bilirubin} = \\text{Direct Bilirubin} + \\text{Indirect Bilirubin}',
		{ throwOnError: false }
	);

	const medicalNotesMarkdown = marked.parse(`
### Diagnostic Normal Ranges Guide
- **Blood Sugar (Fasting):** $70 - 99\\text{ mg/dL}$ (Normal), $100 - 125\\text{ mg/dL}$ (Pre-diabetes), $\\ge 126\\text{ mg/dL}$ (Diabetes)
- **Serum Bilirubin (Total):** $0.2 - 1.2\\text{ mg/dL}$ (Elevated in Jaundice / Hepatitis)
- **Tuberculosis (TB Gold IGRA):** Negative (No active/latent TB detected)
- **Hemoglobin:** Male: $13.8 - 17.2\\text{ g/dL}$, Female: $12.1 - 15.1\\text{ g/dL}$
	`);
</script>

<svelte:head>
	<title>Patient Dashboard | Bloodline Pathology</title>
	<link
		rel="stylesheet"
		href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"
		crossorigin="anonymous"
	/>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
	<!-- Top Bar -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
		<div>
			<div class="flex items-center gap-2">
				<h1 class="text-2xl font-bold tracking-tight text-slate-900">
					Welcome back, {data.user?.name ?? 'Patient'}
				</h1>
				<Badge variant="info" text={data.user?.role ?? 'User'} />
			</div>
			<p class="text-xs sm:text-sm text-slate-500 mt-1">
				{data.user?.email} • Manage scheduled consultations, home sample pickups & digital reports
			</p>
		</div>

		<div class="flex flex-wrap items-center gap-2.5">
			<Button variant="primary" size="sm" href="/book-test">
				<FlaskConical class="w-4 h-4 mr-1" />
				Book Blood Test
			</Button>
			<Button variant="outline" size="sm" href="/book-appointment">
				<Calendar class="w-4 h-4 mr-1" />
				Book Doctor
			</Button>
			{#if data.user?.role === 'admin'}
				<Button variant="outline" size="sm" href="/admin" class="bg-slate-900 text-white hover:bg-slate-800 border-slate-800">
					<LayoutDashboard class="w-4 h-4 mr-1" />
					Open Admin Panel
				</Button>
			{/if}
		</div>
	</div>

	<!-- Quick KPI Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		<div class="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-slate-500">Diagnostic Bookings</span>
				<div class="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
					<FlaskConical class="w-4 h-4" />
				</div>
			</div>
			<p class="text-2xl font-bold text-slate-900 mt-2">{data.testBookings.length}</p>
			<p class="text-[11px] text-slate-400 mt-1">Sample pickups & tests</p>
		</div>

		<div class="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-slate-500">Doctor Consultations</span>
				<div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
					<Stethoscope class="w-4 h-4" />
				</div>
			</div>
			<p class="text-2xl font-bold text-slate-900 mt-2">{data.appointments.length}</p>
			<p class="text-[11px] text-slate-400 mt-1">Specialist appointments</p>
		</div>

		<div class="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-slate-500">Reports Ready</span>
				<div class="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
					<FileText class="w-4 h-4" />
				</div>
			</div>
			<p class="text-2xl font-bold text-slate-900 mt-2">
				{data.testBookings.filter((b: any) => b.status === 'completed').length}
			</p>
			<p class="text-[11px] text-slate-400 mt-1">PDF downloads available</p>
		</div>
	</div>

	<!-- Navigation Tabs -->
	<div class="border-b border-slate-200 flex gap-6 text-sm font-medium">
		<button
			type="button"
			onclick={() => (activeTab = 'tests')}
			class="pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 {activeTab === 'tests'
				? 'border-red-600 text-red-600'
				: 'border-transparent text-slate-500 hover:text-slate-800'}"
		>
			<FlaskConical class="w-4 h-4" />
			Blood & Diagnostic Tests ({data.testBookings.length})
		</button>

		<button
			type="button"
			onclick={() => (activeTab = 'appointments')}
			class="pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 {activeTab === 'appointments'
				? 'border-red-600 text-red-600'
				: 'border-transparent text-slate-500 hover:text-slate-800'}"
		>
			<Calendar class="w-4 h-4" />
			Doctor Appointments ({data.appointments.length})
		</button>

		<button
			type="button"
			onclick={() => (activeTab = 'reference')}
			class="pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 {activeTab === 'reference'
				? 'border-red-600 text-red-600'
				: 'border-transparent text-slate-500 hover:text-slate-800'}"
		>
			<BookOpen class="w-4 h-4" />
			Clinical Guidelines & Normal Ranges
		</button>
	</div>

	<!-- Tab 1: Blood & Diagnostic Tests -->
	{#if activeTab === 'tests'}
		<div class="space-y-4">
			{#if data.testBookings.length === 0}
				<div class="bg-white p-12 text-center rounded-2xl border border-slate-200">
					<FlaskConical class="w-10 h-10 text-slate-300 mx-auto mb-3" />
					<h3 class="text-sm font-semibold text-slate-800">No diagnostic bookings found</h3>
					<p class="text-xs text-slate-400 mt-1 mb-4">Book home blood sample collection for Sugar, Jaundice, TB, CBC and more.</p>
					<Button variant="primary" size="sm" href="/book-test">Book Sample Now</Button>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-5">
					{#each data.testBookings as booking}
						<div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
							<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
								<div>
									<div class="flex items-center gap-2">
										<span class="text-sm font-bold font-mono text-slate-900">{booking.id}</span>
										<Badge
											variant={booking.status === 'completed'
												? 'success'
												: booking.status === 'cancelled'
													? 'danger'
													: 'info'}
											text={booking.status.replace('_', ' ').toUpperCase()}
										/>
									</div>
									<p class="text-xs text-slate-500 mt-1">
										Patient: <span class="font-medium text-slate-800">{booking.patientName}</span> ({booking.patientGender}, {booking.patientAge}y) • Tel: {booking.patientPhone}
									</p>
								</div>

								<div class="flex items-center gap-2">
									<a
										href="/api/reports/{booking.id}"
										target="_blank"
										class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
									>
										<Download class="w-3.5 h-3.5" />
										Download Report (PDF)
									</a>
								</div>
							</div>

							<!-- Stepper Status -->
							<div class="py-2 max-w-2xl">
								<BookingStatus status={booking.status} type="test" />
							</div>

							<!-- Details Row -->
							<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
								<div>
									<span class="text-slate-400 block">Sample Collection Date & Slot</span>
									<span class="font-medium text-slate-800">{booking.collectionDate} • {booking.collectionSlot}</span>
								</div>
								<div>
									<span class="text-slate-400 block">Collection Address</span>
									<span class="font-medium text-slate-800 truncate block">{booking.address}</span>
								</div>
								<div>
									<span class="text-slate-400 block">Total Amount Paid</span>
									<span class="font-bold text-slate-900">₹{booking.totalAmount}</span>
								</div>
							</div>

							<!-- Tests Included in this booking -->
							<div>
								<span class="text-xs font-semibold text-slate-700 block mb-2">Tests Ordered:</span>
								<div class="flex flex-wrap gap-2">
									{#if booking.items && booking.items.length > 0}
										{#each booking.items as item}
											<span class="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium border border-slate-200">
												{item.test?.name ?? 'Diagnostic Test'}
											</span>
										{/each}
									{:else}
										<span class="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
											Routine Blood Panel
										</span>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Tab 2: Doctor Appointments -->
	{#if activeTab === 'appointments'}
		<div class="space-y-4">
			{#if data.appointments.length === 0}
				<div class="bg-white p-12 text-center rounded-2xl border border-slate-200">
					<Stethoscope class="w-10 h-10 text-slate-300 mx-auto mb-3" />
					<h3 class="text-sm font-semibold text-slate-800">No doctor appointments booked</h3>
					<p class="text-xs text-slate-400 mt-1 mb-4">Consult top specialists across cardiology, dermatology, pediatrics, and more.</p>
					<Button variant="primary" size="sm" href="/book-appointment">Book Doctor Consultation</Button>
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
					{#each data.appointments as appt}
						<div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
							<div class="flex items-start justify-between">
								<div>
									<h4 class="text-base font-bold text-slate-900">{appt.doctor?.name ?? 'Specialist Doctor'}</h4>
									<p class="text-xs text-red-600 font-medium">{appt.doctor?.specialty ?? 'Consultant'}</p>
								</div>
								<Badge variant={appt.status === 'confirmed' ? 'success' : 'info'} text={appt.status.toUpperCase()} />
							</div>

							<div class="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
								<div class="flex justify-between">
									<span class="text-slate-400">Appointment Date:</span>
									<span class="font-medium text-slate-800">{appt.slot?.date ?? 'Upcoming'}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-slate-400">Time Slot:</span>
									<span class="font-medium text-slate-800">{appt.slot?.startTime ?? '10:00 AM'}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-slate-400">Consultation Fee:</span>
									<span class="font-bold text-slate-900">₹{appt.doctor?.consultationFee ?? '500'}</span>
								</div>
							</div>

							<p class="text-xs text-slate-500 italic">
								"{appt.reason}"
							</p>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Tab 3: Clinical Reference & Guidance -->
	{#if activeTab === 'reference'}
		<div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
			<div>
				<h3 class="text-base font-bold text-slate-900">Diagnostic Reference Ranges & Clinical Guidance</h3>
				<p class="text-xs text-slate-500 mt-1">
					Standard laboratory normal values and formulas to help you understand your blood test reports
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
					<h4 class="text-xs font-bold text-slate-700 uppercase tracking-wide">
						Estimated Average Glucose (eAG) Formula
					</h4>
					<div class="py-2 text-slate-900 font-serif overflow-x-auto">
						{@html formulaHbA1c}
					</div>
					<p class="text-xs text-slate-500">
						Translates HbA1c percentage into daily average glucose levels in mg/dL.
					</p>
				</div>

				<div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
					<h4 class="text-xs font-bold text-slate-700 uppercase tracking-wide">
						Jaundice Bilirubin Partition Formula
					</h4>
					<div class="py-2 text-slate-900 font-serif overflow-x-auto">
						{@html formulaBilirubin}
					</div>
					<p class="text-xs text-slate-500">
						Helps distinguish pre-hepatic, hepatocellular, and obstructive jaundice types.
					</p>
				</div>
			</div>

			<div class="prose prose-sm max-w-none text-slate-700 text-xs sm:text-sm bg-slate-50/50 p-4 rounded-xl border border-slate-100">
				{@html medicalNotesMarkdown}
			</div>
		</div>
	{/if}
</div>

