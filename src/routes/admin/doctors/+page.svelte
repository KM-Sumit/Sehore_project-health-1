<script lang="ts">
	import {
		Stethoscope,
		QrCode,
		Plus,
		Check,
		Copy,
		Printer,
		Download,
		RefreshCw,
		IndianRupee,
		Globe,
		ExternalLink,
		Sliders
	} from 'lucide-svelte';
	import Button from '$components/Button.svelte';
	import Modal from '$components/Modal.svelte';
	import Badge from '$components/Badge.svelte';
	import { addToast } from '$utils/toast';

	let { data } = $props();

	let doctors = $derived(data.doctors);
	let metrics = $derived(data.metrics);

	// Add Doctor Modal
	let addModalOpen = $state(false);
	let name = $state('');
	let specialty = $state('General Physician');
	let qualification = $state('MBBS, MD');
	let experienceYears = $state(8);
	let consultationFee = $state('500.00');
	let commissionRate = $state(15);

	// QR Code Standee Modal
	let qrModalOpen = $state(false);
	let selectedDoctor = $state<any>(null);
	let copiedLink = $state(false);

	function openQrModal(doc: any) {
		selectedDoctor = doc;
		copiedLink = false;
		qrModalOpen = true;
	}

	function copyLink(url: string) {
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			navigator.clipboard.writeText(url);
			copiedLink = true;
			addToast('Doctor booking link copied to clipboard!', 'success');
			setTimeout(() => {
				copiedLink = false;
			}, 3000);
		}
	}

	function printStandee() {
		if (typeof window !== 'undefined') {
			window.print();
		}
	}

	function downloadQrImage(dataUrl: string, doctorName: string) {
		if (typeof document === 'undefined') return;
		const a = document.createElement('a');
		a.href = dataUrl;
		a.download = `Bloodline_Pathology_QR_${doctorName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		addToast('QR Code image downloaded!', 'success');
	}
</script>

<svelte:head>
	<title>Doctor QR Codes & Commissions | Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h2 class="text-xl font-bold tracking-tight text-slate-900">
				Doctor Referral QR Codes & Commission Accounting
			</h2>
			<p class="text-xs text-slate-500 mt-1">
				Generate unique QR codes for each specialist, print clinic desk standees, and track direct vs referral appointment commissions.
			</p>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="outline" size="sm" href="/admin/appointments">
				View Appointments
			</Button>
			<Button variant="primary" size="sm" onclick={() => (addModalOpen = true)}>
				<Plus class="w-3.5 h-3.5 mr-1" />
				Add Specialist Doctor
			</Button>
		</div>
	</div>

	<!-- Top Stats Ribbon -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
			<span class="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Partner Doctors</span>
			<p class="text-2xl font-extrabold text-slate-900 mt-1">{doctors.length}</p>
			<span class="text-[11px] text-slate-400">All assigned unique QR codes</span>
		</div>

		<div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
			<span class="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total QR Bookings</span>
			<p class="text-2xl font-extrabold text-purple-700 mt-1">{metrics.qrAppointmentsCount}</p>
			<span class="text-[11px] text-purple-600 font-medium">Scanned via clinic QR standees</span>
		</div>

		<div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
			<span class="text-xs text-slate-500 font-semibold uppercase tracking-wider">Direct Portal Bookings</span>
			<p class="text-2xl font-extrabold text-slate-800 mt-1">{metrics.directAppointmentsCount}</p>
			<span class="text-[11px] text-slate-500">Booked without QR referral</span>
		</div>

		<div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
			<span class="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Commission Payable</span>
			<p class="text-2xl font-extrabold text-emerald-700 mt-1">₹{metrics.totalCommissionEarned.toLocaleString('en-IN')}</p>
			<span class="text-[11px] text-emerald-600 font-medium">Accrued to doctor partner accounts</span>
		</div>
	</div>

	<!-- Doctor Directory & QR Management Table -->
	<div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
		<div class="p-4 border-b border-slate-100 flex items-center justify-between">
			<div>
				<h3 class="text-sm font-bold text-slate-900">Doctor Directory & Referral Performance</h3>
				<p class="text-xs text-slate-500">Click "View / Print QR" to generate desk standees or share direct booking links</p>
			</div>
			<span class="text-xs text-slate-400 font-medium">{doctors.length} doctors listed</span>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs">
				<thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
					<tr>
						<th class="p-3.5">Doctor & Specialty</th>
						<th class="p-3.5">Consultation Fee</th>
						<th class="p-3.5">Assigned QR Code ID</th>
						<th class="p-3.5">QR Referrals</th>
						<th class="p-3.5">Direct Bookings</th>
						<th class="p-3.5">Commission Rate</th>
						<th class="p-3.5">Commission Earned</th>
						<th class="p-3.5 text-right">QR Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 text-slate-700">
					{#each doctors as doc}
						<tr class="hover:bg-slate-50/70 transition-colors">
							<!-- Doctor -->
							<td class="p-3.5">
								<span class="font-bold text-slate-900 block">{doc.name}</span>
								<span class="text-red-600 font-medium text-[11px] block">{doc.specialty}</span>
								<span class="text-slate-400 text-[10px] block">{doc.qualification} • {doc.experienceYears}y exp</span>
							</td>

							<!-- Fee -->
							<td class="p-3.5 font-bold text-slate-900">
								₹{doc.consultationFee}
							</td>

							<!-- Assigned QR Code -->
							<td class="p-3.5">
								<div class="flex items-center gap-1.5">
									<span class="font-mono text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold border border-slate-200">
										{doc.qrCode}
									</span>
									<button
										type="button"
										onclick={() => copyLink(doc.bookingUrl)}
										class="text-slate-400 hover:text-slate-700 p-1"
										title="Copy Booking Link"
									>
										<Copy class="w-3.5 h-3.5" />
									</button>
								</div>
								<span class="text-[10px] text-slate-400 block mt-0.5">Scannable link active</span>
							</td>

							<!-- QR Referrals Count -->
							<td class="p-3.5">
								<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[11px] border border-purple-200">
									<QrCode class="w-3 h-3 text-purple-600" />
									{doc.qrAppointments} bookings
								</span>
							</td>

							<!-- Direct Bookings Count -->
							<td class="p-3.5">
								<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
									<Globe class="w-3 h-3 text-slate-500" />
									{doc.directAppointments} bookings
								</span>
							</td>

							<!-- Commission Rate -->
							<td class="p-3.5">
								<form method="POST" action="?/updateCommission" class="flex items-center gap-1">
									<input type="hidden" name="doctorId" value={doc.id} />
									<input
										type="number"
										name="commissionRate"
										value={doc.commissionRate}
										min="0"
										max="100"
										step="0.5"
										class="w-14 px-1.5 py-0.5 text-xs rounded border border-slate-300 font-semibold text-center"
									/>
									<span class="text-slate-500 font-semibold">%</span>
									<button
										type="submit"
										class="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
										title="Save Commission Rate"
									>
										<Check class="w-3.5 h-3.5" />
									</button>
								</form>
							</td>

							<!-- Commission Earned -->
							<td class="p-3.5">
								<span class="font-extrabold text-emerald-700 text-xs block">
									₹{doc.totalCommission.toLocaleString('en-IN')}
								</span>
								<span class="text-[10px] text-slate-400 block">accrued</span>
							</td>

							<!-- QR Actions -->
							<td class="p-3.5 text-right space-x-1 whitespace-nowrap">
								<button
									type="button"
									onclick={() => openQrModal(doc)}
									class="px-2.5 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-[11px] shadow-2xs inline-flex items-center gap-1 cursor-pointer transition-colors"
								>
									<QrCode class="w-3.5 h-3.5" />
									View / Print QR
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- QR Code Standee & Download Modal -->
<Modal bind:open={qrModalOpen} title="Doctor Referral QR Code & Clinic Standee" size="md">
	{#if selectedDoctor}
		<div class="space-y-4">
			<!-- Printable Clinic Standee Preview Card -->
			<div
				id="printable-standee"
				class="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-md text-center max-w-sm mx-auto relative overflow-hidden"
			>
				<!-- Top Red Accent Bar -->
				<div class="bg-red-600 text-white py-1.5 px-4 -mx-6 -mt-6 mb-4 flex items-center justify-between">
					<div class="flex items-center gap-1.5 font-bold tracking-wider text-xs uppercase">
						<span class="w-4 h-4 rounded bg-white text-red-600 flex items-center justify-center font-bold text-[10px]">+</span>
						<span>Bloodline Pathology</span>
					</div>
					<span class="text-[10px] tracking-widest uppercase font-mono">Clinic Desk QR</span>
				</div>

				<!-- Doctor Details -->
				<div class="mb-3">
					<span class="inline-block px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider mb-1">
						Official Partner Specialist
					</span>
					<h3 class="text-base font-extrabold text-slate-900">{selectedDoctor.name}</h3>
					<p class="text-xs text-red-600 font-semibold">{selectedDoctor.specialty}</p>
					<p class="text-[10px] text-slate-400">{selectedDoctor.qualification}</p>
				</div>

				<!-- Large Scannable QR Code Image -->
				<div class="bg-white p-3 rounded-xl border border-slate-200 inline-block shadow-inner mb-3">
					<img
						src={selectedDoctor.qrDataUrl}
						alt="QR Code for {selectedDoctor.name}"
						class="w-48 h-48 mx-auto"
					/>
				</div>

				<!-- Instructions -->
				<div class="space-y-1">
					<p class="text-xs font-bold text-slate-900">
						Scan with any Phone Camera to Book Appointment
					</p>
					<p class="text-[10px] text-slate-500 leading-tight">
						Select your preferred consultation time slot directly from your mobile.
					</p>
				</div>

				<!-- Referral Footer Tag -->
				<div class="mt-4 pt-3 border-t border-dashed border-slate-200 flex items-center justify-between text-[10px]">
					<div class="text-left">
						<span class="text-slate-400 block text-[9px]">Referral ID</span>
						<span class="font-mono font-bold text-slate-800">{selectedDoctor.qrCode}</span>
					</div>
					<div class="text-right">
						<span class="text-slate-400 block text-[9px]">Helpline</span>
						<span class="font-bold text-slate-800">1800-123-BLOOD</span>
					</div>
				</div>
			</div>

			<!-- Management Controls & Share Options -->
			<div class="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-xs">
				<!-- Booking URL Box -->
				<div>
					<label for="direct-booking-url" class="block font-semibold text-slate-700 mb-1">Direct Patient Booking Link</label>
					<div class="flex items-center gap-1.5">
						<input
							id="direct-booking-url"
							type="text"
							readonly
							value={selectedDoctor.bookingUrl}
							class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono text-slate-700"
						/>
						<button
							type="button"
							onclick={() => copyLink(selectedDoctor.bookingUrl)}
							class="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 shrink-0 flex items-center gap-1 cursor-pointer"
						>
							{#if copiedLink}
								<Check class="w-3.5 h-3.5 text-emerald-400" />
								Copied
							{:else}
								<Copy class="w-3.5 h-3.5" />
								Copy
							{/if}
						</button>
					</div>
				</div>

				<!-- Stats summary -->
				<div class="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-200">
					<div class="bg-white p-2 rounded-lg border border-slate-200">
						<span class="text-[10px] text-slate-400 block">QR Bookings</span>
						<span class="text-sm font-bold text-purple-700">{selectedDoctor.qrAppointments}</span>
					</div>
					<div class="bg-white p-2 rounded-lg border border-slate-200">
						<span class="text-[10px] text-slate-400 block">Direct Bookings</span>
						<span class="text-sm font-bold text-slate-700">{selectedDoctor.directAppointments}</span>
					</div>
					<div class="bg-white p-2 rounded-lg border border-slate-200">
						<span class="text-[10px] text-slate-400 block">Commission Earned</span>
						<span class="text-sm font-bold text-emerald-700">₹{selectedDoctor.totalCommission}</span>
					</div>
				</div>

				<!-- Actions: Download & Print & Regenerate -->
				<div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
					<div class="flex items-center gap-2">
						<button
							type="button"
							onclick={() => downloadQrImage(selectedDoctor.qrDataUrl, selectedDoctor.name)}
							class="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-semibold inline-flex items-center gap-1.5 cursor-pointer text-xs"
						>
							<Download class="w-3.5 h-3.5 text-slate-500" />
							Download PNG
						</button>

						<button
							type="button"
							onclick={printStandee}
							class="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-semibold inline-flex items-center gap-1.5 cursor-pointer text-xs"
						>
							<Printer class="w-3.5 h-3.5 text-slate-500" />
							Print Desk Standee
						</button>
					</div>

					<!-- Regenerate QR Code Form -->
					<form method="POST" action="?/generateQr">
						<input type="hidden" name="doctorId" value={selectedDoctor.id} />
						<button
							type="submit"
							class="px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 font-medium inline-flex items-center gap-1 cursor-pointer text-xs"
							title="Generate a brand new unique QR code identifier"
						>
							<RefreshCw class="w-3.5 h-3.5 text-amber-600" />
							Regenerate Code
						</button>
					</form>
				</div>
			</div>
		</div>
	{/if}
</Modal>

<!-- Add Specialist Doctor Modal -->
<Modal bind:open={addModalOpen} title="Register New Specialist Doctor" size="md">
	<form method="POST" action="?/addDoctor" class="space-y-3.5 text-xs">
		<div>
			<label for="doc-name" class="block font-semibold text-slate-700 mb-1">Doctor Full Name</label>
			<input
				id="doc-name"
				name="name"
				type="text"
				required
				bind:value={name}
				placeholder="Dr. Anand Deshmukh"
				class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-red-500"
			/>
		</div>

		<div class="grid grid-cols-2 gap-3">
			<div>
				<label for="doc-specialty" class="block font-semibold text-slate-700 mb-1">Medical Specialty</label>
				<input
					id="doc-specialty"
					name="specialty"
					type="text"
					required
					bind:value={specialty}
					placeholder="Gastroenterology"
					class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-red-500"
				/>
			</div>
			<div>
				<label for="doc-qual" class="block font-semibold text-slate-700 mb-1">Qualifications</label>
				<input
					id="doc-qual"
					name="qualification"
					type="text"
					required
					bind:value={qualification}
					placeholder="MBBS, MD, DM"
					class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-red-500"
				/>
			</div>
		</div>

		<div class="grid grid-cols-3 gap-3">
			<div>
				<label for="doc-exp" class="block font-semibold text-slate-700 mb-1">Experience (Years)</label>
				<input
					id="doc-exp"
					name="experienceYears"
					type="number"
					min="1"
					max="60"
					required
					bind:value={experienceYears}
					class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-red-500"
				/>
			</div>
			<div>
				<label for="doc-fee" class="block font-semibold text-slate-700 mb-1">Consultation Fee (₹)</label>
				<input
					id="doc-fee"
					name="consultationFee"
					type="number"
					min="100"
					step="50"
					required
					bind:value={consultationFee}
					class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-red-500"
				/>
			</div>
			<div>
				<label for="doc-comm" class="block font-semibold text-slate-700 mb-1">QR Commission (%)</label>
				<input
					id="doc-comm"
					name="commissionRate"
					type="number"
					min="0"
					max="50"
					step="1"
					required
					bind:value={commissionRate}
					class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-red-500"
				/>
			</div>
		</div>

		<div class="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-600 text-[11px]">
			<p class="font-semibold text-slate-800 mb-0.5">Automatic Unique QR Code Assignment</p>
			A unique QR referral code and direct clinic standee link will be generated automatically upon registration.
		</div>

		<div class="pt-2 flex justify-end gap-2 border-t border-slate-100">
			<Button variant="outline" size="sm" onclick={() => (addModalOpen = false)}>Cancel</Button>
			<Button variant="primary" size="sm">Register & Generate QR</Button>
		</div>
	</form>
</Modal>
