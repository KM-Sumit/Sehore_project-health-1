<script lang="ts">
	import { ShieldCheck, Lock, User, ArrowRight, ArrowLeft } from 'lucide-svelte';
	import Button from '$components/Button.svelte';

	let { form } = $props();

	let adminId = $state('');
	let password = $state('');
	let loading = $state(false);

	$effect(() => {
		if (form?.adminId && !adminId) {
			adminId = form.adminId;
		}
	});
</script>

<svelte:head>
	<title>Admin Portal Sign In | Bloodline Pathology</title>
</svelte:head>

<div class="min-h-[calc(100vh-14rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
		<div class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm mb-4">
			<ShieldCheck class="h-6 w-6 text-red-400" />
		</div>
		<span class="block text-[11px] font-mono font-bold uppercase tracking-widest text-red-600">
			Operations &amp; Lab Staff Portal
		</span>
		<h1 class="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
			Admin Console Access
		</h1>
		<p class="mt-1.5 text-xs text-slate-500">
			Sign in with your Admin ID to verify appointments, doctor QR codes, and lab test orders.
		</p>
	</div>

	<div class="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-9">
			{#if form?.error}
				<div class="mb-5 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
					{form.error}
				</div>
			{/if}

			<form method="POST" class="space-y-4" onsubmit={() => (loading = true)}>
				<div>
					<label for="adminId" class="block text-xs font-semibold text-slate-700 mb-1">
						Admin ID
					</label>
					<div class="relative">
						<User class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
						<input
							id="adminId"
							name="adminId"
							type="text"
							required
							autocomplete="username"
							bind:value={adminId}
							placeholder="Enter Admin ID"
							class="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
						/>
					</div>
				</div>

				<div>
					<label for="adminPassword" class="block text-xs font-semibold text-slate-700 mb-1">
						Password
					</label>
					<div class="relative">
						<Lock class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
						<input
							id="adminPassword"
							name="password"
							type="password"
							required
							autocomplete="current-password"
							bind:value={password}
							placeholder="••••••••"
							class="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
						/>
					</div>
				</div>

				<div class="pt-2">
					<Button type="submit" variant="primary" fullWidth size="md" {loading}>
						Sign in to Admin Console
						<ArrowRight class="w-4 h-4 ml-1" />
					</Button>
				</div>
			</form>

			<div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
				<a href="/" class="inline-flex items-center gap-1 hover:text-red-600 font-medium">
					<ArrowLeft class="w-3.5 h-3.5" />
					Back to Public Site
				</a>
				<span class="text-[11px] text-slate-400">OAuth ready for production</span>
			</div>
		</div>
	</div>
</div>

