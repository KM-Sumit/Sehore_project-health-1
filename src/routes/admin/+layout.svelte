<script lang="ts">
	import type { Snippet } from "svelte";
	import {
		LayoutDashboard,
		FlaskConical,
		CalendarCheck,
		QrCode,
		ArrowLeft,
		LogOut,
		ShieldCheck,
	} from "lucide-svelte";
	import { page } from "$app/state";

	interface Props {
		data: { user: App.Locals["user"]; isAdminLogin?: boolean };
		children: Snippet;
	}

	let { data, children }: Props = $props();

	const adminLinks = [
		{ href: "/admin", label: "Overview", icon: LayoutDashboard },
		{
			href: "/admin/appointments",
			label: "Appointment Requests",
			icon: CalendarCheck,
		},
		{
			href: "/admin/doctors",
			label: "Doctor QRs & Commission",
			icon: QrCode,
		},
		{
			href: "/admin/bookings",
			label: "Lab Test Orders",
			icon: FlaskConical,
		},
	];
</script>

{#if data.isAdminLogin || page.url.pathname === "/admin/login"}
	{@render children()}
{:else}
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
		<!-- Admin header bar -->
		<div
			class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 mb-6"
		>
			<div class="flex items-center gap-3">
				<span
					class="px-2.5 py-1 rounded bg-slate-900 text-white font-mono text-xs font-bold tracking-wider"
				>
					ADMIN CONSOLE
				</span>
				<span class="text-xs text-slate-500"
					>Bloodline Pathology Operations & Clinical Management</span
				>
			</div>
			<div class="flex items-center gap-3">
				{#if data.user}
					<span
						class="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md"
					>
						<ShieldCheck class="w-3.5 h-3.5" />
						{data.user.name}
					</span>
				{/if}
				<a
					href="/"
					class="text-xs text-slate-600 hover:text-red-600 flex items-center gap-1 font-medium"
				>
					<ArrowLeft class="w-3.5 h-3.5" />
					Public Site
				</a>
				<form
					method="POST"
					action="/api/auth/logout?redirectTo=/admin/login"
				>
					<button
						type="submit"
						class="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold cursor-pointer"
					>
						<LogOut class="w-3.5 h-3.5" />
						Admin Logout
					</button>
				</form>
			</div>
		</div>

		<div class="flex flex-col md:flex-row gap-6">
			<!-- Sidebar -->
			<aside class="w-full md:w-56 shrink-0 space-y-1">
				{#each adminLinks as link}
					{@const Icon = link.icon}
					{@const isActive = page.url.pathname === link.href}
					<a
						href={link.href}
						class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors {isActive
							? 'bg-red-600 text-white shadow-2xs'
							: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}"
					>
						<Icon class="w-4 h-4" />
						<span>{link.label}</span>
					</a>
				{/each}
			</aside>

			<!-- Main content -->
			<main class="flex-1 min-w-0">
				{@render children()}
			</main>
		</div>
	</div>
{/if}
