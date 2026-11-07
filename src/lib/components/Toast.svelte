<script lang="ts">
	import { X, CheckCircle, AlertCircle, Info } from 'lucide-svelte';
	import { toasts, removeToast } from '$utils/toast';

	const iconMap = {
		success: CheckCircle,
		error: AlertCircle,
		info: Info
	} as const;

	const colorMap = {
		success: 'bg-accent-50 border-accent-200 text-accent-800',
		error: 'bg-red-50 border-red-200 text-red-800',
		info: 'bg-primary-50 border-primary-200 text-primary-800'
	} as const;

	const iconColorMap = {
		success: 'text-accent-500',
		error: 'text-red-500',
		info: 'text-primary-500'
	} as const;
</script>

<div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
	{#each toasts.items as toast (toast.id)}
		<div class="pointer-events-auto border rounded-lg p-4 shadow-lg flex items-start gap-3 animate-slide-in {colorMap[toast.type]}">
			<svelte:component this={iconMap[toast.type]} class="w-5 h-5 shrink-0 {iconColorMap[toast.type]}" />
			<p class="text-sm flex-1">{toast.message}</p>
			<button onclick={() => removeToast(toast.id)} class="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
				<X class="w-4 h-4" />
			</button>
		</div>
	{/each}
</div>

<style>
	@keyframes slide-in {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}
	:global(.animate-slide-in) {
		animation: slide-in 0.3s ease-out;
	}
</style>
