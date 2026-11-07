<script lang="ts">
	import { LoaderCircle } from 'lucide-svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';

	type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
	type Size = 'sm' | 'md' | 'lg';

	interface Props {
		variant?: Variant;
		size?: Size;
		disabled?: boolean;
		loading?: boolean;
		type?: HTMLButtonAttributes['type'];
		fullWidth?: boolean;
		href?: string;
		children: Snippet;
		onclick?: HTMLButtonAttributes['onclick'];
		class?: string;
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		type = 'button',
		fullWidth = false,
		href,
		children,
		onclick,
		class: className = '',
		...rest
	}: Props = $props();

	const variantClasses: Record<Variant, string> = {
		primary: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
		secondary: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm',
		outline: 'border-2 border-red-600 text-red-600 hover:bg-red-50',
		danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
		ghost: 'text-slate-600 hover:bg-slate-100'
	};

	const sizeClasses: Record<Size, string> = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-5 py-2.5 text-sm',
		lg: 'px-6 py-3 text-base'
	};

	let classes = $derived(
		[
			'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-150 cursor-pointer',
			'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
			variantClasses[variant],
			sizeClasses[size],
			fullWidth ? 'w-full' : '',
			disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
			className
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

{#if href && !disabled}
	<a {href} class={classes} {...rest}>
		{#if loading}
			<LoaderCircle class="h-4 w-4 animate-spin" />
		{/if}
		{@render children()}
	</a>
{:else}
	<button {type} disabled={disabled || loading} class={classes} {onclick} {...rest}>
		{#if loading}
			<LoaderCircle class="h-4 w-4 animate-spin" />
		{/if}
		{@render children()}
	</button>
{/if}
