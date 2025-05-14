<script>
    import { base } from '$app/paths';
    import { supabase } from '$lib/supabase';


    let email = '';
    let password = '';
    let error = '';

    async function handleLogin() {
        error = '';
        if (!email || !password) {
            error = 'Missing email or password';
            return;
        }

        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError || !data.user) {
            error = 'Invalid email or password';
            return;
        }

        const user = data.user;

        const { data: accountRoles, error: rolesError } = await supabase
            .from('accounts')
            .select('isWarehouse, isSupplier')
            .eq('username', user.email)
            .single();

        if (rolesError) {
            error = 'Failed to fetch user roles';
            return;
        }

        const isWarehouse = !!accountRoles?.isWarehouse;
        const isSupplier = !!accountRoles?.isSupplier;

        if (isWarehouse && isSupplier) {
            window.location.href = `${base}`;
        } else if (isWarehouse) {
            window.location.href = '/warehouse';
        } else if (isSupplier) {
            window.location.href = '/supplier';
        } else {
            window.location.href = '/invalid';
        }
    }
</script>

<div class="bg-white p-8 rounded shadow-md w-full max-w-sm mx-auto my-auto">
    <h1 class="text-2xl font-bold mb-6 text-center">Rapid Reboot Inventory</h1>
    {#if error}
    <div class="bg-red-100 text-red-700 p-3 rounded mb-4">
        {error}
    </div>
    {/if}
    <form on:submit|preventDefault={handleLogin} class="space-y-4">
        <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
            <input
                type="text"
                id="email"
                bind:value={email}
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-lime-500 focus:border-lime-500"
                placeholder="Enter your email"
            />
        </div>
        <div>
            <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
            <input
                type="password"
                id="password"
                bind:value={password}
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-lime-500 focus:border-lime-500"
                placeholder="Enter your password"
            />
        </div>
        <button
            type="submit"
            class="w-full bg-lime-700 text-white py-2 px-4 rounded hover:bg-lime-600 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2"
        >
            Login
        </button>
    </form>
</div>
