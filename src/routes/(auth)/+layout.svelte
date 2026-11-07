<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<svelte:head>
	<title>Bloodline Pathology — Authentication</title>
</svelte:head>

<div class="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
	{@render children()}
</div>

