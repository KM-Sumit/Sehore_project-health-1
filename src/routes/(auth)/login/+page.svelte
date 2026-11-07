<script lang="ts">
	import { Plus, Lock, Mail, ArrowRight } from 'lucide-svelte';
	import Button from '$components/Button.svelte';
	import Input from '$components/Input.svelte';

	let { form } = $props();

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
</script>

<div class="sm:mx-auto sm:w-full sm:max-w-md">
	<div class="flex justify-center">
		<a href="/" class="flex items-center gap-2">
			<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 shadow-xs">
				<Plus class="h-6 w-6 text-white stroke-[2.5]" />
			</div>
			<span class="text-2xl font-bold tracking-tight text-slate-900">Bloodline Pathology</span>
		</a>
	</div>
	<h2 class="mt-4 text-center text-xl font-bold tracking-tight text-slate-900">
		Sign in to your account
	</h2>
	<p class="mt-1 text-center text-xs text-slate-500">
		Manage your doctor appointments and diagnostic blood test reports
	</p>
</div>

<div class="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
	<div class="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
		{#if form?.error}
			<div class="mb-5 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
				{form.error}
			</div>
		{/if}

		<!-- Google OAuth Button -->
		<a
			href="/api/auth/google"
			class="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-300 rounded-lg shadow-2xs bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
		>
			<svg class="h-4 w-4" viewBox="0 0 24 24">
				<path
					fill="#4285F4"
					d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
				/>
				<path
					fill="#34A853"
					d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
				/>
				<path
					fill="#FBBC05"
					d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
				/>
				<path
					fill="#EA4335"
					d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
				/>
			</svg>
			Continue with Google
		</a>

		<div class="relative my-6">
			<div class="absolute inset-0 flex items-center">
				<div class="w-full border-t border-slate-200"></div>
			</div>
			<div class="relative flex justify-center text-xs">
				<span class="bg-white px-3 text-slate-400">or sign in with email</span>
			</div>
		</div>

		<form method="POST" class="space-y-4" onsubmit={() => (loading = true)}>
			<div>
				<label for="email" class="block text-xs font-medium text-slate-700 mb-1">Email address</label>
				<input
					id="email"
					name="email"
					type="email"
					required
					bind:value={email}
					placeholder="you@example.com"
					class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
				/>
			</div>

			<div>
				<div class="flex items-center justify-between mb-1">
					<label for="password" class="block text-xs font-medium text-slate-700">Password</label>
					<span class="text-xs text-red-600 hover:underline cursor-pointer">Forgot?</span>
				</div>
				<input
					id="password"
					name="password"
					type="password"
					required
					bind:value={password}
					placeholder="••••••••"
					class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
				/>
			</div>

			<div class="pt-2">
				<Button type="submit" variant="primary" fullWidth size="md" {loading}>
					Sign in
					<ArrowRight class="w-4 h-4 ml-1" />
				</Button>
			</div>
		</form>

		<div class="mt-6 text-center text-xs text-slate-500">
			Don't have an account?{' '}
			<a href="/register" class="font-semibold text-red-600 hover:text-red-500">
				Create an account
			</a>
		</div>
	</div>
</div>
