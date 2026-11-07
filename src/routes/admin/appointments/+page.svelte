<script lang="ts">
	import {
		CalendarCheck,
		QrCode,
		Globe,
		Search,
		Filter,
		CheckCircle2,
		XCircle,
		Clock,
		Eye,
		Phone,
		Mail,
		User,
		IndianRupee
	} from 'lucide-svelte';
	import Button from '$components/Button.svelte';
	import Badge from '$components/Badge.svelte';
	import Modal from '$components/Modal.svelte';

	let { data } = $props();

	let appointments = $derived(data.appointments);
	let metrics = $derived(data.metrics);
	let filters = $derived(data.currentFilters);

	// View Details Modal State
	let selectedAppointment = $state<any>(null);
	let detailsModalOpen = $state(false);

	function openDetails(appt: any) {
		selectedAppointment = appt;
		detailsModalOpen = true;
	}
</script>

<svelte:head>
	<title>Appointment Requests | Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h2 class="text-xl font-bold tracking-tight text-slate-900">
				Patient Appointment Requests & Referral Tracking
			</h2>
			<p class="text-xs text-slate-500 mt-1">
				Review and approve doctor appointment bookings, verify Doctor QR code attribution, and track commission eligibility.
			</p>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="outline" size="sm" href="/admin/doctors">
				<QrCode class="w-3.5 h-3.5 mr-1" />
				Doctor QR Codes
			</Button>
		</div>
	</div>

	<!-- Quick Status Filter Bar -->
	<div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
		<!-- Search and Channel Filters -->
		<form method="GET" class="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
			<!-- Search -->
			<div class="relative flex-1 max-w-md">
				<Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
				<input
					type="text"
					name="search"
					value={filters.search}
					placeholder="Search by patient name, phone, doctor or QR code..."
					class="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500 bg-slate-50/50"
				/>
			</div>

			<!-- Source Filter -->
			<div class="flex items-center gap-2 flex-wrap">
				<span class="text-xs font-semibold text-slate-600">Booking Source:</span>
				<div class="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
					<a
						href="?source=all&status={filters.status}&search={filters.search}"
						class="px-2.5 py-1 text-xs rounded-md font-medium transition-colors {filters.source === 'all'
							? 'bg-white text-slate-900 shadow-2xs'
							: 'text-slate-600 hover:text-slate-900'}"
					>
						All Sources ({metrics.totalAppointments})
					</a>
					<a
						href="?source=doctor_qr&status={filters.status}&search={filters.search}"
						class="px-2.5 py-1 text-xs rounded-md font-medium transition-colors {filters.source === 'doctor_qr'
							? 'bg-purple-600 text-white shadow-2xs'
							: 'text-purple-700 hover:text-purple-900'}"
					>
						Doctor QR ({metrics.qrAppointmentsCount})
					</a>
					<a
						href="?source=direct&status={filters.status}&search={filters.search}"
						class="px-2.5 py-1 text-xs rounded-md font-medium transition-colors {filters.source === 'direct'
							? 'bg-slate-800 text-white shadow-2xs'
							: 'text-slate-600 hover:text-slate-900'}"
					>
						Direct Web ({metrics.directAppointmentsCount})
					</a>
				</div>
			</div>
		</form>

		<!-- Status Tabs -->
		<div class="flex items-center gap-2 border-t border-slate-100 pt-3 overflow-x-auto text-xs">
			<span class="text-slate-400 font-medium">Status:</span>
			{#each [
				{ id: 'all', label: 'All Requests' },
				{ id: 'pending', label: `Pending Review (${metrics.pendingAppointmentsCount})`, color: 'text-amber-600' },
				{ id: 'confirmed', label: `Confirmed (${metrics.confirmedAppointmentsCount})`, color: 'text-emerald-600' },
				{ id: 'completed', label: `Completed (${metrics.completedAppointmentsCount})`, color: 'text-blue-600' },
				{ id: 'cancelled', label: 'Cancelled' }
			] as tab}
				<a
					href="?status={tab.id}&source={filters.source}&search={filters.search}"
					class="px-3 py-1 rounded-full font-medium transition-colors whitespace-nowrap {filters.status === tab.id
						? 'bg-red-600 text-white font-semibold'
						: 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
				>
					{tab.label}
				</a>
			{/each}
		</div>
	</div>

	<!-- Appointments Table -->
	<div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs">
				<thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
					<tr>
						<th class="p-3.5">ID</th>
						<th class="p-3.5">Patient Details</th>
						<th class="p-3.5">Doctor & Specialty</th>
						<th class="p-3.5">Scheduled Slot</th>
						<th class="p-3.5">Booking Channel</th>
						<th class="p-3.5">Fee & Commission</th>
						<th class="p-3.5">Status</th>
						<th class="p-3.5 text-right">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 text-slate-700">
					{#if appointments.length === 0}
						<tr>
							<td colspan="8" class="p-8 text-center text-slate-400">
								No appointment requests match your current filters.
							</td>
						</tr>
					{/if}

					{#each appointments as appt}
						<tr class="hover:bg-slate-50/70 transition-colors">
							<!-- ID -->
							<td class="p-3.5">
								<span class="font-mono font-bold text-slate-900 block">{appt.id}</span>
								<span class="text-[10px] text-slate-400">
									{new Date(appt.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
								</span>
							</td>

							<!-- Patient -->
							<td class="p-3.5">
								<span class="font-semibold text-slate-900 block">{appt.patientName}</span>
								<span class="text-slate-500 text-[11px] block">{appt.patientPhone}</span>
								{#if appt.patientEmail}
									<span class="text-slate-400 text-[10px] block truncate max-w-[140px]">{appt.patientEmail}</span>
								{/if}
							</td>

							<!-- Doctor -->
							<td class="p-3.5">
								<span class="font-semibold text-slate-900 block">{appt.doctorName}</span>
								<span class="text-red-600 font-medium text-[11px]">{appt.doctorSpecialty}</span>
							</td>

							<!-- Slot -->
							<td class="p-3.5">
								<span class="font-semibold text-slate-900 block">{appt.appointmentDate}</span>
								<span class="text-slate-500 text-[11px] font-medium">{appt.appointmentTime}</span>
							</td>

							<!-- Booking Channel -->
							<td class="p-3.5">
								{#if appt.bookingSource === 'doctor_qr'}
									<div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold">
										<QrCode class="w-3 h-3 text-purple-600" />
										<span>Doctor QR</span>
									</div>
									<span class="block text-[10px] font-mono text-purple-600 mt-1 font-semibold">
										{appt.referralQrCode}
									</span>
								{:else}
									<div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
										<Globe class="w-3 h-3 text-slate-500" />
										<span>Direct Web</span>
									</div>
									<span class="block text-[10px] text-slate-400 mt-1">Website Organic</span>
								{/if}
							</td>

							<!-- Fee & Commission -->
							<td class="p-3.5">
								<span class="font-bold text-slate-900 block">₹{appt.consultationFee}</span>
								{#if appt.commissionAmount > 0}
									<span class="text-emerald-700 text-[11px] font-bold bg-emerald-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
										+₹{appt.commissionAmount} ({appt.commissionRate}%)
									</span>
									<span class="block text-[10px] text-emerald-600">to {appt.doctorName.split(' ')[1] || 'Doctor'}</span>
								{:else}
									<span class="text-slate-400 text-[10px] block mt-0.5">No Commission</span>
								{/if}
							</td>

							<!-- Status -->
							<td class="p-3.5">
								<Badge
									variant={appt.status === 'confirmed'
										? 'success'
										: appt.status === 'pending'
											? 'warning'
											: appt.status === 'completed'
												? 'info'
												: 'neutral'}
									text={appt.status.toUpperCase()}
								/>
								<span class="block text-[10px] mt-1 font-semibold {appt.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'}">
									{appt.paymentStatus === 'paid' ? '✓ Paid (Demo)' : 'Pay at Clinic'}
								</span>
							</td>

							<!-- Actions -->
							<td class="p-3.5 text-right space-x-1 whitespace-nowrap">
								<button
									type="button"
									onclick={() => openDetails(appt)}
									class="px-2 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium text-[11px] cursor-pointer inline-flex items-center gap-1"
									title="View Full Details"
								>
									<Eye class="w-3 h-3 text-slate-500" />
									View
								</button>

								{#if appt.status === 'pending'}
									<form method="POST" action="?/updateStatus" class="inline-block">
										<input type="hidden" name="appointmentId" value={appt.id} />
										<input type="hidden" name="status" value="confirmed" />
										<button
											type="submit"
											class="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700 shadow-2xs cursor-pointer inline-flex items-center gap-1"
										>
											<CheckCircle2 class="w-3 h-3" />
											Confirm
										</button>
									</form>
								{:else if appt.status === 'confirmed'}
									<form method="POST" action="?/updateStatus" class="inline-block">
										<input type="hidden" name="appointmentId" value={appt.id} />
										<input type="hidden" name="status" value="completed" />
										<button
											type="submit"
											class="px-2.5 py-1 rounded bg-slate-800 text-white font-semibold text-[11px] hover:bg-slate-900 cursor-pointer inline-flex items-center gap-1"
										>
											Complete
										</button>
									</form>
								{/if}

								{#if appt.status !== 'cancelled' && appt.status !== 'completed'}
									<form method="POST" action="?/updateStatus" class="inline-block">
										<input type="hidden" name="appointmentId" value={appt.id} />
										<input type="hidden" name="status" value="cancelled" />
										<button
											type="submit"
											class="px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 font-medium text-[11px] cursor-pointer inline-flex items-center gap-1"
											title="Cancel Appointment"
										>
											<XCircle class="w-3 h-3" />
											Cancel
										</button>
									</form>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- Appointment Details Modal -->
<Modal bind:open={detailsModalOpen} title="Appointment Request Details" size="md">
	{#if selectedAppointment}
		<div class="space-y-4 text-xs">
			<!-- Header banner with status and source -->
			<div class="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
				<div>
					<span class="text-slate-400 uppercase font-mono tracking-wider text-[10px]">Reference</span>
					<p class="font-mono font-bold text-slate-900 text-sm">{selectedAppointment.id}</p>
				</div>
				<div class="flex items-center gap-2">
					{#if selectedAppointment.bookingSource === 'doctor_qr'}
						<span class="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold text-[11px] flex items-center gap-1">
							<QrCode class="w-3 h-3" /> Doctor QR Scan
						</span>
					{:else}
						<span class="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1">
							<Globe class="w-3 h-3" /> Direct Website Booking
						</span>
					{/if}
					<Badge
						variant={selectedAppointment.status === 'confirmed' ? 'success' : selectedAppointment.status === 'pending' ? 'warning' : 'neutral'}
						text={selectedAppointment.status.toUpperCase()}
					/>
				</div>
			</div>

			<!-- Patient Information -->
			<div class="border border-slate-200 rounded-lg p-3 space-y-2">
				<h4 class="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
					<User class="w-3.5 h-3.5 text-red-600" /> Patient Information
				</h4>
				<div class="grid grid-cols-2 gap-2 text-slate-700">
					<div>
						<span class="text-slate-400 block text-[10px]">Full Name</span>
						<span class="font-semibold text-slate-900">{selectedAppointment.patientName}</span>
					</div>
					<div>
						<span class="text-slate-400 block text-[10px]">Contact Phone</span>
						<span class="font-semibold text-slate-900">{selectedAppointment.patientPhone}</span>
					</div>
					{#if selectedAppointment.patientEmail}
						<div class="col-span-2">
							<span class="text-slate-400 block text-[10px]">Email</span>
							<span>{selectedAppointment.patientEmail}</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Doctor and Schedule -->
			<div class="border border-slate-200 rounded-lg p-3 space-y-2">
				<h4 class="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
					<Clock class="w-3.5 h-3.5 text-red-600" /> Doctor & Consultation Schedule
				</h4>
				<div class="grid grid-cols-2 gap-2 text-slate-700">
					<div>
						<span class="text-slate-400 block text-[10px]">Specialist Doctor</span>
						<span class="font-semibold text-slate-900">{selectedAppointment.doctorName}</span>
						<span class="text-red-600 block text-[11px]">{selectedAppointment.doctorSpecialty}</span>
					</div>
					<div>
						<span class="text-slate-400 block text-[10px]">Date & Time</span>
						<span class="font-semibold text-slate-900">{selectedAppointment.appointmentDate}</span>
						<span class="text-slate-600 block text-[11px]">{selectedAppointment.appointmentTime}</span>
					</div>
				</div>
			</div>

			<!-- Patient Visit Reason -->
			<div class="border border-slate-200 rounded-lg p-3 space-y-1">
				<span class="text-slate-400 block text-[10px]">Visit Reason / Symptoms</span>
				<p class="text-slate-800 leading-relaxed font-medium bg-slate-50 p-2.5 rounded border border-slate-100">
					{selectedAppointment.reason}
				</p>
			</div>

			<!-- Referral & Financial Attribution -->
			<div class="bg-red-50/50 border border-red-100 rounded-lg p-3 space-y-2">
				<h4 class="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
					<IndianRupee class="w-3.5 h-3.5 text-red-600" /> Payment & Commission Accounting
				</h4>
				<div class="grid grid-cols-3 gap-2">
					<div>
						<span class="text-slate-500 block text-[10px]">Consultation Fee</span>
						<span class="font-bold text-slate-900 text-sm">₹{selectedAppointment.consultationFee}</span>
					</div>
					<div>
						<span class="text-slate-500 block text-[10px]">Doctor Commission</span>
						{#if selectedAppointment.commissionAmount > 0}
							<span class="font-bold text-emerald-700 text-sm">
								₹{selectedAppointment.commissionAmount} ({selectedAppointment.commissionRate}%)
							</span>
						{:else}
							<span class="text-slate-400 text-xs">₹0 (Direct)</span>
						{/if}
					</div>
					<div>
						<span class="text-slate-500 block text-[10px]">Payment Status</span>
						<span class="font-bold text-xs {selectedAppointment.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'}">
							{selectedAppointment.paymentStatus === 'paid' ? 'PAID (Demo)' : 'Pay at Clinic'}
						</span>
						{#if selectedAppointment.paymentId}
							<span class="font-mono text-[9px] text-slate-500 block truncate">{selectedAppointment.paymentId}</span>
						{/if}
					</div>
				</div>
			</div>

			<!-- Modal Footer -->
			<div class="pt-2 flex justify-end gap-2 border-t border-slate-100">
				<Button variant="outline" size="sm" onclick={() => (detailsModalOpen = false)}>
					Close
				</Button>
				{#if selectedAppointment.status === 'pending'}
					<form method="POST" action="?/updateStatus" onsubmit={() => (detailsModalOpen = false)}>
						<input type="hidden" name="appointmentId" value={selectedAppointment.id} />
						<input type="hidden" name="status" value="confirmed" />
						<Button variant="primary" size="sm">
							Approve Appointment
						</Button>
					</form>
				{/if}
			</div>
		</div>
	{/if}
</Modal>

