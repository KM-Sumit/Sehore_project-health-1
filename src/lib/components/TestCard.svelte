<script lang="ts">
	import Badge from './Badge.svelte';
	import { Check, Clock, AlertCircle, Info } from 'lucide-svelte';

	interface Test {
		id: string;
		name: string;
		description: string;
		price: string | number;
		category: string;
		preparationInstructions?: string | null;
		turnaroundHours?: number;
	}

	interface Props {
		test: Test;
		selected?: boolean;
		onToggle?: (test: Test) => void;
	}

	let { test, selected = false, onToggle }: Props = $props();
	let showInstructions = $state(false);

	function handleClick() {
		if (onToggle) {
			onToggle(test);
		}
	}
</script>

<div
	class="relative rounded-xl border p-4 transition-all duration-150 bg-white flex flex-col justify-between {selected
		? 'border-red-600 ring-2 ring-red-500/20 shadow-sm'
		: 'border-slate-200 hover:border-slate-300 shadow-xs'}"
>
	<div>
		<div class="flex items-start justify-between gap-3">
			<div class="flex-1">
				<div class="flex items-center gap-2 flex-wrap">
					<h4 class="text-sm font-semibold text-slate-900">{test.name}</h4>
					<Badge variant="neutral" text={test.category} />
				</div>
				<p class="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
					{test.description}
				</p>
			</div>

			<!-- Selection indicator button -->
			<button
				type="button"
				onclick={handleClick}
				class="w-6 h-6 rounded-md flex items-center justify-center border transition-colors flex-shrink-0 cursor-pointer {selected
					? 'bg-red-600 border-red-600 text-white'
					: 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-transparent'}"
				aria-label={selected ? `Deselect ${test.name}` : `Select ${test.name}`}
			>
				<Check class="w-4 h-4 stroke-[3]" />
			</button>
		</div>

		<!-- Turnaround & Prep prompt -->
		<div class="mt-3 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
			<span class="flex items-center gap-1">
				<Clock class="w-3.5 h-3.5 text-slate-400" />
				<span>Reports in {test.turnaroundHours ?? 24}h</span>
			</span>

			{#if test.preparationInstructions}
				<button
					type="button"
					onclick={() => (showInstructions = !showInstructions)}
					class="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium cursor-pointer"
				>
					<Info class="w-3.5 h-3.5" />
					<span>{showInstructions ? 'Hide instructions' : 'Preparation info'}</span>
				</button>
			{/if}
		</div>

		{#if showInstructions && test.preparationInstructions}
			<div class="mt-2.5 p-2.5 rounded-lg bg-amber-50 border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2">
				<AlertCircle class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
				<div class="leading-relaxed">
					<span class="font-medium">Instructions:</span> {test.preparationInstructions}
				</div>
			</div>
		{/if}
	</div>

	<!-- Price & Add/Remove Action -->
	<div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
		<div>
			<span class="text-xs text-slate-400 block">Test Price</span>
			<span class="text-base font-bold text-slate-900">₹{test.price}</span>
		</div>
		<button
			type="button"
			onclick={handleClick}
			class="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer {selected
				? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
				: 'bg-red-50 text-red-600 hover:bg-red-100'}"
		>
			{selected ? 'Remove' : '+ Add Test'}
		</button>
	</div>
</div>

