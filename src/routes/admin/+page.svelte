<script lang="ts">
	import {
		CalendarCheck,
		QrCode,
		IndianRupee,
		Clock,
		ArrowRight,
		CheckCircle2,
		XCircle,
		ExternalLink,
		Stethoscope,
		Globe,
		Filter
	} from 'lucide-svelte';
	import Button from '$components/Button.svelte';
	import Badge from '$components/Badge.svelte';

	let { data } = $props();

	let metrics = $derived(data.metrics);
	let recentAppointments = $derived(data.recentAppointments);
	let doctors = $derived(data.doctors);
</script>

<svelte:head>
	<title>Admin Overview | Bloodline Pathology</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h2 class="text-xl font-bold tracking-tight text-slate-900">
				Platform & Doctor Commission Overview
			</h2>
			<p class="text-xs text-slate-500 mt-1">
				Live tracking for patient appointment requests, doctor QR code referrals, direct website bookings, and commission payouts.
			</p>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="outline" size="sm" href="/admin/appointments">
				<CalendarCheck class="w-3.5 h-3.5 mr-1" />
				All Appointment Requests
			</Button>
			<Button variant="primary" size="sm" href="/admin/doctors">
				<QrCode class="w-3.5 h-3.5 mr-1" />
				Doctor QR Codes
			</Button>
		</div>
	</div>

	<!-- 4 Key Metrics Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- Total Appointments -->
		<div class="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
			<div class="flex items-center justify-between text-slate-500">
				<span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Consultations</span>
				<div class="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
					<CalendarCheck class="w-4 h-4" />
				</div>
			</div>
			<p class="text-3xl font-extrabold text-slate-900 mt-2">{metrics.totalAppointments}</p>
			<div class="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
				<span class="font-medium text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
					{metrics.qrAppointmentsCount} via QR
				</span>
				<span>•</span>
				<span class="font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
					{metrics.directAppointmentsCount} Direct
				</span>
			</div>
		</div>

		<!-- QR Referral Bookings -->
		<div class="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
			<div class="flex items-center justify-between text-slate-500">
				<span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Doctor QR Referrals</span>
				<div class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
					<QrCode class="w-4 h-4" />
				</div>
			</div>
			<p class="text-3xl font-extrabold text-slate-900 mt-2">{metrics.qrAppointmentsCount}</p>
			<p class="text-[11px] text-purple-700 font-medium mt-2 flex items-center gap-1">
				<span>{metrics.qrSharePercentage}%</span> of total bookings generated via doctor QR codes
			</p>
		</div>

		<!-- Doctor Commissions Earned -->
		<div class="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
			<div class="flex items-center justify-between text-slate-500">
				<span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Doctor Commissions</span>
				<div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
					<IndianRupee class="w-4 h-4" />
				</div>
			</div>
			<p class="text-3xl font-extrabold text-slate-900 mt-2">₹{metrics.totalCommissionEarned.toLocaleString('en-IN')}</p>
			<p class="text-[11px] text-slate-500 mt-2">
				Calculated on completed & confirmed QR bookings
			</p>
		</div>

		<!-- Pending Actions -->
		<div class="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
			<div class="flex items-center justify-between text-slate-500">
				<span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Requests</span>
				<div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
					<Clock class="w-4 h-4" />
				</div>
			</div>
			<p class="text-3xl font-extrabold text-amber-600 mt-2">{metrics.pendingAppointmentsCount}</p>
			<p class="text-[11px] text-slate-500 mt-2">
				Awaiting clinic confirmation or slot assignment
			</p>
		</div>
	</div>

	<!-- Source Breakdown Card -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<!-- QR vs Direct Comparison -->
		<div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
			<h3 class="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
				<QrCode class="w-4 h-4 text-red-600" />
				Booking Source Distribution
			</h3>
			<p class="text-xs text-slate-500 mb-4">
				Comparison between patient self-bookings via web portal versus in-clinic scans of Doctor QR codes.
			</p>

			<div class="space-y-3">
				<div>
					<div class="flex justify-between text-xs font-semibold mb-1">
						<span class="flex items-center gap-1.5 text-purple-700">
							<QrCode class="w-3.5 h-3.5" /> Doctor QR Referrals
						</span>
						<span>{metrics.qrAppointmentsCount} ({metrics.qrSharePercentage}%)</span>
					</div>
					<div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
						<div class="bg-purple-600 h-full rounded-full transition-all" style="width: {metrics.qrSharePercentage}%"></div>
					</div>
					<span class="text-[11px] text-slate-400 mt-0.5 block">Doctor earns designated commission per booking</span>
				</div>

				<div>
					<div class="flex justify-between text-xs font-semibold mb-1">
						<span class="flex items-center gap-1.5 text-slate-700">
							<Globe class="w-3.5 h-3.5" /> Direct Website Bookings
						</span>
						<span>{metrics.directAppointmentsCount} ({100 - metrics.qrSharePercentage}%)</span>
					</div>
					<div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
						<div class="bg-slate-700 h-full rounded-full transition-all" style="width: {100 - metrics.qrSharePercentage}%"></div>
					</div>
					<span class="text-[11px] text-slate-400 mt-0.5 block">Direct portal booking (no doctor commission)</span>
				</div>
			</div>
		</div>

		<!-- Quick QR Standee Helper -->
		<div class="bg-gradient-to-br from-red-50/60 to-white rounded-xl border border-red-100 p-5 shadow-xs flex flex-col justify-between">
			<div>
				<div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-semibold mb-2">
					<QrCode class="w-3 h-3" /> Doctor Referral Program
				</div>
				<h3 class="text-sm font-bold text-slate-900">How Doctor QR Tracking Works</h3>
				<p class="text-xs text-slate-600 mt-1.5 leading-relaxed">
					Each specialist doctor in Bloodline Pathology has a unique referral QR code generated by Admin. Doctors place this printed standee at their clinic desk. When visiting patients scan it, their appointment is automatically attributed to that doctor, triggering the commission credit.
				</p>
			</div>

			<div class="pt-4 border-t border-red-100/80 flex items-center justify-between">
				<span class="text-xs text-slate-500 font-medium">6 Doctors Registered</span>
				<Button variant="primary" size="sm" href="/admin/doctors">
					Manage Doctor QRs
					<ArrowRight class="w-3.5 h-3.5 ml-1" />
				</Button>
			</div>
		</div>
	</div>

	<!-- Recent Appointment Requests Table -->
	<div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
		<div class="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
			<div>
				<h3 class="text-sm font-bold text-slate-900">Recent Patient Appointment Requests</h3>
				<p class="text-xs text-slate-500">Live feed of consultation requests received with referral attribution</p>
			</div>
			<Button variant="outline" size="sm" href="/admin/appointments">
				View All Requests ({metrics.totalAppointments})
				<ArrowRight class="w-3.5 h-3.5 ml-1" />
			</Button>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs">
				<thead class="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
					<tr>
						<th class="p-3">ID & Date</th>
						<th class="p-3">Patient</th>
						<th class="p-3">Doctor Requested</th>
						<th class="p-3">Schedule</th>
						<th class="p-3">Booking Source</th>
						<th class="p-3">Fee & Commission</th>
						<th class="p-3">Status</th>
						<th class="p-3 text-right">Quick Action</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 text-slate-700">
					{#each recentAppointments as appt}
						<tr class="hover:bg-slate-50/60 transition-colors">
							<!-- ID & Date -->
							<td class="p-3">
								<span class="font-mono font-semibold text-slate-900 block">{appt.id}</span>
								<span class="text-[11px] text-slate-400">
									{new Date(appt.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
								</span>
							</td>

							<!-- Patient -->
							<td class="p-3">
								<span class="font-semibold text-slate-900 block">{appt.patientName}</span>
								<span class="text-slate-500 text-[11px]">{appt.patientPhone}</span>
							</td>

							<!-- Doctor -->
							<td class="p-3">
								<span class="font-semibold text-slate-900 block">{appt.doctorName}</span>
								<span class="text-red-600 font-medium text-[11px]">{appt.doctorSpecialty}</span>
							</td>

							<!-- Schedule -->
							<td class="p-3">
								<span class="font-medium text-slate-800 block">{appt.appointmentDate}</span>
								<span class="text-slate-500 text-[11px]">{appt.appointmentTime}</span>
							</td>

							<!-- Booking Source -->
							<td class="p-3">
								{#if appt.bookingSource === 'doctor_qr'}
									<div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-semibold">
										<QrCode class="w-3 h-3 text-purple-600" />
										<span>Doctor QR</span>
									</div>
									<span class="block text-[10px] font-mono text-purple-600 mt-0.5">{appt.referralQrCode}</span>
								{:else}
									<div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
										<Globe class="w-3 h-3 text-slate-500" />
										<span>Direct Web</span>
									</div>
									<span class="block text-[10px] text-slate-400 mt-0.5">Organic</span>
								{/if}
							</td>

							<!-- Fee & Commission -->
							<td class="p-3">
								<span class="font-semibold text-slate-900 block">₹{appt.consultationFee}</span>
								{#if appt.commissionAmount > 0}
									<span class="text-emerald-700 text-[11px] font-semibold bg-emerald-50 px-1.5 py-0.2 rounded inline-block">
										₹{appt.commissionAmount} ({appt.commissionRate}%)
									</span>
								{:else}
									<span class="text-slate-400 text-[10px]">—</span>
								{/if}
							</td>

							<!-- Status -->
							<td class="p-3">
								<Badge
									variant={appt.status === 'confirmed' ? 'success' : appt.status === 'pending' ? 'warning' : appt.status === 'completed' ? 'info' : 'neutral'}
									text={appt.status.toUpperCase()}
								/>
							</td>

							<!-- Quick Action -->
							<td class="p-3 text-right">
								{#if appt.status === 'pending'}
									<form method="POST" action="?/updateAppointmentStatus" class="inline-flex items-center gap-1">
										<input type="hidden" name="appointmentId" value={appt.id} />
										<input type="hidden" name="status" value="confirmed" />
										<button
											type="submit"
											class="px-2.5 py-1 rounded bg-emerald-600 text-white font-medium text-[11px] hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
										>
											<CheckCircle2 class="w-3 h-3" />
											Approve
										</button>
									</form>
								{:else if appt.status === 'confirmed'}
									<form method="POST" action="?/updateAppointmentStatus" class="inline-flex items-center gap-1">
										<input type="hidden" name="appointmentId" value={appt.id} />
										<input type="hidden" name="status" value="completed" />
										<button
											type="submit"
											class="px-2.5 py-1 rounded bg-slate-800 text-white font-medium text-[11px] hover:bg-slate-900 transition-colors cursor-pointer"
										>
											Mark Done
										</button>
									</form>
								{:else}
									<span class="text-slate-400 text-[11px]">No action needed</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Doctor Commission Leaderboard Card -->
	<div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
		<div class="p-4 border-b border-slate-100 flex items-center justify-between">
			<div>
				<h3 class="text-sm font-bold text-slate-900">Doctor QR Codes & Referral Performance</h3>
				<p class="text-xs text-slate-500">Track which doctor QR codes are driving appointments and their earned commission</p>
			</div>
			<Button variant="outline" size="sm" href="/admin/doctors">
				Full Directory & QR Cards
				<ArrowRight class="w-3.5 h-3.5 ml-1" />
			</Button>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs">
				<thead class="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
					<tr>
						<th class="p-3">Doctor</th>
						<th class="p-3">Specialty</th>
						<th class="p-3">Unique QR Code ID</th>
						<th class="p-3">QR Bookings</th>
						<th class="p-3">Direct Bookings</th>
						<th class="p-3">Commission Rate</th>
						<th class="p-3">Commission Earned</th>
						<th class="p-3 text-right">QR Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 text-slate-700">
					{#each doctors as doc}
						<tr class="hover:bg-slate-50/60 transition-colors">
							<td class="p-3 font-semibold text-slate-900">{doc.name}</td>
							<td class="p-3 text-red-600 font-medium">{doc.specialty}</td>
							<td class="p-3">
								<span class="font-mono text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-semibold border border-slate-200">
									{doc.qrCode}
								</span>
							</td>
							<td class="p-3">
								<span class="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
									{doc.qrAppointments} bookings
								</span>
							</td>
							<td class="p-3">
								<span class="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
									{doc.directAppointments} bookings
								</span>
							</td>
							<td class="p-3 font-semibold">{doc.commissionRate}%</td>
							<td class="p-3 font-bold text-emerald-700">
								₹{doc.totalCommission.toLocaleString('en-IN')}
							</td>
							<td class="p-3 text-right">
								<a
									href="/admin/doctors"
									class="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold text-xs"
								>
									<QrCode class="w-3.5 h-3.5" />
									View / Print QR
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
