<script lang="ts">
	import {
		Search,
		Filter,
		FlaskConical,
		CheckCircle2,
		Calendar,
		Clock,
		MapPin,
		User,
		Phone,
		ShieldCheck,
		ArrowRight,
		Check,
		FileText,
		AlertCircle
	} from 'lucide-svelte';
	import TestCard from '$components/TestCard.svelte';
	import Button from '$components/Button.svelte';
	import Card from '$components/Card.svelte';

	let { data, form } = $props();

	let searchQuery = $state('');
	let selectedCategory = $state('All');
	let selectedTestIds = $state<string[]>([
		// Default with fasting blood sugar pre-selected for convenience
		'22222222-2222-2222-2222-222222222202'
	]);

	// Patient form fields
	let patientName = $state('');
	let patientPhone = $state('');
	let patientAge = $state<string | number>('');
	let patientGender = $state('male');
	let address = $state('');

	// Date defaults to tomorrow
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	const defaultDateStr = tomorrow.toISOString().split('T')[0];

	let collectionDate = $state(defaultDateStr);
	let collectionSlot = $state('8AM-10AM');
	let submitting = $state(false);

	$effect(() => {
		if (form?.values?.patientName) patientName = form.values.patientName;
		if (form?.values?.patientPhone) patientPhone = form.values.patientPhone;
		if (form?.values?.patientAge) patientAge = form.values.patientAge;
		if (form?.values?.patientGender) patientGender = form.values.patientGender;
		if (form?.values?.address) address = form.values.address;
		if (form?.values?.collectionDate) collectionDate = form.values.collectionDate;
		if (form?.values?.collectionSlot) collectionSlot = form.values.collectionSlot;
	});

	const categories = [
		'All',
		'Sugar',
		'Jaundice',
		'TB',
		'Thyroid',
		'Liver',
		'Kidney',
		'Heart',
		'Routine',
		'Vitamin'
	];

	const timeSlots = [
		{ id: '8AM-10AM', label: '8:00 AM – 10:00 AM (Recommended for Fasting)' },
		{ id: '10AM-12PM', label: '10:00 AM – 12:00 PM' },
		{ id: '12PM-2PM', label: '12:00 PM – 2:00 PM' },
		{ id: '2PM-4PM', label: '2:00 PM – 4:00 PM' }
	];

	function toggleTest(test: { id: string }) {
		if (selectedTestIds.includes(test.id)) {
			if (selectedTestIds.length > 1) {
				selectedTestIds = selectedTestIds.filter((id) => id !== test.id);
			}
		} else {
			selectedTestIds = [...selectedTestIds, test.id];
		}
	}

	let filteredTests = $derived(
		data.tests.filter((test: any) => {
			const matchesCategory =
				selectedCategory === 'All' ||
				test.category.toLowerCase() === selectedCategory.toLowerCase() ||
				(selectedCategory === 'Jaundice' && test.category === 'Liver') ||
				(selectedCategory === 'Liver' && test.category === 'Jaundice');

			const matchesSearch =
				test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				test.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
				test.category.toLowerCase().includes(searchQuery.toLowerCase());

			return matchesCategory && matchesSearch;
		})
	);

	let selectedTestsList = $derived(
		data.tests.filter((t: any) => selectedTestIds.includes(t.id))
	);

	let totalAmount = $derived(
		selectedTestsList.reduce((acc: number, t: any) => acc + parseFloat(t.price), 0)
	);
</script>

<svelte:head>
	<title>Book Blood Sample & Diagnostic Tests | Bloodline Pathology</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
	{#if form?.success}
		<!-- Booking Success Confirmation State -->
		<div class="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
			<div class="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
				<CheckCircle2 class="w-9 h-9 stroke-[2.5]" />
			</div>
			<span class="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-2">
				Booking Confirmed
			</span>
			<h2 class="text-2xl font-bold text-slate-900">Blood Sample Collection Scheduled!</h2>
			<p class="text-sm text-slate-500 mt-2">
				Our certified phlebotomist will arrive at your address with a sterile collection kit.
			</p>

			<div class="mt-6 text-left bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3 text-xs sm:text-sm">
				<div class="flex justify-between border-b border-slate-200 pb-2">
					<span class="text-slate-500">Booking Reference</span>
					<span class="font-mono font-semibold text-slate-900">{form.bookingId}</span>
				</div>
				<div class="flex justify-between border-b border-slate-200 pb-2">
					<span class="text-slate-500">Patient Name</span>
					<span class="font-semibold text-slate-900">{form.patientName}</span>
				</div>
				<div class="flex justify-between border-b border-slate-200 pb-2">
					<span class="text-slate-500">Collection Date</span>
					<span class="font-semibold text-slate-900">{form.collectionDate}</span>
				</div>
				<div class="flex justify-between border-b border-slate-200 pb-2">
					<span class="text-slate-500">Preferred Slot</span>
					<span class="font-semibold text-red-600">{form.collectionSlot}</span>
				</div>
				<div class="flex justify-between border-b border-slate-200 pb-2">
					<span class="text-slate-500">Tests Count</span>
					<span class="font-semibold text-slate-900">{form.testCount} Test(s)</span>
				</div>
				<div class="flex justify-between pt-1 text-base">
					<span class="font-bold text-slate-800">Total Paid</span>
					<span class="font-bold text-slate-900">₹{form.totalAmount}</span>
				</div>
			</div>

			<div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
				<Button variant="primary" size="md" href="/dashboard">
					Go to Dashboard
				</Button>
				<Button variant="outline" size="md" href="/book-test">
					Book Another Test
				</Button>
			</div>
		</div>
	{:else}
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center gap-2 text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">
				<FlaskConical class="w-4 h-4" />
				Home Diagnostic Services
			</div>
			<h1 class="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
				Book Blood Sample & Diagnostic Tests
			</h1>
			<p class="mt-2 text-sm text-slate-500 max-w-2xl">
				Select your required laboratory tests (TB, Sugar, Jaundice, CBC, Lipid & more), provide patient details, and get accurate digital reports delivered to your dashboard.
			</p>
		</div>

		{#if form?.error}
			<div class="mb-6 rounded-xl bg-red-50 p-4 border border-red-200 text-xs sm:text-sm text-red-700 flex items-start gap-2">
				<AlertCircle class="w-4 h-4 mt-0.5 flex-shrink-0" />
				<span>{form.error}</span>
			</div>
		{/if}

		<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
			<!-- Left column: Test Selection catalog (7 cols) -->
			<div class="lg:col-span-7 space-y-6">
				<!-- Search and Category Filters -->
				<div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
					<div class="relative">
						<Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
						<input
							type="text"
							placeholder="Search tests by name (e.g. Sugar, Jaundice, TB, Thyroid, CBC)..."
							bind:value={searchQuery}
							class="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
						/>
					</div>

					<!-- Categories pills -->
					<div class="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
						{#each categories as cat}
							<button
								type="button"
								onclick={() => (selectedCategory = cat)}
								class="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer {selectedCategory === cat
									? 'bg-red-600 text-white'
									: 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
							>
								{cat}
							</button>
						{/each}
					</div>
				</div>

				<!-- Tests Grid -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{#each filteredTests as test}
						{@const isSelected = selectedTestIds.includes(test.id)}
						<TestCard
							{test}
							selected={isSelected}
							onToggle={() => toggleTest(test)}
						/>
					{/each}
				</div>

				{#if filteredTests.length === 0}
					<div class="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-500 text-sm">
						No tests match your filter or search criteria.
					</div>
				{/if}
			</div>

			<!-- Right column: Basic Details Form & Summary (5 cols) -->
			<div class="lg:col-span-5 sticky top-20">
				<form
					method="POST"
					class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5"
					onsubmit={() => (submitting = true)}
				>
					<!-- Hidden test ids to submit -->
					{#each selectedTestIds as testId}
						<input type="hidden" name="testIds" value={testId} />
					{/each}

					<div>
						<h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
							<User class="w-4 h-4 text-red-600" />
							Patient Details
						</h2>
						<p class="text-xs text-slate-400 mt-0.5">Details for sample collection and report</p>
					</div>

					<!-- Basic Details Form Fields -->
					<div class="space-y-3.5">
						<div>
							<label for="patientName" class="block text-xs font-medium text-slate-700 mb-1">
								Patient Full Name <span class="text-red-500">*</span>
							</label>
							<input
								id="patientName"
								name="patientName"
								type="text"
								required
								bind:value={patientName}
								placeholder="e.g. Ramesh Kumar"
								class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
							/>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div>
								<label for="patientPhone" class="block text-xs font-medium text-slate-700 mb-1">
									Phone Number <span class="text-red-500">*</span>
								</label>
								<input
									id="patientPhone"
									name="patientPhone"
									type="tel"
									required
									bind:value={patientPhone}
									placeholder="9876543210"
									class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
								/>
							</div>

							<div>
								<label for="patientAge" class="block text-xs font-medium text-slate-700 mb-1">
									Age <span class="text-red-500">*</span>
								</label>
								<input
									id="patientAge"
									name="patientAge"
									type="number"
									required
									min="1"
									max="120"
									bind:value={patientAge}
									placeholder="35"
									class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
								/>
							</div>
						</div>

						<div>
							<span class="block text-xs font-medium text-slate-700 mb-1">Gender</span>
							<div class="grid grid-cols-3 gap-2">
								{#each ['male', 'female', 'other'] as gender}
									<label
										class="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border cursor-pointer capitalize transition-colors {patientGender === gender
											? 'border-red-600 bg-red-50 text-red-700'
											: 'border-slate-200 text-slate-600 hover:bg-slate-50'}"
									>
										<input
											type="radio"
											name="patientGender"
											value={gender}
											bind:group={patientGender}
											class="sr-only"
										/>
										{gender}
									</label>
								{/each}
							</div>
						</div>

						<div>
							<label for="address" class="block text-xs font-medium text-slate-700 mb-1">
								Sample Collection Address <span class="text-red-500">*</span>
							</label>
							<textarea
								id="address"
								name="address"
								required
								rows="2"
								bind:value={address}
								placeholder="Flat/House No, Street, Landmark, City & Pincode"
								class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
							></textarea>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div>
								<label for="collectionDate" class="block text-xs font-medium text-slate-700 mb-1">
									Collection Date
								</label>
								<input
									id="collectionDate"
									name="collectionDate"
									type="date"
									required
									min={defaultDateStr}
									bind:value={collectionDate}
									class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
								/>
							</div>

							<div>
								<label for="collectionSlot" class="block text-xs font-medium text-slate-700 mb-1">
									Preferred Slot
								</label>
								<select
									id="collectionSlot"
									name="collectionSlot"
									bind:value={collectionSlot}
									class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
								>
									{#each timeSlots as slot}
										<option value={slot.id}>{slot.id}</option>
									{/each}
								</select>
							</div>
						</div>
					</div>

					<!-- Selected Tests Summary -->
					<div class="pt-4 border-t border-slate-200">
						<div class="flex items-center justify-between mb-2">
							<span class="text-xs font-semibold text-slate-900">Selected Tests ({selectedTestsList.length})</span>
							<span class="text-xs text-red-600 font-medium">Verified Lab Tests</span>
						</div>

						<div class="max-h-36 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
							{#each selectedTestsList as item}
								<div class="flex items-center justify-between text-xs py-1">
									<span class="text-slate-700 truncate pr-2">{item.name}</span>
									<span class="font-semibold text-slate-900 flex-shrink-0">₹{item.price}</span>
								</div>
							{/each}
						</div>

						<div class="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
							<div>
								<span class="text-xs text-slate-400 block">Total Amount</span>
								<span class="text-xl font-bold text-slate-900">₹{totalAmount}</span>
							</div>
						</div>
					</div>

					<Button
						type="submit"
						variant="primary"
						size="lg"
						fullWidth
						loading={submitting}
						disabled={selectedTestIds.length === 0}
					>
						Book Sample Collection & Pay ₹{totalAmount}
						<ArrowRight class="w-4 h-4 ml-1" />
					</Button>

					<p class="text-[11px] text-center text-slate-400">
						Reports uploaded directly to your account with SMS & WhatsApp alert
					</p>
				</form>
			</div>
		</div>
	{/if}
</div>
