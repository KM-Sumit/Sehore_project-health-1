<script lang="ts">
	interface SelectOption {
		value: string;
		label: string;
	}

	interface Props {
		label?: string;
		name: string;
		options: SelectOption[];
		value?: string;
		error?: string;
		required?: boolean;
		disabled?: boolean;
		placeholder?: string;
		class?: string;
	}

	let {
		label,
		name,
		options,
		value = $bindable(''),
		error = '',
		required = false,
		disabled = false,
		placeholder = 'Select an option',
		class: className = '',
		...rest
	}: Props = $props();

	let selectId = $derived(`select-${name}`);
</script>

<div class="w-full {className}">
	{#if label}
		<label for={selectId} class="block text-sm font-medium text-slate-700 mb-1.5">
			{label}
			{#if required}
				<span class="text-red-500">*</span>
			{/if}
		</label>
	{/if}
	<select
		id={selectId}
		{name}
		{required}
		{disabled}
		bind:value
		class="block w-full rounded-lg border {error
			? 'border-red-400 focus:ring-red-500 focus:border-red-500'
			: 'border-slate-300 focus:ring-red-500 focus:border-red-500'} bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10"
		{...rest}
	>
		{#if placeholder}
			<option value="" disabled>{placeholder}</option>
		{/if}
		{#each options as option}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
	{#if error}
		<p class="mt-1.5 text-sm text-red-600">{error}</p>
	{/if}
</div>
