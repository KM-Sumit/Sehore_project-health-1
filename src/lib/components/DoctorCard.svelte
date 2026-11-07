<script lang="ts">
	import Card from './Card.svelte';
	import Button from './Button.svelte';
	import Badge from './Badge.svelte';
	import { Stethoscope, Award, Clock } from 'lucide-svelte';

	interface Doctor {
		id: string;
		name: string;
		specialty: string;
		qualification: string;
		experienceYears: number;
		consultationFee: string | number;
		imageUrl?: string | null;
		bio?: string;
		isActive?: boolean;
	}

	interface Props {
		doctor: Doctor;
		actionLabel?: string;
		onBook?: () => void;
	}

	let { doctor, actionLabel = 'Book Appointment', onBook }: Props = $props();

	function getInitials(name: string): string {
		return name
			.replace(/^Dr\.\s*/i, '')
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}
</script>

<Card hover={true} padding="md" class="flex flex-col justify-between h-full border border-slate-200">
	<div>
		<div class="flex items-start gap-4">
			{#if doctor.imageUrl}
				<img
					src={doctor.imageUrl}
					alt={doctor.name}
					class="w-16 h-16 rounded-full object-cover border-2 border-red-100 flex-shrink-0"
				/>
			{:else}
				<div
					class="w-16 h-16 rounded-full bg-red-50 text-red-600 font-bold text-lg flex items-center justify-center flex-shrink-0 border-2 border-red-100"
				>
					{getInitials(doctor.name)}
				</div>
			{/if}
			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-2 flex-wrap">
					<h3 class="text-base font-semibold text-slate-900 truncate">{doctor.name}</h3>
					<Badge variant="info" text={doctor.specialty} />
				</div>
				<p class="text-xs text-slate-500 mt-1 flex items-center gap-1">
					<Award class="w-3.5 h-3.5 text-slate-400" />
					<span class="truncate">{doctor.qualification}</span>
				</p>
				<p class="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
					<Clock class="w-3.5 h-3.5 text-slate-400" />
					<span>{doctor.experienceYears} years experience</span>
				</p>
			</div>
		</div>

		{#if doctor.bio}
			<p class="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
				{doctor.bio}
			</p>
		{/if}
	</div>

	<div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
		<div>
			<span class="text-xs text-slate-400 block">Consultation Fee</span>
			<span class="text-base font-bold text-slate-900">₹{doctor.consultationFee}</span>
		</div>
		{#if onBook}
			<Button variant="primary" size="sm" onclick={onBook}>
				{actionLabel}
			</Button>
		{:else}
			<Button variant="primary" size="sm" href={`/book-appointment/${doctor.id}`}>
				{actionLabel}
			</Button>
		{/if}
	</div>
</Card>

