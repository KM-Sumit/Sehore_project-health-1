<script lang="ts">
	import { FlaskConical, Calendar, FileText, Check } from 'lucide-svelte';
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

