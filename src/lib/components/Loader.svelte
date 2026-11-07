<script lang="ts">
	type Size = 'sm' | 'md' | 'lg';

	interface Props {
		size?: Size;
		fullPage?: boolean;
		class?: string;
	}

	let { size = 'md', fullPage = false, class: className = '' }: Props = $props();

	const sizeClasses: Record<Size, string> = {
		sm: 'h-5 w-5',
		md: 'h-8 w-8',
		lg: 'h-12 w-12'
	};
</script>

{#if fullPage}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
		<div
			class="{sizeClasses[size]} animate-spin rounded-full border-2 border-slate-200 border-t-red-600 {className}"
		></div>
	</div>
{:else}
	<div class="flex items-center justify-center py-8 {className}">
		<div
			class="{sizeClasses[size]} animate-spin rounded-full border-2 border-slate-200 border-t-red-600"
		></div>
	</div>
{/if}
