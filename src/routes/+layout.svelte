<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import '../app.css';
	import { page } from '$app/stores';
	import { writable } from 'svelte/store';
	import { supabase } from '$lib/supabase';
	import type { User } from '@supabase/supabase-js';

	let user = writable<User | null>(null);
	let isAdmin = writable(false);
	let isWarehouse = writable(false);
	let isSupplier = writable(false);

	onMount(async () => {
		const {
			data: { session },
			error: sessionError
		} = await supabase.auth.getSession();

		if (sessionError) {
			console.error("Error getting session:", sessionError.message);
			return;
		}

		if (!session && !isBoxPage && !isLoginPage && isHomePage && !isSupplierPage) {
				window.location.replace(`${base}/login`);
				return;
		}

		const {
			data: { user: fetchedUser },
			error: userError
		} = await supabase.auth.getUser();

		if (userError) {
			console.error("Error fetching user:", userError.message);
			return;
		}

		if (fetchedUser) {
			user.set(fetchedUser);
			const fetchRoles = async () => {
				const { data: accounts, error } = await supabase
					.from('accounts')
					.select('isWarehouse, isSupplier')
					.eq('username', fetchedUser.email)
					.single();

				if (error) {
					console.error("Error fetching account roles:", error);
					return;
				}

				isWarehouse.set(!!accounts?.isWarehouse);
				isSupplier.set(!!accounts?.isSupplier);

				isAdmin.set(!!accounts?.isWarehouse && !!accounts?.isSupplier);
			};

			fetchRoles();
		}
	});

	$: isLoginPage = $page.url.pathname === `${base}/login`;
	$: isInvalidPage = $page.url.pathname === `${base}/invalid`;
	$: isBoxPage = $page.url.pathname.startsWith(`${base}/warehouse/boxes/`);

	$: isWarehousePage = $page.url.pathname === `${base}/warehouse`;
	$: isSuppliersPage = $page.url.pathname === `${base}/suppliers`;
	$: isSupplierPage = $page.url.pathname.startsWith(`${base}/supplier/`);

	$: isHomePage = $page.url.pathname.startsWith(`${base}`);



	$: $page.data.user && user.set($page.data.user);

	async function logout() {
		await supabase.auth.signOut()

		window.location.replace(`${base}/login`);
	}
</script>

<main class="flex min-h-screen flex-col bg-gray-900 p-10 ">
	<!-- Header for users alone --> 
	{#if $user && !isLoginPage && !isInvalidPage && ($isWarehouse || $isAdmin ) && (!isBoxPage) && (!isSupplierPage)}
		<div class="flex justify-between items-center w-full">
			<div>
				<h1 class="text-3xl text-white font-bold mb-2">
					{#if $isAdmin}
					  <a href="{base}" class="hover:underline">Rapid Reboot Inventory System</a>
					{:else}
					  Rapid Reboot Inventory System
					{/if}
				  </h1>
				  
				<p class="text-lg text-white">
					Welcome, <span class="font-semibold">{$user?.email}</span>
				</p>
			</div>
			<div class="flex space-x-4">
				<!-- If user is admin also allow permissions -->
				{#if $isAdmin}
				<div class="flex space-x-4">
					<form action={`${base}/accounts`}>
						<button
							type="submit"
							class="bg-lime-700 hover:bg-lime-800 text-white font-bold py-2 px-4 rounded"
						>
							Permissions
						</button>
					</form>
				</div>
				{/if}
				<button
				type="button"
				on:click={logout}
				class="text-white font-bold rounded flex items-center justify-center"
				aria-label="Logout"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-7 w-7"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-10V5m0 14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2h4a2 2 0 012 2v1"
					/>
				</svg>
			</button>

			</div>
			
		</div>
	{/if}

	{#if $isAdmin && !isLoginPage && !isWarehousePage && !isSupplierPage && !isBoxPage}
	<slot />
	{/if}

	{#if isLoginPage || (isInvalidPage && !$user)}
		<slot />
	{/if}

	
	{#if isWarehousePage && $isWarehouse}
		<slot />
	{/if}

	{#if isBoxPage}
		<slot />
	{/if}

	{#if isSupplierPage}
		<slot />
	{/if}
</main>
