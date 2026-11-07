<script lang="ts">
	import type { Snippet } from 'svelte';

	type Padding = 'sm' | 'md' | 'lg';

	interface Props {
		padding?: Padding;
		hover?: boolean;
		children: Snippet;
		class?: string;
	}

	let {
		padding = 'md',
		hover = false,
		children,
		class: className = ''
	}: Props = $props();

	const paddingClasses: Record<Padding, string> = {
		sm: 'p-4',
		md: 'p-6',
		lg: 'p-8'
	};

	let classes = $derived(
		[
			'bg-white rounded-xl shadow-sm border border-slate-100',
			paddingClasses[padding],
			hover ? 'transition-shadow duration-200 hover:shadow-lg' : '',
			className
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

<div class={classes}>
	{@render children()}
</div>
