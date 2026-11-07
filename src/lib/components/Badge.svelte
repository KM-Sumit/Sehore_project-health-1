<script lang="ts">
	type Variant = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

	interface Props {
		variant?: Variant;
		text: string;
		class?: string;
	}

	let { variant = 'neutral', text, class: className = '' }: Props = $props();

	const variantClasses: Record<Variant, string> = {
		info: 'bg-red-50 text-red-700 ring-red-600/20',
		success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
		warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
		danger: 'bg-red-50 text-red-700 ring-red-600/20',
		neutral: 'bg-slate-50 text-slate-700 ring-slate-600/20'
	};
</script>

<span
	class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset {variantClasses[variant]} {className}"
>
	{text}
</span>
