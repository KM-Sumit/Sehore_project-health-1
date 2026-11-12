<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import {
		Search,
		FlaskConical,
		CheckCircle2,
		User,
		ShieldCheck,
		ArrowRight,
		AlertCircle,
		Sparkles,
		Building2,
		CreditCard,
		Smartphone,
		ChevronRight,
		Printer,
		History,
		Lock,
		Tag
	} from 'lucide-svelte';
	import TestCard from '$components/TestCard.svelte';
	import Button from '$components/Button.svelte';
	import Modal from '$components/Modal.svelte';
	import { addToast } from '$utils/toast';

	let { data, form } = $props();

	let searchQuery = $state(untrack(() => data.initialSearch) || '');
	let selectedCategory = $state(untrack(() => data.initialCategory) || 'All');
	let selectedTestIds = $state<string[]>([
		// Default with fasting blood sugar pre-selected for convenience
		'22222222-2222-2222-2222-222222222202'
	]);

	// Patient form fields
	let patientName = $state('');
	let patientPhone = $state('');
	let patientEmail = $state('');
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

	// Payment state
	let selectedPaymentMode = $state<'demo_online' | 'pay_at_collection'>('demo_online');
	let paymentModalOpen = $state(false);
	let paymentTab = $state<'upi' | 'card'>('upi');
	let selectedUpiApp = $state('Google Pay');
	let demoUpiId = $state('patient@okaxis');
	let isProcessingPayment = $state(false);
	let paymentProcessingStep = $state('');

	let formElement: HTMLFormElement | null = $state(null);
	let hiddenPaymentMode = $state<'demo_online' | 'pay_at_collection'>('demo_online');
	let hiddenPaymentMethod = $state('UPI (Demo Instant)');
	let hiddenPaymentOrderId = $state('');
	let hiddenPaymentId = $state('');
	let hiddenPaymentSignature = $state('');

	// Optional post-booking account state
	let showOptionalAccountForm = $state(true);
	let optName = $state('');
	let optEmail = $state('');
	let optPhone = $state('');
	let optPassword = $state('');
	let optConfirmPassword = $state('');
	let creatingAccount = $state(false);

	$effect(() => {
		if (data.initialCategory && selectedCategory === 'All' && data.initialCategory !== 'All') {
			selectedCategory = data.initialCategory;
		}
		if (data.initialSearch && !searchQuery) {
			searchQuery = data.initialSearch;
		}
		if (data.user) {
			if (!patientName) patientName = data.user.name || '';
			if (!patientPhone) patientPhone = data.user.phone || '';
			if (!patientEmail) patientEmail = data.user.email || '';
		}
	});

	$effect(() => {
		if (form?.values?.patientName) patientName = form.values.patientName;
		if (form?.values?.patientPhone) patientPhone = form.values.patientPhone;
		if (form?.values?.patientEmail) patientEmail = form.values.patientEmail;
		if (form?.values?.patientAge) patientAge = form.values.patientAge;
		if (form?.values?.patientGender) patientGender = form.values.patientGender;
		if (form?.values?.address) address = form.values.address;
		if (form?.values?.collectionDate) collectionDate = form.values.collectionDate;
		if (form?.values?.collectionSlot) collectionSlot = form.values.collectionSlot;
	});

	$effect(() => {
		if (form?.success && !form?.accountCreated) {
			if (!optName) optName = form.accountName || form.patientName || '';
			if (!optEmail) optEmail = form.accountEmail || form.patientEmail || '';
			if (!optPhone) optPhone = form.accountPhone || form.patientPhone || '';
		}
	});

	$effect(() => {
		if (form?.accountCreated) {
			addToast('Account created and blood test booking saved to your history!', 'success');
		} else if (form?.success) {
			addToast(
				form.paymentStatus === 'paid'
					? 'Payment verified & sample collection confirmed!'
					: 'Sample collection scheduled!',
				'success'
			);
		}
		if (form?.error) {
			addToast(form.error, 'error');
		}
		if (form?.accountError) {
			addToast(form.accountError, 'error');
		}
	});

	const categories = [
		'All',
		'Blood',
		'Sugar',
		'Jaundice',
		'TB',
		'Thyroid',
		'Liver',
		'Kidney',
		'Heart',
		'Routine',
		'Vitamin',
		'Infection'
	];

	const timeSlots = [
		{ id: '8AM-10AM', label: '8:00 AM – 10:00 AM (Recommended for Fasting)' },
		{ id: '10AM-12PM', label: '10:00 AM – 12:00 PM' },
		{ id: '12PM-2PM', label: '12:00 PM – 2:00 PM' },
		{ id: '2PM-4PM', label: '2:00 PM – 4:00 PM' }
	];

	function isBloodTest(test: { name?: string; description?: string; category?: string }): boolean {
		const haystack = `${test.name ?? ''} ${test.description ?? ''} ${test.category ?? ''}`.toLowerCase();
		if (haystack.includes('urine')) return false;
		return true;
	}

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
			const cat = selectedCategory.toLowerCase();
			const testCat = String(test.category || '').toLowerCase();
			const matchesCategory =
				cat === 'all' ||
				(cat === 'blood' && isBloodTest(test)) ||
				testCat === cat ||
				(cat === 'jaundice' && testCat === 'liver') ||
				(cat === 'liver' && testCat === 'jaundice');

			const q = searchQuery.toLowerCase();
			const matchesSearch =
				!q ||
				test.name.toLowerCase().includes(q) ||
				test.description.toLowerCase().includes(q) ||
				testCat.includes(q);

			return matchesCategory && matchesSearch;
		})
	);

	let selectedTestsList = $derived(
		data.tests.filter((t: any) => selectedTestIds.includes(t.id))
	);

	let totalAmount = $derived(
		selectedTestsList.reduce((acc: number, t: any) => acc + parseFloat(t.price), 0)
	);

	function validateBookingInputs(): boolean {
		if (selectedTestIds.length === 0) {
			addToast('Please select at least one diagnostic test.', 'error');
			return false;
		}
		if (!patientName || patientName.trim().length < 2) {
			addToast('Please enter patient full name.', 'error');
			return false;
		}
		const cleanDigits = patientPhone.replace(/\D/g, '');
		const lastTen = cleanDigits.length > 10 ? cleanDigits.slice(-10) : cleanDigits;
		if (!/^[6-9]\d{9}$/.test(lastTen)) {
			addToast('Please enter a valid 10-digit Indian mobile number.', 'error');
			return false;
		}
		const ageNum = Number(patientAge);
		if (!ageNum || ageNum < 1 || ageNum > 150) {
			addToast('Please enter a valid patient age (1-150).', 'error');
			return false;
		}
		if (!address || address.trim().length < 10) {
			addToast('Please enter a complete collection address (at least 10 characters).', 'error');
			return false;
		}
		return true;
	}

	function handleFormSubmit(e: SubmitEvent) {
		if (!validateBookingInputs()) {
			e.preventDefault();
			return;
		}

		if (selectedPaymentMode === 'demo_online') {
			if (!hiddenPaymentSignature) {
				e.preventDefault();
				paymentModalOpen = true;
			} else {
				submitting = true;
			}
			return;
		}

		hiddenPaymentMode = 'pay_at_collection';
		hiddenPaymentMethod = 'Pay on Sample Collection';
		hiddenPaymentOrderId = '';
		hiddenPaymentId = '';
		hiddenPaymentSignature = '';
		submitting = true;
	}

	async function simulatePaymentSuccess() {
		isProcessingPayment = true;
		paymentProcessingStep = 'Creating payment order...';

		try {
			const orderRes = await fetch('/api/payment/create-order', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					testIds: selectedTestIds
				})
			});
			const orderData = await orderRes.json();

			if (!orderRes.ok || !orderData.id || !orderData.paymentId || !orderData.paymentSignature) {
				throw new Error(orderData.error || 'Could not initialize payment order');
			}

			paymentProcessingStep = 'Authorizing transaction...';
			await new Promise((r) => setTimeout(r, 450));

			paymentProcessingStep = 'Payment verified! Scheduling sample pickup...';
			await new Promise((r) => setTimeout(r, 350));

			hiddenPaymentMode = 'demo_online';
			hiddenPaymentMethod =
				paymentTab === 'upi' ? `UPI Demo (${selectedUpiApp})` : 'Card Demo (Visa/Mastercard)';
			hiddenPaymentOrderId = orderData.id;
			hiddenPaymentId = orderData.paymentId;
			hiddenPaymentSignature = orderData.paymentSignature;

			await tick();
			isProcessingPayment = false;
			paymentModalOpen = false;
			submitting = true;

			if (formElement) {
				formElement.submit();
			}
		} catch (err: any) {
			isProcessingPayment = false;
			addToast(err?.message || 'Payment failed. Please try again.', 'error');
		}
	}

	function printReceipt() {
		if (typeof window !== 'undefined') {
			window.print();
		}
	}
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
				{form.paymentStatus === 'paid' ? 'Payment Verified & Confirmed' : 'Sample Collection Scheduled'}
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
				<div class="flex justify-between border-b border-slate-200 pb-2">
					<span class="text-slate-500">Payment Status</span>
					{#if form.paymentStatus === 'paid'}
						<span class="font-bold text-emerald-700 flex items-center gap-1">
							<ShieldCheck class="w-4 h-4" /> PAID ({form.paymentMethod || 'Online'})
						</span>
					{:else}
						<span class="font-bold text-amber-700">Pay on Sample Collection</span>
					{/if}
				</div>
				{#if form.paymentId}
					<div class="flex justify-between border-b border-slate-200 pb-2">
						<span class="text-slate-500">Transaction ID</span>
						<span class="font-mono text-slate-700">{form.paymentId}</span>
					</div>
				{/if}
				<div class="flex justify-between pt-1 text-base">
					<span class="font-bold text-slate-800">Total {form.paymentStatus === 'paid' ? 'Paid' : 'Payable'}</span>
					<span class="font-bold text-slate-900">₹{form.totalAmount}</span>
				</div>
			</div>

			{#if form.selectedTests && form.selectedTests.length > 0}
				<div class="mt-4 text-left flex flex-wrap gap-2">
					{#each form.selectedTests as t}
						<span class="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
							{t.name} (₹{t.price})
						</span>
					{/each}
				</div>
			{/if}

			<div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
				<button
					type="button"
					onclick={printReceipt}
					class="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
				>
					<Printer class="w-3.5 h-3.5" />
					Print Receipt
				</button>
				{#if data.user || form.accountCreated}
					<Button variant="primary" size="md" href="/dashboard">
						Go to Dashboard
					</Button>
				{/if}
				<Button variant="outline" size="md" href="/book-test">
					Book Another Test
				</Button>
			</div>
		</div>

		{#if form.accountCreated}
			<div class="max-w-2xl mx-auto mt-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-xs text-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div class="flex items-start gap-3">
					<div class="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
						<Tag class="w-4 h-4" />
					</div>
					<div>
						<h3 class="font-bold text-sm">Account Created &amp; Booking Saved!</h3>
						<p class="text-emerald-800 mt-0.5">
							Signed in as <span class="font-semibold">{form.createdUserEmail}</span>. Your test booking is saved to your history.
						</p>
					</div>
				</div>
				<Button variant="primary" size="sm" href="/dashboard">Open Dashboard</Button>
			</div>
		{:else if !data.user && showOptionalAccountForm}
			<div class="max-w-2xl mx-auto mt-6 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 text-xs">
				<div class="flex items-start justify-between gap-3 mb-4">
					<div class="flex items-start gap-3">
						<div class="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
							<History class="w-4 h-4" />
						</div>
						<div>
							<span class="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold text-[10px] uppercase tracking-wide mb-1">
								Optional • Not Required
							</span>
							<h3 class="text-sm font-bold text-slate-900">
								Want to save your lab history &amp; unlock 15% off repeat doctor bookings?
							</h3>
							<p class="text-slate-500 mt-0.5">
								Your sample collection is already confirmed! Create an optional account below to view test history anytime.
							</p>
						</div>
					</div>
					<button
						type="button"
						onclick={() => (showOptionalAccountForm = false)}
						class="text-slate-400 hover:text-slate-600 text-[11px] font-medium shrink-0 cursor-pointer"
					>
						Skip
					</button>
				</div>

				{#if form?.accountError}
					<div class="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200 flex items-center gap-2">
						<AlertCircle class="w-4 h-4 shrink-0" />
						<span>{form.accountError}</span>
					</div>
				{/if}

				<form
					method="POST"
					action="?/createAccount"
					use:enhance={() => {
						creatingAccount = true;
						return async ({ update }) => {
							creatingAccount = false;
							await update();
							await invalidateAll();
						};
					}}
					class="space-y-3"
				>
					<input type="hidden" name="bookingId" value={form.bookingId} />
					<input type="hidden" name="storeBookingId" value={form.storeBookingId || form.bookingId} />

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<label for="optTestName" class="block font-semibold text-slate-700 mb-1">Full Name</label>
							<input
								id="optTestName"
								name="name"
								type="text"
								required
								bind:value={optName}
								class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
							/>
						</div>
						<div>
							<label for="optTestPhone" class="block font-semibold text-slate-700 mb-1">Mobile Number</label>
							<input
								id="optTestPhone"
								name="phone"
								type="tel"
								required
								bind:value={optPhone}
								class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
							/>
						</div>
					</div>

					<div>
						<label for="optTestEmail" class="block font-semibold text-slate-700 mb-1">Email Address</label>
						<input
							id="optTestEmail"
							name="email"
							type="email"
							required
							bind:value={optEmail}
							placeholder="you@example.com"
							class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
						/>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<label for="optTestPassword" class="block font-semibold text-slate-700 mb-1">Create Password</label>
							<input
								id="optTestPassword"
								name="password"
								type="password"
								required
								minlength="6"
								bind:value={optPassword}
								placeholder="Min. 6 characters"
								class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
							/>
						</div>
						<div>
							<label for="optTestConfirmPassword" class="block font-semibold text-slate-700 mb-1">Confirm Password</label>
							<input
								id="optTestConfirmPassword"
								name="confirmPassword"
								type="password"
								required
								minlength="6"
								bind:value={optConfirmPassword}
								placeholder="Re-enter password"
								class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
							/>
						</div>
					</div>

					<div class="pt-1 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
						<button
							type="submit"
							disabled={creatingAccount}
							class="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
						>
							<Lock class="w-3.5 h-3.5" />
							<span>{creatingAccount ? 'Creating Account...' : 'Create Optional Account & Save Booking'}</span>
						</button>
						<button
							type="button"
							onclick={() => (showOptionalAccountForm = false)}
							class="text-slate-500 hover:text-slate-700 text-xs font-medium cursor-pointer"
						>
							No thanks, continue without account
						</button>
					</div>
				</form>
			</div>
		{/if}
	{:else}
		<!-- Header -->
		<div class="mb-6">
			<div class="flex items-center gap-2 text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">
				<FlaskConical class="w-4 h-4" />
				Home Diagnostic Services
			</div>
			<h1 class="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
				Book Blood Sample & Diagnostic Tests
			</h1>
			<p class="mt-2 text-sm text-slate-500 max-w-2xl">
				Select your required laboratory tests (Blood, TB, Sugar, Jaundice, CBC, Lipid & more), provide patient details, and complete booking without creating an account.
			</p>
		</div>

		{#if !data.user}
			<div class="mb-6 bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900">
				<div class="flex items-center gap-2">
					<ShieldCheck class="w-4 h-4 text-emerald-600 shrink-0" />
					<span><strong>Direct Booking (No Account Required):</strong> Select blood tests, pay, and confirm immediately. Optional account lets you view history anytime.</span>
				</div>
				<a href="/login?redirectTo=/book-test" class="text-[11px] font-semibold underline text-emerald-800 hover:text-emerald-950 shrink-0">
					Have an account? Sign in
				</a>
			</div>
		{/if}

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
							placeholder="Search tests by name (e.g. Blood, Sugar, Jaundice, TB, Thyroid, CBC)..."
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
					action="?/book"
					bind:this={formElement}
					onsubmit={handleFormSubmit}
					class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5"
				>
					<!-- Hidden test ids and payment proof fields -->
					{#each selectedTestIds as testId}
						<input type="hidden" name="testIds" value={testId} />
					{/each}
					<input type="hidden" name="paymentMode" value={hiddenPaymentMode} />
					<input type="hidden" name="paymentMethod" value={hiddenPaymentMethod} />
					<input type="hidden" name="paymentOrderId" value={hiddenPaymentOrderId} />
					<input type="hidden" name="paymentId" value={hiddenPaymentId} />
					<input type="hidden" name="paymentSignature" value={hiddenPaymentSignature} />

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
							<label for="patientEmail" class="block text-xs font-medium text-slate-700 mb-1">
								Email Address <span class="text-slate-400 font-normal">(optional, for digital report)</span>
							</label>
							<input
								id="patientEmail"
								name="patientEmail"
								type="email"
								bind:value={patientEmail}
								placeholder="patient@example.com"
								class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
							/>
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
								minlength="10"
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

						<!-- Payment Mode Selector -->
						<div class="pt-1">
							<span class="block text-xs font-semibold text-slate-800 mb-2">Payment Method</span>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
								<label
									class="flex items-start gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all {selectedPaymentMode === 'demo_online'
										? 'border-red-600 bg-red-50/40 text-slate-900'
										: 'border-slate-200 bg-white text-slate-600'}"
								>
									<input
										type="radio"
										name="testPaymentRadio"
										value="demo_online"
										bind:group={selectedPaymentMode}
										class="mt-0.5 text-red-600"
									/>
									<div>
										<span class="font-bold flex items-center gap-1">
											<Sparkles class="w-3 h-3 text-red-600" />
											Pay Online (Demo)
										</span>
										<span class="text-[10px] text-slate-500 block">UPI / Card instant</span>
									</div>
								</label>

								<label
									class="flex items-start gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all {selectedPaymentMode === 'pay_at_collection'
										? 'border-red-600 bg-red-50/40 text-slate-900'
										: 'border-slate-200 bg-white text-slate-600'}"
								>
									<input
										type="radio"
										name="testPaymentRadio"
										value="pay_at_collection"
										bind:group={selectedPaymentMode}
										class="mt-0.5 text-red-600"
									/>
									<div>
										<span class="font-bold flex items-center gap-1">
											<Building2 class="w-3 h-3 text-slate-700" />
											Pay on Pickup
										</span>
										<span class="text-[10px] text-slate-500 block">Cash / UPI to technician</span>
									</div>
								</label>
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
						{#if selectedPaymentMode === 'demo_online'}
							Pay ₹{totalAmount} &amp; Book Sample Collection
						{:else}
							Book Sample Collection (Pay on Pickup)
						{/if}
						<ArrowRight class="w-4 h-4 ml-1" />
					</Button>

					<p class="text-[11px] text-center text-slate-400">
						Instant booking confirmation — optionally create an account afterward to save report history
					</p>
				</form>
			</div>
		</div>
	{/if}
</div>

<!-- Interactive Demo Payment Simulator Modal -->
<Modal bind:open={paymentModalOpen} title="Bloodline Pathology — Demo Payment Gateway" size="md">
	<div class="space-y-4 text-xs">
		<div class="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between">
			<div>
				<span class="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Simulated Checkout</span>
				<p class="text-sm font-bold">{selectedTestsList.length} Diagnostic Test(s)</p>
			</div>
			<div class="text-right">
				<span class="text-[10px] text-slate-400 block">Payable</span>
				<span class="text-lg font-extrabold text-emerald-400">₹{totalAmount}</span>
			</div>
		</div>

		<div class="flex border-b border-slate-200">
			<button
				type="button"
				onclick={() => (paymentTab = 'upi')}
				class="flex-1 py-2 font-bold text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer
					{paymentTab === 'upi' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'}"
			>
				<Smartphone class="w-3.5 h-3.5" />
				UPI (GPay / PhonePe / Paytm)
			</button>
			<button
				type="button"
				onclick={() => (paymentTab = 'card')}
				class="flex-1 py-2 font-bold text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer
					{paymentTab === 'card' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'}"
			>
				<CreditCard class="w-3.5 h-3.5" />
				Credit / Debit Card (Demo)
			</button>
		</div>

		{#if paymentTab === 'upi'}
			<div class="space-y-3">
				<span class="text-[11px] text-slate-500 block">Select Instant Demo UPI App:</span>
				<div class="grid grid-cols-3 gap-2">
					{#each ['Google Pay', 'PhonePe', 'Paytm'] as app}
						<button
							type="button"
							onclick={() => (selectedUpiApp = app)}
							class="p-2.5 rounded-xl border text-center transition-all cursor-pointer
								{selectedUpiApp === app
									? 'border-red-600 bg-red-50 text-red-700 font-bold shadow-2xs'
									: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}"
						>
							<span class="block text-xs font-semibold">{app}</span>
							<span class="block text-[9px] text-slate-400">Demo Instant</span>
						</button>
					{/each}
				</div>

				<div>
					<label for="testDemoUpiId" class="block font-semibold text-slate-700 mb-1">UPI ID</label>
					<input
						id="testDemoUpiId"
						type="text"
						bind:value={demoUpiId}
						class="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono text-slate-700 bg-slate-50"
					/>
				</div>
			</div>
		{:else}
			<div class="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
				<div>
					<label for="testDemoCardNum" class="block text-[11px] font-semibold text-slate-600 mb-1">Simulated Card Number</label>
					<input
						id="testDemoCardNum"
						type="text"
						readonly
						value="4111 •••• •••• 4444"
						class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-mono bg-white"
					/>
				</div>
				<div class="grid grid-cols-2 gap-2">
					<div>
						<label for="testDemoCardExp" class="block text-[11px] font-semibold text-slate-600 mb-1">Expiry</label>
						<input
							id="testDemoCardExp"
							type="text"
							readonly
							value="12 / 28"
							class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-mono bg-white"
						/>
					</div>
					<div>
						<label for="testDemoCardCvv" class="block text-[11px] font-semibold text-slate-600 mb-1">CVV</label>
						<input
							id="testDemoCardCvv"
							type="text"
							readonly
							value="••• (123)"
							class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-mono bg-white"
						/>
					</div>
				</div>
			</div>
		{/if}

		<div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
			<button
				type="button"
				onclick={() => (paymentModalOpen = false)}
				class="px-3 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium text-xs cursor-pointer"
				disabled={isProcessingPayment}
			>
				Cancel
			</button>

			<button
				type="button"
				onclick={simulatePaymentSuccess}
				disabled={isProcessingPayment}
				class="flex-1 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
			>
				{#if isProcessingPayment}
					<span class="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
					<span>{paymentProcessingStep}</span>
				{:else}
					<span>Pay ₹{totalAmount} (Demo Success)</span>
					<ChevronRight class="w-4 h-4" />
				{/if}
			</button>
		</div>
	</div>
</Modal>
