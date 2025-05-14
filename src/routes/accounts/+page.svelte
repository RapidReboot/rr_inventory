<script lang="ts">
    import { supabase } from '$lib/supabase';

	export let data: { table: { id: number; username: string; isWarehouse: boolean; isSupplier: boolean }[] };

	async function addAccount() {
	const { data: newUser, error } = await supabase
	.from("accounts")
	.insert([{ 
		username: "Username", 
		isWarehouse: false, 
		isSupplier: false,
	}])
	.select()
	.single();

	if (error) {
	console.error("Error adding user:", error);
	return;
	}

	data = { ...data, table: [...data.table, newUser] };
}

	async function fetchAccounts() {
		const { data: accounts, error } = await supabase.from("accounts").select("*");
		if (error) {
			console.error("Error fetching accounts:", error);
			return;
		}
		data.table = accounts;
	}

	async function updateAccount(id: number, updatedFields: { username?: string; isWarehouse?: boolean; isSupplier?: boolean }) {
		const { error } = await supabase.from("accounts").update(updatedFields).eq("id", id);
		if (error) {
			console.error("Error updating account:", error);
			return;
		}
		await fetchAccounts();
	}

	async function deleteAccount(id: number) {
        const { error } = await supabase.from("accounts").delete().eq("id", id);
        if (error) {
            console.error("Error deleting account:", error);
            return;
        }
        await fetchAccounts();
    }

	// Fetch accounts on component load
	fetchAccounts();
</script>

<main class="flex flex-col bg-gray-900 p-4">
	<div class="bg-white p-4 mt-4 rounded shadow-lg">
		<div class="flex justify-between items-center">
			<h2 class="text-left text-xl font-bold border-b border-gray-300 pb-2">
				Accounts
			</h2>
			<button
				class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
				on:click={addAccount}
			>
				Add Account
			</button>
		</div>
		<table class="table-auto w-full mt-4">
			<thead>
				<tr>
					<th class="px-4 py-2">ID</th>
					<th class="px-4 py-2">Email</th>
					<th class="px-4 py-2">Warehouse</th>
					<th class="px-4 py-2">Supplier</th>
					<th class="px-4 py-2">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.table as account (account.id)}
					<tr>
						<td class="border px-4 py-2">{account.id}</td>
						<td class="border px-4 py-2">
							<input
								type="text"
								class="border p-1"
								bind:value={account.username}
								on:change={() => updateAccount(account.id, { username: account.username })}
							/>
						</td>
						<td class="border px-4 py-2">
							<input
								type="checkbox"
								bind:checked={account.isWarehouse}
								on:change={() => updateAccount(account.id, { isWarehouse: account.isWarehouse })}
							/>
						</td>
						<td class="border px-4 py-2">
							<input
								type="checkbox"
								bind:checked={account.isSupplier}
								on:change={() => updateAccount(account.id, { isSupplier: account.isSupplier })}
							/>
						</td>
						<td class="border px-4 py-2 text-right">
                            <button
                                class="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
								on:click={() => deleteAccount(account.id)}
							>
								Delete
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</main>
