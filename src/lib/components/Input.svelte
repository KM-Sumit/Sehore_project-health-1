<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props {
		label?: string;
		name: string;
		type?: HTMLInputAttributes['type'];
		placeholder?: string;
		value?: string;
		error?: string;
		required?: boolean;
		disabled?: boolean;
		class?: string;
	}

	let {
		label,
		name,
		type = 'text',
		placeholder = '',
		value = $bindable(''),
		error = '',
		required = false,
		disabled = false,
		class: className = '',
		...rest
	}: Props = $props();

	let inputId = $derived(`input-${name}`);
</script>

<div class="w-full {className}">
	{#if label}
		<label for={inputId} class="block text-sm font-medium text-slate-700 mb-1.5">
			{label}
			{#if required}
				<span class="text-red-500">*</span>
			{/if}
		</label>
	{/if}
	<input
		id={inputId}
		{name}
		{type}
		{placeholder}
		{required}
		{disabled}
		bind:value
		class="block w-full rounded-lg border {error
			? 'border-red-400 focus:ring-red-500 focus:border-red-500'
			: 'border-slate-300 focus:ring-red-500 focus:border-red-500'} bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
		{...rest}
	/>
	{#if error}
		<p class="mt-1.5 text-sm text-red-600">{error}</p>
	{/if}
</div>
