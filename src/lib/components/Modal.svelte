<script lang="ts">
	import type { Snippet } from 'svelte';
	import { X } from 'lucide-svelte';

	interface Props {
		open: boolean;
		title?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		children: Snippet;
		onclose?: () => void;
	}

	let { open = $bindable(false), title = '', size = 'md', children, onclose }: Props = $props();

	const sizeClasses = {
		sm: 'max-w-md',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl'
	};

	function close() {
		open = false;
		if (onclose) onclose();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			close();
		}
	}

	$effect(() => {
		if (typeof document !== 'undefined') {
			if (open) {
				document.body.style.overflow = 'hidden';
			} else {
				document.body.style.overflow = '';
			}
		}
		return () => {
			if (typeof document !== 'undefined') {
				document.body.style.overflow = '';
			}
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
		role="dialog"
		aria-modal="true"
	>
		<!-- Backdrop click handler -->
		<button
			type="button"
			class="fixed inset-0 w-full h-full cursor-default border-none bg-transparent"
			onclick={close}
			aria-label="Close modal overlay"
		></button>

		<!-- Modal Box -->
		<div
			class="relative w-full {sizeClasses[size]} rounded-2xl bg-white shadow-xl border border-slate-200 z-10 overflow-hidden transform transition-all animate-in zoom-in-95 duration-150"
		>
			{#if title}
				<div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
					<h3 class="text-base font-semibold text-slate-900">{title}</h3>
					<button
						type="button"
						onclick={close}
						class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
						aria-label="Close modal"
					>
						<X class="w-5 h-5" />
					</button>
				</div>
			{/if}

			<div class="p-6">
				{@render children()}
			</div>
		</div>
	</div>
{/if}

