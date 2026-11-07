<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import Navbar from '$components/Navbar.svelte';
	import Footer from '$components/Footer.svelte';
	import Toast from '$components/Toast.svelte';

	let { data, children } = $props();
	let isAuthRoute = $derived(
		page.url.pathname.startsWith('/login') || page.url.pathname.startsWith('/register')
	);
</script>

<div class="min-h-screen flex flex-col bg-slate-50">
	{#if !isAuthRoute}
		<Navbar user={data.user} />
	{/if}
	<main class="flex-1">
		{@render children()}
	</main>
	{#if !isAuthRoute}
		<Footer />
	{/if}
</div>
<Toast />
