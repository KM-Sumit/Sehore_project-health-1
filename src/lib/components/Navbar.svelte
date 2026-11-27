<script lang="ts">
	import {
		Plus,
		Menu,
		X,
		ChevronDown,
		User,
		LayoutDashboard,
		LogOut,
		Phone,
		Zap,
		CheckCircle2
	} from 'lucide-svelte';
	import Modal from './Modal.svelte';
	import Button from './Button.svelte';

	interface Props {
		user: App.Locals['user'];
	}

	let { user }: Props = $props();

	let mobileOpen = $state(false);
	let profileOpen = $state(false);

	let expressOpen = $state(false);
	let expressSubmitting = $state(false);
	let expressError = $state('');
	let expressSuccess = $state<{ reference: string; message: string } | null>(null);

	function todayIso(): string {
		const now = new Date();
		const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
		return local.toISOString().split('T')[0];
	}

	function emptyExpressForm() {
		return {
			name: '',
			phone: '',
			gender: '',
			age: '',
			serviceType: 'lab_test',
			serviceName: '',
			preferredDate: todayIso(),
			preferredSlot: '8AM-10AM',
			notes: ''
		};
	}

	let expressForm = $state(emptyExpressForm());

	const navLinks = $derived([
		{ href: '/', label: 'Home' },
		{ href: '/book-test', label: 'Lab Tests & Packages' },
		{ href: '/book-appointment', label: 'Doctor Consultations' },
		...(user ? [{ href: '/dashboard', label: 'My Reports & Bookings' }] : []),
		...(user?.role === 'admin' ? [{ href: '/admin', label: 'Admin Console' }] : [])
	]);

	const fieldClass =
		'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors';

	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	function openExpress() {
		expressError = '';
		expressSuccess = null;
		if (user?.name && !expressForm.name) {
			expressForm.name = user.name;
		}
		expressOpen = true;
	}

	function closeExpress() {
		expressError = '';
		expressSuccess = null;
	}

	async function submitExpress(event: SubmitEvent) {
		event.preventDefault();
		expressError = '';

		const phone = expressForm.phone.replace(/\D/g, '');
		if (!/^[6-9]\d{9}$/.test(phone)) {
			expressError = 'Please enter a valid 10-digit mobile number.';
			return;
		}

		expressSubmitting = true;
		try {
			const response = await fetch('/api/express-booking', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...expressForm,
					phone,
					age: expressForm.age === '' ? undefined : Number(expressForm.age)
				})
			});

			const result = (await response.json()) as {
				success?: boolean;
				reference?: string;
				message?: string;
				error?: string;
			};

			if (!response.ok || !result.success || !result.reference) {
				throw new Error(result.error || 'Could not submit your booking. Please try again.');
			}

			expressSuccess = {
				reference: result.reference,
				message: result.message || 'Our care team will call you shortly.'
			};
			expressForm = emptyExpressForm();
		} catch (err) {
			expressError =
				err instanceof Error ? err.message : 'Something went wrong. Please try again.';
		} finally {
			expressSubmitting = false;
		}
	}
</script>

<svelte:window onclick={() => (profileOpen = false)} />

<!-- Top Information Ribbon -->
<div class="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
	<div class="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
		<div class="flex items-center gap-2">
			<span class="text-red-400 font-semibold">Bloodline Pathology</span>
			<span class="text-slate-600">•</span>
			<span class="text-slate-400">Diagnostic Center & Clinical Pathology</span>
		</div>
		<div class="flex items-center gap-4 text-slate-300">
			<a href="tel:+919876543210" class="hover:text-white flex items-center gap-1 transition-colors">
				<Phone class="w-3 h-3 text-red-400" />
				<span class="font-medium">Helpline: +91 98765 43210</span>
			</a>
			<span class="text-slate-600">|</span>
			<span class="text-slate-400">Timings: 7:00 AM – 9:00 PM</span>
		</div>
	</div>
</div>

<nav class="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-2.5">
				<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 shadow-xs">
					<Plus class="h-6 w-6 text-white stroke-[3]" />
				</div>
				<div class="flex flex-col">
					<span class="text-xl font-bold tracking-tight text-slate-900">
						Bloodline <span class="text-red-600">Pathology</span>
					</span>
					<span class="text-[10px] uppercase tracking-wider text-slate-500 font-medium -mt-1">
						Diagnostic & Clinical Labs
					</span>
				</div>
			</a>

			<!-- Desktop Nav -->
			<div class="hidden md:flex items-center gap-1">
				{#each navLinks as link}
					<a
						href={link.href}
						class="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-red-600 rounded-lg hover:bg-red-50/50 transition-colors"
					>
						{link.label}
					</a>
					{#if link.href === '/book-appointment'}
						<button
							type="button"
							onclick={openExpress}
							class="mx-1 inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-xs transition-colors cursor-pointer"
						>
							<Zap class="h-3.5 w-3.5 fill-current" />
							Express Booking
						</button>
					{/if}
				{/each}
			</div>

			<!-- Right Side -->
			<div class="hidden md:flex items-center gap-3">
				{#if user}
					<!-- User Dropdown -->
					<div class="relative">
						<button
							onclick={(e: MouseEvent) => {
								e.stopPropagation();
								profileOpen = !profileOpen;
							}}
							class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer border border-slate-200"
						>
							<div
								class="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-bold"
							>
								{getInitials(user.name)}
							</div>
							<span class="font-medium text-slate-900">{user.name}</span>
							<ChevronDown class="h-4 w-4 text-slate-400" />
						</button>
						{#if profileOpen}
							<div
								class="absolute right-0 mt-1.5 w-52 rounded-xl bg-white border border-slate-200 shadow-lg py-1 z-50 divide-y divide-slate-100"
							>
								<div class="px-4 py-2.5">
									<p class="text-xs font-semibold text-slate-900">{user.name}</p>
									<p class="text-[11px] text-slate-500 truncate">{user.email}</p>
								</div>
								<div class="py-1">
									<a
										href="/dashboard"
										class="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-red-600"
									>
										<LayoutDashboard class="h-3.5 w-3.5" />
										Reports & Dashboard
									</a>
									<a
										href="/profile"
										class="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-red-600"
									>
										<User class="h-3.5 w-3.5" />
										Profile Settings
									</a>
								</div>
								<div class="py-1">
									<form method="POST" action="/api/auth/logout">
										<button
											type="submit"
											class="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer"
										>
											<LogOut class="h-3.5 w-3.5" />
											Logout
										</button>
									</form>
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<a
						href="/login"
						class="px-4 py-2 text-sm font-medium text-slate-700 hover:text-red-600 transition-colors"
					>
						Sign In
					</a>
					<a
						href="/book-test"
						class="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
					>
						<span>Book Home Sample</span>
					</a>
				{/if}
			</div>

			<!-- Mobile Menu Button -->
			<button
				class="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
				onclick={() => (mobileOpen = !mobileOpen)}
				aria-label="Toggle menu"
			>
				{#if mobileOpen}
					<X class="h-6 w-6" />
				{:else}
					<Menu class="h-6 w-6" />
				{/if}
			</button>
		</div>
	</div>

	<!-- Mobile Menu -->
	{#if mobileOpen}
		<div class="md:hidden border-t border-slate-200 bg-white">
			<div class="px-4 py-3 space-y-1">
				{#each navLinks as link}
					<a
						href={link.href}
						class="block px-3 py-2 text-sm font-medium text-slate-700 hover:text-red-600 rounded-lg hover:bg-red-50/50"
						onclick={() => (mobileOpen = false)}
					>
						{link.label}
					</a>
					{#if link.href === '/book-appointment'}
						<button
							type="button"
							onclick={() => {
								mobileOpen = false;
								openExpress();
							}}
							class="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 cursor-pointer"
						>
							<Zap class="h-4 w-4 fill-current" />
							Express Booking
						</button>
					{/if}
				{/each}
			</div>
			<div class="border-t border-slate-200 px-4 py-3">
				{#if user}
					<div class="flex items-center gap-3 px-3 py-2">
						<div
							class="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-700 font-bold text-sm"
						>
							{getInitials(user.name)}
						</div>
						<div>
							<p class="text-sm font-medium text-slate-900">{user.name}</p>
							<p class="text-xs text-slate-500">{user.email}</p>
						</div>
					</div>
					<div class="mt-2 space-y-1">
						<a
							href="/dashboard"
							class="block px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg"
							onclick={() => (mobileOpen = false)}
						>
							Reports & Dashboard
						</a>
						<a
							href="/profile"
							class="block px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg"
							onclick={() => (mobileOpen = false)}
						>
							Profile
						</a>
						<form method="POST" action="/api/auth/logout">
							<button
								type="submit"
								class="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
							>
								Logout
							</button>
						</form>
					</div>
				{:else}
					<div class="flex gap-2">
						<a
							href="/login"
							class="flex-1 text-center px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
							onclick={() => (mobileOpen = false)}
						>
							Sign In
						</a>
						<a
							href="/book-test"
							class="flex-1 text-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
							onclick={() => (mobileOpen = false)}
						>
							Book Sample
						</a>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</nav>

<!-- Express Booking Modal -->
<Modal bind:open={expressOpen} onclose={closeExpress} title="Express Booking" size="md">
	{#if expressSuccess}
		<div class="text-center py-3">
			<div
				class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
			>
				<CheckCircle2 class="h-8 w-8" />
			</div>
			<h3 class="mt-4 text-lg font-bold text-slate-900">Express Booking Confirmed!</h3>
			<p class="mt-1 text-xs leading-relaxed text-slate-500">{expressSuccess.message}</p>
			<div
				class="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2"
			>
				<span class="text-[11px] text-slate-500">Booking Reference</span>
				<span class="font-mono text-sm font-bold text-slate-900">{expressSuccess.reference}</span>
			</div>
			<div class="mt-6 flex gap-2">
				<Button
					variant="outline"
					fullWidth
					onclick={() => {
						expressOpen = false;
						closeExpress();
					}}
				>
					Close
				</Button>
				<Button variant="primary" fullWidth onclick={() => (expressSuccess = null)}>
					Book Another
				</Button>
			</div>
		</div>
	{:else}
		<form onsubmit={submitExpress} class="space-y-3.5">
			<p class="-mt-1 text-xs leading-relaxed text-slate-500">
				Quick booking for home sample collection, X-ray/radiology, or a doctor consultation. Our
				care team will call you to confirm the details.
			</p>

			{#if expressError}
				<div class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
					{expressError}
				</div>
			{/if}

			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div>
					<label for="express-name" class="mb-1 block text-xs font-medium text-slate-700">
						Full Name <span class="text-slate-400">(optional)</span>
					</label>
					<input
						id="express-name"
						name="name"
						type="text"
						bind:value={expressForm.name}
						placeholder="Your name"
						class={fieldClass}
					/>
				</div>
				<div>
					<label for="express-phone" class="mb-1 block text-xs font-medium text-slate-700">
						Mobile Number <span class="text-red-500">*</span>
					</label>
					<input
						id="express-phone"
						name="phone"
						type="tel"
						inputmode="numeric"
						maxlength="10"
						required
						bind:value={expressForm.phone}
						placeholder="10-digit mobile"
						class={fieldClass}
					/>
				</div>
				<div>
					<label for="express-gender" class="mb-1 block text-xs font-medium text-slate-700">
						Gender
					</label>
					<select id="express-gender" name="gender" bind:value={expressForm.gender} class={fieldClass}>
						<option value="">Select gender</option>
						<option value="male">Male</option>
						<option value="female">Female</option>
						<option value="other">Other</option>
					</select>
				</div>
				<div>
					<label for="express-age" class="mb-1 block text-xs font-medium text-slate-700">
						Age
					</label>
					<input
						id="express-age"
						name="age"
						type="number"
						min="1"
						max="150"
						bind:value={expressForm.age}
						placeholder="Age in years"
						class={fieldClass}
					/>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div>
					<label for="express-service-type" class="mb-1 block text-xs font-medium text-slate-700">
						Booking For
					</label>
					<select
						id="express-service-type"
						name="serviceType"
						bind:value={expressForm.serviceType}
						class={fieldClass}
					>
						<option value="lab_test">Lab Test (Home Sample)</option>
						<option value="xray">X-ray / Radiology</option>
						<option value="doctor_consultation">Doctor Consultation</option>
						<option value="general">General Inquiry</option>
					</select>
				</div>
				<div>
					<label for="express-service-name" class="mb-1 block text-xs font-medium text-slate-700">
						Test / Service <span class="text-slate-400">(optional)</span>
					</label>
					<input
						id="express-service-name"
						name="serviceName"
						type="text"
						bind:value={expressForm.serviceName}
						placeholder="e.g. CBC, Chest X-ray"
						class={fieldClass}
					/>
				</div>
				<div>
					<label for="express-date" class="mb-1 block text-xs font-medium text-slate-700">
						Preferred Date
					</label>
					<input
						id="express-date"
						name="preferredDate"
						type="date"
						min={todayIso()}
						bind:value={expressForm.preferredDate}
						class={fieldClass}
					/>
				</div>
				<div>
					<label for="express-slot" class="mb-1 block text-xs font-medium text-slate-700">
						Preferred Time
					</label>
					<select
						id="express-slot"
						name="preferredSlot"
						bind:value={expressForm.preferredSlot}
						class={fieldClass}
					>
						<option value="8AM-10AM">8 AM – 10 AM</option>
						<option value="10AM-12PM">10 AM – 12 PM</option>
						<option value="12PM-2PM">12 PM – 2 PM</option>
						<option value="2PM-4PM">2 PM – 4 PM</option>
					</select>
				</div>
			</div>

			<div>
				<label for="express-notes" class="mb-1 block text-xs font-medium text-slate-700">
					Notes <span class="text-slate-400">(optional)</span>
				</label>
				<textarea
					id="express-notes"
					name="notes"
					rows="2"
					bind:value={expressForm.notes}
					placeholder="Any symptoms or special instructions..."
					class={fieldClass}
				></textarea>
			</div>

			<div class="pt-1">
				<Button type="submit" variant="primary" fullWidth loading={expressSubmitting}>
					Book Now
				</Button>
			</div>
			<p class="text-center text-[10px] text-slate-400">
				By booking, you agree to be contacted by Bloodline Pathology.
			</p>
		</form>
	{/if}
</Modal>
