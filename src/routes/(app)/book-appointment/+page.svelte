<script lang="ts">
	import { Search, Filter, Stethoscope, Clock, IndianRupee, Calendar, QrCode } from 'lucide-svelte';
	import Card from '$components/Card.svelte';
	import Button from '$components/Button.svelte';

	let { data } = $props();

	let searchQuery = $state('');
	let selectedSpecialty = $state('All');

	const specialties = ['All', 'Cardiology', 'Dermatology', 'Orthopedics', 'Pediatrics', 'General', 'Neurology'];

	let filteredDoctors = $derived(
		data.doctors.filter((doctor: any) => {
			const matchesSearch =
				doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesSpecialty = selectedSpecialty === 'All' || doctor.specialty === selectedSpecialty;
			return matchesSearch && matchesSpecialty;
		})
	);
</script>

<svelte:head>
	<title>Book a Doctor Consultation | Bloodline Pathology</title>
</svelte:head>

<div class="container mx-auto px-4 max-w-7xl py-8">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900">Book Doctor Consultation</h1>
		<p class="text-xs sm:text-sm text-slate-500 mt-1">
			Consult top medical specialists with verified clinical diagnostic support
		</p>
	</div>

	<!-- Referral Attribution Banner if patient scanned general QR -->
	{#if data.referralCode}
		<div class="mb-6 bg-purple-50 border border-purple-200 rounded-xl p-3.5 flex items-center gap-3">
			<div class="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
				<QrCode class="w-4 h-4" />
			</div>
			<div>
				<p class="text-xs font-bold text-purple-900">
					Clinic QR Referral Active: <span class="font-mono bg-purple-200 px-1.5 py-0.2 rounded text-[10px]">{data.referralCode}</span>
				</p>
				<p class="text-[11px] text-purple-700">
					Select your doctor below. Your consultation booking is tracked with referral attribution.
				</p>
			</div>
		</div>
	{/if}

	<!-- Search & Filter Bar -->
	<div class="flex flex-col sm:flex-row gap-3 mb-8">
		<div class="relative flex-1">
			<Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
			<input
				type="text"
				placeholder="Search by doctor name or specialty..."
				bind:value={searchQuery}
				class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
			/>
		</div>
		<div class="relative">
			<Filter class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
			<select
				bind:value={selectedSpecialty}
				class="pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors appearance-none min-w-[180px]"
			>
				{#each specialties as specialty}
					<option value={specialty}>{specialty}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Doctor Grid -->
	{#if filteredDoctors.length === 0}
		<div class="text-center py-16 bg-white rounded-xl border border-slate-200">
			<Stethoscope class="w-10 h-10 text-slate-300 mx-auto mb-3" />
			<h3 class="text-sm font-bold text-slate-700">No doctors found</h3>
			<p class="text-xs text-slate-400 mt-1">Try adjusting your search query or specialty filter</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
			{#each filteredDoctors as doctor}
				<Card hover>
					<div class="flex items-start gap-3.5">
						<!-- Avatar -->
						{#if doctor.imageUrl}
							<img
								src={doctor.imageUrl}
								alt={doctor.name}
								class="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
							/>
						{:else}
							<div class="w-14 h-14 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-xl font-extrabold shrink-0 border border-red-100">
								+
							</div>
						{/if}
						<div class="flex-1 min-w-0">
							<h3 class="font-bold text-slate-900 truncate text-sm">{doctor.name}</h3>
							<p class="text-xs text-red-600 font-semibold">{doctor.specialty}</p>
							<p class="text-[11px] text-slate-400 mt-0.5 truncate">{doctor.qualification}</p>
						</div>
					</div>

					<div class="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
						<span class="flex items-center gap-1 text-[11px]">
							<Clock class="w-3.5 h-3.5 text-slate-400" />
							{doctor.experienceYears} yrs experience
						</span>
						<span class="font-bold text-slate-900 text-xs">
							₹{doctor.consultationFee}
						</span>
					</div>

					{#if doctor.bio}
						<p class="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">{doctor.bio}</p>
					{/if}

					<div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
						<span class="text-[11px] text-slate-500 font-medium flex items-center gap-1">
							<Calendar class="w-3.5 h-3.5 text-red-600" />
							{(doctor.slots?.length ?? 0)} slot{(doctor.slots?.length ?? 0) !== 1 ? 's' : ''} available
						</span>
						<Button
							href="/book-appointment/{doctor.id}{data.referralCode ? `?ref=${data.referralCode}` : ''}"
							size="sm"
							variant="primary"
						>
							{#snippet children()}Book Consultation{/snippet}
						</Button>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>
