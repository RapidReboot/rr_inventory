<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import type { PageData } from './$types';

	export let data: PageData;

	let user = data.user;


	async function handleLogout() {
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error('Error signing out:', error.message);
		} else {
			goto(`${base}/login`);
		}
	}
</script>

<div class="flex items-center justify-center h-screen text-center flex-col">
	<h1
		class="text-white text-2xl font-bold px-4"
		style="line-height: 1.5;"
	>
		No valid permission found for {user?.email}.<br />
		Please ensure the admin has set permissions for your account.
	</h1>
	<button
		on:click={handleLogout}
		class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded mt-6 shadow-lg transform transition-transform duration-200 hover:scale-105"
	>
		Log Out
	</button>
</div>
