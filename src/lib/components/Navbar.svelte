<script lang="ts">
	import { Plus, Menu, X, ChevronDown, User, LayoutDashboard, LogOut, Phone, ShieldCheck } from 'lucide-svelte';

	interface Props {
		user: App.Locals['user'];
	}

	let { user }: Props = $props();

	let mobileOpen = $state(false);
	let profileOpen = $state(false);

	const navLinks = $derived([
		{ href: '/', label: 'Home' },
		{ href: '/book-test', label: 'Lab Tests & Packages' },
		{ href: '/book-appointment', label: 'Doctor Consultations' },
		...(user ? [{ href: '/dashboard', label: 'My Reports & Bookings' }] : []),
		...(user?.role === 'admin' ? [{ href: '/admin', label: 'Admin Console' }] : [])
	]);

	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
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
