<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from './Button.svelte';
	import { Inbox } from 'lucide-svelte';

	interface Props {
		title: string;
		description: string;
		actionLabel?: string;
		actionHref?: string;
		onAction?: () => void;
		children?: Snippet;
	}

	let { title, description, actionLabel, actionHref, onAction, children }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
	<div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
		{#if children}
			{@render children()}
		{:else}
			<Inbox class="w-6 h-6" />
		{/if}
	</div>
	<h3 class="text-sm font-semibold text-slate-900">{title}</h3>
	<p class="text-xs text-slate-500 max-w-sm mt-1">{description}</p>
	{#if actionLabel}
		<div class="mt-4">
			{#if actionHref}
				<Button variant="outline" size="sm" href={actionHref}>
					{actionLabel}
				</Button>
			{:else if onAction}
				<Button variant="outline" size="sm" onclick={onAction}>
					{actionLabel}
				</Button>
			{/if}
		</div>
	{/if}
</div>

