<script lang="ts">
    import { supabase } from '$lib/supabase';

	export let data: { warehouse: { id: number; name: string; tracking_number: string; }[] };

    let products: { id: number; name: string }[] = [];

	async function addProduct() {
	const { data: newProduct, error } = await supabase
		.from("warehouse")
		.insert([{ 
			name: "Product Name", 
			tracking_number: "Tracking Number", 
		}])
		.select()
		.single();

	if (error) {
		console.error("Error adding user:", error);
		return;
	}

	data = { ...data, warehouse: [...data.warehouse, newProduct] };
	}

	async function submitShipment() {
    const { data: warehouseProducts, error: fetchError } = await supabase.from("warehouse").select("*");
    if (fetchError) {
        console.error("Error fetching warehouse products:", fetchError);
        return;
    }

    if (!warehouseProducts || warehouseProducts.length === 0) {
        console.error("No products in the warehouse to submit.");
        return;
    }

    const shipmentNumber = Math.min(...warehouseProducts.map((product) => product.id));

    const shipmentData = warehouseProducts.map((product) => ({
        name: product.name,
        tracking_number: product.tracking_number,
        shipment_number: shipmentNumber,
    }));

    const { error: insertError } = await supabase.from("warehouse_shipment").insert(shipmentData);
    if (insertError) {
        console.error("Error adding products to warehouse_shipment:", insertError);
        return;
    }

    const productCounts = warehouseProducts.reduce((counts, product) => {
        counts[product.name] = (counts[product.name] || 0) + 1;
        return counts;
    }, {});

    for (const [productName, count] of Object.entries(productCounts) as [string, number][]) {
        const { data: productData, error: fetchProductError } = await supabase
            .from("products")
            .select("on_hand, group_products")
            .eq("name", productName)
            .single();

        if (fetchProductError) {
            continue;
        }

        const newOnHand = (productData?.on_hand || 0) - count;

        const { error: updateError } = await supabase
            .from("products")
            .update({ on_hand: newOnHand })
            .eq("name", productName);

        if (updateError) {
        }

        if (productData?.group_products) {
            for (const groupProductName of productData.group_products) {
                const { data: groupProductData, error: fetchGroupError } = await supabase
                    .from("products")
                    .select("on_hand")
                    .eq("name", groupProductName)
                    .single();

                if (fetchGroupError) {
                    continue;
                }

                const newGroupOnHand = (groupProductData?.on_hand || 0) - count;

                const { error: updateGroupError } = await supabase
                    .from("products")
                    .update({ on_hand: newGroupOnHand })
                    .eq("name", groupProductName);

                if (updateGroupError) {
                }
            }
        }
    }

    const { error: deleteError } = await supabase.from("warehouse").delete().neq("name", null);
    if (deleteError) {
        console.error("Error clearing warehouse:", deleteError);
        return;
    }

    await fetchWarehouse();
}

	async function fetchWarehouse() {
		const { data: warehouse, error } = await supabase.from("warehouse").select("*");
		if (error) {
			console.error("Error fetching warehouse:", error);
			return;
		}
		data.warehouse = warehouse;
	}

    async function fetchProducts() {
        const { data: productList, error } = await supabase.from("products").select("id, name");
        if (error) {
            console.error("Error fetching products:", error);
            return;
        }
        products = productList || [];
    }

    async function updateProduct(id: number, updatedFields: { name?: string; tracking_number?: string }) {
        const { error } = await supabase.from("warehouse").update(updatedFields).eq("id", id);
        if (error) {
            console.error("Error updating account:", error);
            return;
        }
    }

    async function deleteProduct(id: number) {
        const { error } = await supabase.from("warehouse").delete().eq("id", id);
        if (error) {
            console.error("Error deleting product:", error);
            return;
        }
        await fetchWarehouse();
    }

	let showSubmitConfirmation = false;
	let shipmentSummary: { name: string; quantity: number }[] = [];

	async function confirmSubmit() {
		const productCounts: Record<string, number> = {};

		data.warehouse.forEach((product) => {
			if (product.name) {
				productCounts[product.name] = (productCounts[product.name] || 0) + 1;
			}
		});

		shipmentSummary = Object.entries(productCounts).map(([name, quantity]) => ({
			name,
			quantity,
		}));

		showSubmitConfirmation = true;
	}

	function cancelSubmit() {
		showSubmitConfirmation = false;
	}

	async function handleSubmit() {
		showSubmitConfirmation = false;
		await submitShipment();
	}


	// Fetch accounts on component load
	fetchWarehouse();
    fetchProducts();
</script>

<main class="flex flex-col bg-gray-900 p-4">
    <div class="bg-white p-4 mt-4 rounded shadow-lg">
        <div class="flex justify-between items-center">
            <h2 class="text-left text-xl font-bold border-b border-gray-300 pb-2">
                Warehouse Shipment
            </h2>
            <div class="flex space-x-2">
                <button
                    class="bg-lime-600 hover:bg-lime-700 text-white font-bold py-2 px-4 rounded"
                    on:click={confirmSubmit}
                >
                    Submit Shipment
                </button>
                <button
                    class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    on:click={addProduct}
                >
                    Add Product
                </button>
            </div>
        </div>
		<table class="table-auto w-full mt-4">
			<thead>
				<tr>
                    <th class="px-4 py-2">ID</th>
					<th class="px-4 py-2">Product</th>
					<th class="px-4 py-2">Tracking Number</th>
					<th class="px-4 py-2">Actions</th>

				</tr>
			</thead>
			<tbody>
				{#each data.warehouse as product (product.id)}
					<tr>
						<td class="border px-4 py-2">{product.id}</td>
						<td class="border px-4 py-2">
                            <select
                                class="border p-1"
                                bind:value={product.name}
                                on:change={() => updateProduct(product.id, { name: product.name })}
                            >
                                <option value="" disabled>Select a product</option>
                                {#each products as prod}
                                    <option value={prod.name}>{prod.name}</option>
                                {/each}
                            </select>
						</td>
						<td class="border px-4 py-2">
							<input
								type="text"
								class="border p-1"
								bind:value={product.tracking_number}
                                on:change={() => updateProduct(product.id, { tracking_number: product.tracking_number })}
							/>
						</td>
						<td class="border px-4 py-2 text-right">
                            <button
                                class="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                                on:click={() => deleteProduct(product.id)}
                            >
                                Delete
                            </button>
                        </td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

    {#if showSubmitConfirmation}
        <div class="fixed inset-0 flex items-center justify-center">
            <div class="bg-white p-6 rounded shadow-lg text-center">
                <p class="mb-4 text-lg font-semibold">
                    Are you sure you want to submit this shipment? This action cannot be undone.
                </p>
                <div class="mb-4">
                    <h3 class="font-bold mb-2">Shipment Summary:</h3>
                    <ul class="text-left">
                        {#each shipmentSummary as item}
                            <li>{item.name}: {item.quantity}</li>
                        {/each}
                    </ul>
                </div>
                <div class="flex justify-center gap-4">
                    <button
                        class="bg-lime-600 hover:bg-lime-700 text-white font-bold py-2 px-4 rounded"
                        on:click={handleSubmit}
                    >
                        Yes, Submit
                    </button>
                    <button
                        class="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded"
                        on:click={cancelSubmit}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    {/if}
</main>
