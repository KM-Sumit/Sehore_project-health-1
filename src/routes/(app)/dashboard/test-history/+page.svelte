<script lang="ts">
	import {
		ArrowLeft,
		FlaskConical,
		Download,
		Calendar,
		Clock,
		CheckCircle2,
		XCircle,
		MapPin,
		FileText,
		History
	} from 'lucide-svelte';
	import Button from '$components/Button.svelte';
	import Badge from '$components/Badge.svelte';
	import BookingStatus from '$components/BookingStatus.svelte';

	let { data } = $props();

	type Filter = 'all' | 'active' | 'completed' | 'cancelled';
	let filter = $state<Filter>('all');

	const ACTIVE_STATUSES = ['pending', 'confirmed', 'sample_collected', 'processing'];

	const filteredBookings = $derived(
		data.bookings.filter((booking: any) => {
			if (filter === 'all') return true;
			if (filter === 'active') return ACTIVE_STATUSES.includes(booking.status);
			return booking.status === filter;
		})
	);

	const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	function formatDate(value: unknown): string {
		if (!value) return '—';
		const date = new Date(value as string);
		if (Number.isNaN(date.getTime())) return String(value);
		return `${String(date.getUTCDate()).padStart(2, '0')} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
	}

	function formatDateTime(value: unknown): string {
		if (!value) return '—';
		const date = new Date(value as string);
		if (Number.isNaN(date.getTime())) return String(value);
		try {
			const time = new Intl.DateTimeFormat('en-IN', {
				timeZone: 'Asia/Kolkata',
				hour: '2-digit',
				minute: '2-digit',
				hour12: true
			}).format(date);
			return `${formatDate(value)}, ${time} IST`;
		} catch {
			return formatDate(value);
		}
	}

	function badgeVariant(status: string): 'info' | 'success' | 'warning' | 'danger' | 'neutral' {
		if (status === 'completed') return 'success';
		if (status === 'cancelled') return 'danger';
		if (status === 'pending') return 'warning';
		return 'info';
	}

	function shortId(id: string): string {
		return id ? id.slice(0, 8).toUpperCase() : '—';
	}

	const filters: { key: Filter; label: string; count: number }[] = $derived([
		{ key: 'all', label: 'All Orders', count: data.stats.total },
		{ key: 'active', label: 'In Progress', count: data.stats.active },
		{ key: 'completed', label: 'Completed', count: data.stats.completed },
		{ key: 'cancelled', label: 'Cancelled', count: data.stats.cancelled }
	]);
</script>

<svelte:head>
	<title>My Test Order History | Bloodline Pathology</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<a
				href="/dashboard"
				class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-600 transition-colors mb-2"
			>
				<ArrowLeft class="w-3.5 h-3.5" />
				Back to Dashboard
			</a>
			<div class="flex items-center gap-2">
				<h1 class="text-2xl font-bold tracking-tight text-slate-900">My Test Order History</h1>
				<History class="w-5 h-5 text-red-600" />
			</div>
			<p class="text-xs sm:text-sm text-slate-500 mt-1">
				Every blood test and home sample collection you have booked, newest first.
			</p>
		</div>
		<Button variant="primary" size="sm" href="/book-test">
			<FlaskConical class="w-4 h-4" />
			Book New Test
		</Button>
	</div>

	{#if !data.dbAvailable}
		<div class="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800">
			Database is temporarily unreachable — showing bookings saved in this session only. Please refresh in a moment.
		</div>
	{/if}

	<!-- Summary -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
		<div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
			<span class="text-[11px] font-medium text-slate-500">Total Orders</span>
			<p class="text-2xl font-bold text-slate-900 mt-1">{data.stats.total}</p>
			<p class="text-[11px] text-slate-400">All time</p>
		</div>
		<div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
			<span class="text-[11px] font-medium text-slate-500">In Progress</span>
			<p class="text-2xl font-bold text-sky-700 mt-1">{data.stats.active}</p>
			<p class="text-[11px] text-slate-400">Pending / processing</p>
		</div>
		<div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
			<span class="text-[11px] font-medium text-slate-500">Completed</span>
			<p class="text-2xl font-bold text-emerald-700 mt-1">{data.stats.completed}</p>
			<p class="text-[11px] text-slate-400">Reports ready</p>
		</div>
		<div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
			<span class="text-[11px] font-medium text-slate-500">Total Spent</span>
			<p class="text-2xl font-bold text-slate-900 mt-1">₹{data.stats.totalSpent}</p>
			<p class="text-[11px] text-slate-400">Excludes cancelled</p>
		</div>
	</div>

	<!-- Filters -->
	<div class="flex flex-wrap items-center gap-2">
		{#each filters as item}
			<button
				type="button"
				onclick={() => (filter = item.key)}
				class="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer {filter === item.key
					? 'bg-red-600 border-red-600 text-white'
					: 'bg-white border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-600'}"
			>
				{item.label} ({item.count})
			</button>
		{/each}
	</div>

	<!-- Orders -->
	{#if data.bookings.length === 0}
		<div class="bg-white p-12 text-center rounded-2xl border border-slate-200">
			<FlaskConical class="w-10 h-10 text-slate-300 mx-auto mb-3" />
			<h3 class="text-sm font-semibold text-slate-800">No test orders yet</h3>
			<p class="text-xs text-slate-400 mt-1 mb-4">
				Once you book a blood test or home sample collection, it will appear here with live status.
			</p>
			<Button variant="primary" size="sm" href="/book-test">Book Your First Test</Button>
		</div>
	{:else if filteredBookings.length === 0}
		<div class="bg-white p-10 text-center rounded-2xl border border-slate-200">
			<FileText class="w-8 h-8 text-slate-300 mx-auto mb-2" />
			<p class="text-sm font-semibold text-slate-700">No orders in this category</p>
			<p class="text-xs text-slate-400 mt-1">Try a different filter above.</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each filteredBookings as booking}
				<div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
					<!-- Row 1: id, status, ordered date -->
					<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3.5">
						<div class="flex items-center gap-2 flex-wrap">
							<span class="text-sm font-bold font-mono text-slate-900" title={booking.id}>
								#{shortId(booking.id)}
							</span>
							<Badge
								variant={badgeVariant(booking.status)}
								text={String(booking.status).replace('_', ' ').toUpperCase()}
							/>
							<span class="inline-flex items-center gap-1 text-[11px] text-slate-400">
								<Clock class="w-3 h-3" />
								Ordered {formatDateTime(booking.createdAt)}
							</span>
						</div>

						{#if booking.status === 'completed'}
							<a
								href="/api/reports/{booking.id}"
								target="_blank"
								class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
							>
								<Download class="w-3.5 h-3.5" />
								Download Report
							</a>
						{:else if booking.status === 'cancelled'}
							<span class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
								<XCircle class="w-3.5 h-3.5" />
								Order cancelled
							</span>
						{:else}
							<span class="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
								<CheckCircle2 class="w-3.5 h-3.5" />
								Report available after completion
							</span>
						{/if}
					</div>

					<!-- Patient + amount -->
					<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
						<p class="text-slate-500">
							Patient:
							<span class="font-semibold text-slate-800">{booking.patientName}</span>
							({booking.patientGender}, {booking.patientAge}y) • Tel: {booking.patientPhone}
						</p>
						<p class="text-slate-500">
							Amount:
							<span class="font-bold text-slate-900 text-sm">₹{booking.totalAmount}</span>
						</p>
					</div>

					<!-- Progress -->
					{#if booking.status !== 'cancelled'}
						<div class="max-w-2xl">
							<BookingStatus status={booking.status} type="test" />
						</div>
					{/if}

					<!-- Collection details -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
						<div class="flex items-start gap-2">
							<Calendar class="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
							<div>
								<span class="text-slate-400 block">Sample collection</span>
								<span class="font-medium text-slate-800">
									{formatDate(booking.collectionDate)} • {booking.collectionSlot}
								</span>
							</div>
						</div>
						<div class="flex items-start gap-2">
							<MapPin class="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
							<div>
								<span class="text-slate-400 block">Address</span>
								<span class="font-medium text-slate-800">{booking.address}</span>
							</div>
						</div>
					</div>

					<!-- Tests ordered -->
					<div>
						<span class="text-xs font-semibold text-slate-700 block mb-2">Tests ordered:</span>
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
