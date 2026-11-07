<script lang="ts">
	import { User, Lock, Mail, Phone, ShieldCheck, CheckCircle2 } from 'lucide-svelte';
	import Button from '$components/Button.svelte';
	import Card from '$components/Card.svelte';
	import Badge from '$components/Badge.svelte';

	let { data, form } = $props();

	let name = $state('');
	let phone = $state('9876543210');
	let profileSaving = $state(false);
	let passwordSaving = $state(false);

	$effect(() => {
		if (data.user?.name) name = data.user.name;
	});
</script>

<svelte:head>
	<title>User Profile | Bloodline Pathology</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
	<div>
		<h1 class="text-2xl font-bold tracking-tight text-slate-900">Account Settings</h1>
		<p class="text-xs sm:text-sm text-slate-500 mt-1">
			Manage your personal patient details and security credentials
		</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<!-- Left info card -->
		<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center text-center">
			<div class="w-20 h-20 rounded-full bg-red-50 text-red-600 font-bold text-2xl flex items-center justify-center border-2 border-red-100 mb-4">
				{data.user?.name ? data.user.name.charAt(0).toUpperCase() : 'U'}
			</div>
			<h3 class="text-base font-bold text-slate-900">{data.user?.name}</h3>
			<p class="text-xs text-slate-500 mt-0.5">{data.user?.email}</p>

			<div class="mt-3">
				<Badge variant="info" text={data.user?.role?.toUpperCase() ?? 'USER'} />
			</div>

			<div class="mt-6 w-full pt-4 border-t border-slate-100 text-left text-xs space-y-2 text-slate-600">
				<div class="flex items-center gap-2">
					<ShieldCheck class="w-4 h-4 text-emerald-600 flex-shrink-0" />
					<span>Verified Phone & Identity</span>
				</div>
				<div class="flex items-center gap-2">
					<CheckCircle2 class="w-4 h-4 text-emerald-600 flex-shrink-0" />
					<span>Encrypted Medical Records</span>
				</div>
			</div>
		</div>

		<!-- Right forms -->
		<div class="md:col-span-2 space-y-6">
			<!-- Personal Details -->
			<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
				<h3 class="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
					<User class="w-4 h-4 text-red-600" />
					Personal Information
				</h3>

				{#if form?.profileSuccess}
					<div class="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
						Profile details updated successfully!
					</div>
				{/if}
				{#if form?.profileError}
					<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
						{form.profileError}
					</div>
				{/if}

				<form method="POST" action="?/updateProfile" class="space-y-4" onsubmit={() => (profileSaving = true)}>
					<div>
						<label for="name" class="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
						<input
							id="name"
							name="name"
							type="text"
							required
							bind:value={name}
							class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
						/>
					</div>

					<div>
						<label for="email" class="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
						<input
							id="email"
							type="email"
							disabled
							value={data.user?.email}
							class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
						/>
					</div>

					<div>
						<label for="phone" class="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
						<input
							id="phone"
							name="phone"
							type="tel"
							bind:value={phone}
							class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
						/>
					</div>

					<div class="pt-2">
						<Button type="submit" variant="primary" size="sm" loading={profileSaving}>
							Save Changes
						</Button>
					</div>
				</form>
			</div>

			<!-- Password Security -->
			<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
				<h3 class="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
					<Lock class="w-4 h-4 text-red-600" />
					Change Password
				</h3>

				{#if form?.passwordSuccess}
					<div class="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
						Password updated successfully!
					</div>
				{/if}
				{#if form?.passwordError}
					<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
						{form.passwordError}
					</div>
				{/if}

				<form method="POST" action="?/changePassword" class="space-y-4" onsubmit={() => (passwordSaving = true)}>
					<div>
						<label for="currentPassword" class="block text-xs font-medium text-slate-700 mb-1">Current Password</label>
						<input
							id="currentPassword"
							name="currentPassword"
							type="password"
							required
							placeholder="••••••••"
							class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
						/>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<label for="newPassword" class="block text-xs font-medium text-slate-700 mb-1">New Password</label>
							<input
								id="newPassword"
								name="newPassword"
								type="password"
								required
								minlength="6"
								placeholder="Min 6 characters"
								class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
							/>
						</div>
						<div>
							<label for="confirmPassword" class="block text-xs font-medium text-slate-700 mb-1">Confirm Password</label>
							<input
								id="confirmPassword"
								name="confirmPassword"
								type="password"
								required
								placeholder="Re-enter password"
								class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
							/>
						</div>
					</div>

					<div class="pt-2">
						<Button type="submit" variant="outline" size="sm" loading={passwordSaving}>
							Update Password
						</Button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>
