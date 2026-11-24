<script lang="ts">
	import { FlaskConical, Calendar, FileText, Check, Zap } from 'lucide-svelte';
	import Badge from '$components/Badge.svelte';

	let { data } = $props();

	const statuses = [
		'pending',
		'confirmed',
		'sample_collected',
		'processing',
		'completed',
		'cancelled'
	];

	const expressStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

	function serviceLabel(type: string): string {
		if (type === 'doctor_consultation') return 'Doctor Consultation';
		if (type === 'general') return 'General Inquiry';
		return 'Lab Test (Home Sample)';
	}

	function formatCreated(value: string | Date): string {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return '—';
		return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
	}
</script>

<svelte:head>
	<title>Manage Bookings | Admin</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h2 class="text-xl font-bold tracking-tight text-slate-900">Lab Test Orders & Phlebotomy Status</h2>
		<p class="text-xs text-slate-500 mt-1">
			Update collection statuses (Sample Collected, Processing, Report Ready) for lab technicians
		</p>
	</div>

	<!-- Express Bookings -->
	<div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
		<div class="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
			<div class="flex items-center gap-2.5">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
					<Zap class="h-4 w-4 fill-current" />
				</div>
				<div>
					<h3 class="text-sm font-bold text-slate-900">Express Bookings</h3>
					<p class="text-[11px] text-slate-500">Quick guest requests submitted from the navbar</p>
				</div>
			</div>
			<span class="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 border border-amber-200">
				{data.expressBookings.length} requests
			</span>
		</div>

		{#if data.expressBookings.length === 0}
			<div class="px-4 py-8 text-center">
				<Zap class="mx-auto mb-2 h-7 w-7 text-slate-300" />
				<p class="text-xs font-medium text-slate-500">No express bookings yet</p>
				<p class="text-[11px] text-slate-400 mt-0.5">New quick bookings will appear here automatically.</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs">
					<thead class="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
						<tr>
							<th class="p-3">Reference</th>
							<th class="p-3">Patient & Contact</th>
							<th class="p-3">Booking For</th>
							<th class="p-3">Preferred Date & Slot</th>
							<th class="p-3">Notes</th>
							<th class="p-3">Status</th>
							<th class="p-3">Update Status</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100 text-slate-700">
						{#each data.expressBookings as booking}
							<tr>
								<td class="p-3">
									<span class="font-mono font-semibold text-slate-900">{booking.reference}</span>
									<span class="mt-0.5 block text-[10px] text-slate-400">{formatCreated(booking.createdAt)}</span>
								</td>
								<td class="p-3">
									<span class="font-semibold text-slate-900 block">{booking.name || 'Guest Patient'}</span>
									<span class="text-slate-400">
										{booking.phone}{#if booking.gender} • {booking.gender}{/if}{#if booking.age}, {booking.age}y{/if}
									</span>
								</td>
								<td class="p-3">
									<span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
										{serviceLabel(booking.serviceType)}
									</span>
									{#if booking.serviceName}
										<span class="mt-1 block text-[10px] text-slate-500">{booking.serviceName}</span>
									{/if}
								</td>
								<td class="p-3">
									<span class="text-slate-800 block">{booking.preferredDate || 'Any day'}</span>
									<span class="text-red-600 font-medium">{booking.preferredSlot || 'Any slot'}</span>
								</td>
								<td class="p-3">
									<span class="text-slate-500 block max-w-[180px] truncate" title={booking.notes || ''}>
										{booking.notes || '—'}
									</span>
								</td>
								<td class="p-3">
									<Badge
										variant={booking.status === 'completed'
											? 'success'
											: booking.status === 'confirmed'
												? 'info'
												: booking.status === 'cancelled'
													? 'danger'
													: 'warning'}
										text={booking.status.toUpperCase()}
									/>
								</td>
								<td class="p-3">
									<form method="POST" action="?/updateExpressStatus" class="flex items-center gap-1">
										<input type="hidden" name="reference" value={booking.reference} />
										<select
											name="status"
											class="px-2 py-1 text-xs rounded border border-slate-300 bg-white"
											onchange={(e) => (e.currentTarget.form as HTMLFormElement)?.submit()}
										>
											{#each expressStatuses as s}
												<option value={s} selected={booking.status === s}>{s}</option>
											{/each}
										</select>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	<div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs">
				<thead class="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
					<tr>
						<th class="p-3">ID</th>
						<th class="p-3">Patient & Contact</th>
						<th class="p-3">Tests Ordered</th>
						<th class="p-3">Collection Address & Slot</th>
						<th class="p-3">Amount</th>
						<th class="p-3">Current Status</th>
						<th class="p-3">Update Status</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 text-slate-700">
					{#if data.testBookings.length === 0}
						<tr>
							<td colspan="7" class="p-8 text-center text-slate-400">
								No lab test orders placed yet. Blood &amp; diagnostic test bookings will appear here.
							</td>
						</tr>
					{/if}
					{#each data.testBookings as booking}
						<tr>
							<td class="p-3 font-mono font-medium text-slate-900">{booking.id}</td>
							<td class="p-3">
								<span class="font-semibold text-slate-900 block">{booking.patientName}</span>
								<span class="text-slate-400">{booking.patientPhone} • {booking.patientGender}, {booking.patientAge}y</span>
							</td>
							<td class="p-3">
								<div class="flex flex-wrap gap-1">
									{#if booking.items}
										{#each booking.items as item}
											<span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
												{item.test?.name}
											</span>
										{/each}
									{:else}
										<span class="text-slate-400">Diagnostic Tests</span>
									{/if}
								</div>
							</td>
							<td class="p-3">
								<span class="text-slate-800 block truncate max-w-xs">{booking.address}</span>
								<span class="text-red-600 font-medium">{booking.collectionDate} ({booking.collectionSlot})</span>
							</td>
							<td class="p-3 font-semibold">₹{booking.totalAmount}</td>
							<td class="p-3">
								<Badge
									variant={booking.status === 'completed'
										? 'success'
										: booking.status === 'processing'
											? 'info'
											: 'warning'}
									text={booking.status.toUpperCase()}
								/>
							</td>
							<td class="p-3">
								<form method="POST" action="?/updateTestStatus" class="flex items-center gap-1">
									<input type="hidden" name="bookingId" value={booking.id} />
									<select
										name="status"
										class="px-2 py-1 text-xs rounded border border-slate-300 bg-white"
										onchange={(e) => (e.currentTarget.form as HTMLFormElement)?.submit()}
									>
										{#each statuses as s}
											<option value={s} selected={booking.status === s}>{s}</option>
										{/each}
									</select>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
