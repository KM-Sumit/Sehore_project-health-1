<script lang="ts">
	import { Check } from 'lucide-svelte';

	type StatusType = 'appointment' | 'test';

	interface Props {
		status: string;
		type?: StatusType;
	}

	let { status, type = 'appointment' }: Props = $props();

	const appointmentSteps = [
		{ key: 'pending', label: 'Pending' },
		{ key: 'confirmed', label: 'Confirmed' },
		{ key: 'completed', label: 'Completed' }
	];

	const testSteps = [
		{ key: 'pending', label: 'Booked' },
		{ key: 'confirmed', label: 'Confirmed' },
		{ key: 'sample_collected', label: 'Sample Collected' },
		{ key: 'processing', label: 'Lab Processing' },
		{ key: 'completed', label: 'Report Ready' }
	];

	const steps = $derived(type === 'appointment' ? appointmentSteps : testSteps);

	const isCancelled = $derived(status === 'cancelled');

	const currentStepIndex = $derived(
		steps.findIndex((s) => s.key === status)
	);
</script>

{#if isCancelled}
	<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
		<span class="w-2 h-2 rounded-full bg-red-500"></span>
		Cancelled
	</div>
{:else}
	<div class="w-full">
		<div class="flex items-center justify-between relative">
			<!-- Track line -->
			<div class="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 z-0"></div>
			<div
				class="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-red-600 transition-all duration-300 z-0"
				style="width: {currentStepIndex <= 0 ? 0 : (currentStepIndex / (steps.length - 1)) * 100}%"
			></div>

			{#each steps as step, index}
				{@const isCompleted = currentStepIndex > index}
				{@const isCurrent = currentStepIndex === index}
				<div class="relative z-10 flex flex-col items-center">
					<div
						class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors {isCompleted
							? 'bg-red-600 text-white'
							: isCurrent
								? 'bg-white border-2 border-red-600 text-red-600 shadow-xs'
								: 'bg-white border-2 border-slate-200 text-slate-400'}"
					>
						{#if isCompleted}
							<Check class="w-4 h-4 stroke-[3]" />
						{:else}
							<span>{index + 1}</span>
						{/if}
					</div>
					<span
						class="text-[11px] font-medium mt-1.5 whitespace-nowrap {isCurrent
							? 'text-red-700 font-semibold'
							: isCompleted
								? 'text-slate-700'
								: 'text-slate-400'}"
					>
						{step.label}
					</span>
				</div>
			{/each}
		</div>
	</div>
{/if}

