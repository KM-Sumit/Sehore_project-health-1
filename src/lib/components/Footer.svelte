<script lang="ts">
	import {
		Activity,
		Mail,
		Phone,
		MapPin,
		ShieldCheck,
		Clock,
		FileCheck,
	} from "lucide-svelte";
</script>

<footer class="bg-white border-t border-slate-200 mt-16 text-slate-600">
	<div class="container mx-auto px-4 max-w-7xl py-12">
		<div class="grid grid-cols-1 md:grid-cols-4 gap-8">
			<!-- Brand -->
			<div class="space-y-3">
				<a
					href="/"
					class="flex items-center gap-2 text-slate-900 font-bold text-lg"
				>
					<div
						class="w-7 h-7 rounded bg-red-600 flex items-center justify-center text-white text-xs font-bold"
					>
						+
					</div>
					<span
						>Bloodline <span class="text-red-600">Pathology</span
						></span
					>
				</a>
				<p class="text-slate-500 text-xs leading-relaxed">
					Specialized diagnostic laboratory providing blood tests,
					sugar screening, liver profile, TB tests, thyroid
					evaluations, and specialist medical consultations.
				</p>
				<p class="text-xs text-slate-400">
					Reg. License No: MP-LAB-2024-5821
				</p>
			</div>

			<!-- Diagnostic Tests -->
			<div>
				<h4 class="font-semibold text-slate-900 text-sm mb-3">
					Popular Diagnostic Tests
				</h4>
				<ul class="space-y-2 text-xs">
					<li>
						<a
							href="/book-test"
							class="text-slate-600 hover:text-red-600 transition-colors"
							>Blood Sugar (Fasting & PP)</a
						>
					</li>
					<li>
						<a
							href="/book-test"
							class="text-slate-600 hover:text-red-600 transition-colors"
							>Jaundice / Liver Function Test (LFT)</a
						>
					</li>
					<li>
						<a
							href="/book-test"
							class="text-slate-600 hover:text-red-600 transition-colors"
							>Tuberculosis (TB Gold IGRA)</a
						>
					</li>
					<li>
						<a
							href="/book-test"
							class="text-slate-600 hover:text-red-600 transition-colors"
							>Complete Blood Count (CBC)</a
						>
					</li>
					<li>
						<a
							href="/book-test"
							class="text-slate-600 hover:text-red-600 transition-colors"
							>Thyroid Profile (T3, T4, TSH)</a
						>
					</li>
					<li>
						<a
							href="/book-test"
							class="text-slate-600 hover:text-red-600 transition-colors"
							>Lipid & Heart Profile</a
						>
					</li>
				</ul>
			</div>

			<!-- Clinical Services -->
			<div>
				<h4 class="font-semibold text-slate-900 text-sm mb-3">
					Services & Portals
				</h4>
				<ul class="space-y-2 text-xs">
					<li>
						<a
							href="/book-test"
							class="text-slate-600 hover:text-red-600 transition-colors"
							>Home Blood Sample Collection</a
						>
					</li>
					<li>
						<a
							href="/book-appointment"
							class="text-slate-600 hover:text-red-600 transition-colors"
							>Doctor Consultations</a
						>
					</li>
					<li>
						<a
							href="/dashboard"
							class="text-slate-600 hover:text-red-600 transition-colors"
							>Download Test Reports (PDF)</a
						>
					</li>
					<li>
						<a
							href="/login"
							class="text-slate-600 hover:text-red-600 transition-colors"
							>Patient Account Login</a
						>
					</li>
					<li>
						<a
							href="/admin"
							class="text-slate-600 hover:text-red-600 transition-colors"
							>Laboratory Staff Portal</a
						>
					</li>
				</ul>
			</div>

			<!-- Contact Details -->
			<div>
				<h4 class="font-semibold text-slate-900 text-sm mb-3">
					Contact Pathology Lab
				</h4>
				<ul class="space-y-2.5 text-xs">
					<li class="flex items-center gap-2">
						<Phone class="w-4 h-4 text-red-600 shrink-0" />
						<span class="font-medium text-slate-900"
							>+91 98765 43210 / 1800-123-BLOOD</span
						>
					</li>
					<li class="flex items-center gap-2">
						<Mail class="w-4 h-4 text-red-600 shrink-0" />
						<span>support@bloodlinepathology.in</span>
					</li>
					<li class="flex items-start gap-2">
						<MapPin class="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
						<span
							>Main Diagnostic Hub: Civil Lines Road, Near
							District Hospital, Sehore / Bhopal, MP</span
						>
					</li>
				</ul>
			</div>
		</div>

		<div
			class="border-t border-slate-200 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3"
		>
			<p>
				&copy; {new Date().getFullYear()} Bloodline Pathology Diagnostic
				Laboratories. All rights reserved.
			</p>
			<p class="text-[11px]">
				Reports are intended strictly for clinical evaluation by a
				qualified medical practitioner.
			</p>
		</div>
	</div>
</footer>
