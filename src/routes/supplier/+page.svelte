<script lang="ts">
    import { supabase } from '$lib/supabase';

    let suppliers: { id: number; name: string; product: string; contact: string }[] = [];
    let products: { id: number; name: string, on_hand: number, needed: number }[] = [];

    async function fetchSuppliers() {
        const { data: supplierList, error } = await supabase.from("suppliers").select("id, name, product, contact");
        if (error) {
            console.error("Error fetching suppliers:", error);
            return;
        }
        suppliers = supplierList || [];
    }

    async function fetchProducts() {
        const { data: productList, error } = await supabase.from("products").select("id, name, on_hand, needed");
        if (error) {
            console.error("Error fetching products:", error);
            return;
        }
        products = productList || [];
    }

    async function addSupplier() {
        const { data: newSupplier, error } = await supabase
            .from("suppliers")
            .insert([{ name: "New Supplier", product: "", contact: "New Contact" }])
            .select()
            .single();

        if (error) {
            console.error("Error adding supplier:", error);
            return;
        }

        suppliers = [...suppliers, newSupplier];
    }

    async function updateSupplier(id: number, updatedFields: { name?: string; product?: string; contact?: string }) {
        const { error } = await supabase.from("suppliers").update(updatedFields).eq("id", id);
        if (error) {
            console.error("Error updating supplier:", error);
            return;
        }
    }

    async function deleteSupplier(id: number) {
        const { error } = await supabase.from("suppliers").delete().eq("id", id);
        if (error) {
            console.error("Error deleting supplier:", error);
            return;
        }

        suppliers = suppliers.filter((supplier) => supplier.id !== id);
    }

    function calculateInventoryLevel(productName: string): string {
        const product = products.find((p) => p.name === productName);
        if (!product || product.needed === 0) return "N/A";

        const ratio = product.on_hand / product.needed;
        if (ratio >= 0.75) return "High";
        if (ratio >= 0.5) return "Moderate";
        return "Low";
    }

    async function requestShipment(productName: string) {
        const amount = parseInt(prompt(`How much of ${productName} would you like to request?`) || "0", 10);
        if (isNaN(amount) || amount <= 0) {
            alert("Invalid amount entered.");
            return;
        }

        const { error } = await supabase
            .from("supplier_shipment")
            .insert([{ name: productName, amount }]);

        if (error) {
            console.error("Error requesting shipment:", error);
            alert("Failed to request shipment.");
            return;
        }

        alert(`Successfully requested ${amount} of ${productName}.`);
    }

    // Fetch suppliers and products on component load
    fetchSuppliers();
    fetchProducts();
</script>

<main class="flex flex-col bg-gray-900 p-4">
    <div class="bg-white p-4 mt-4 rounded shadow-lg">
        <div class="flex justify-between items-center">
            <h2 class="text-left text-xl font-bold border-b border-gray-300 pb-2">
                Suppliers
            </h2>
            <button
                class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                on:click={addSupplier}
            >
                Add Supplier
            </button>
        </div>
        <table class="table-auto w-full mt-4">
            <thead>
                <tr>
                    <th class="px-4 py-2">ID</th>
                    <th class="px-4 py-2">Name</th>
                    <th class="px-4 py-2">Product</th>
                    <th class="px-4 py-2">Contact</th>
                    <th class="px-4 py-2">Inventory Level</th>
					<th class="px-4 py-2">Actions</th>

                </tr>
            </thead>
            <tbody>
                {#each suppliers as supplier (supplier.id)}
                    <tr>
                        <td class="border px-4 py-2">{supplier.id}</td>
                        <td class="border px-4 py-2">
                            <input
                                type="text"
                                class="border p-1"
                                bind:value={supplier.name}
                                on:change={() => updateSupplier(supplier.id, { name: supplier.name })}
                            />
                        </td>
                        <td class="border px-4 py-2">
                            <select
                                class="border p-1"
                                bind:value={supplier.product}
                                on:change={() => updateSupplier(supplier.id, { product: supplier.product })}
                            >
                                <option value="" disabled>Select a product</option>
                                {#each products as product}
                                    <option value={product.name}>{product.name}</option>
                                {/each}
                            </select>
                        </td>
                        <td class="border px-4 py-2">
                            <input
                                type="text"
                                class="border p-1"
                                bind:value={supplier.contact}
                                on:change={() => updateSupplier(supplier.id, { contact: supplier.contact })}
                            />
                        </td>
						<td 
                            class="border px-4 py-2"
                            style="background-color: {calculateInventoryLevel(supplier.product) === 'Low' ? 'orange' : calculateInventoryLevel(supplier.product) === 'Moderate' ? 'teal' : 'green'}"
                        >
                            {calculateInventoryLevel(supplier.product)}
                        </td>
                        <td class="border px-4 py-2 text-center">
                            <div class="flex justify-center space-x-2">
                                <button
                                    class="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded"
                                    on:click={() => requestShipment(supplier.product)}
                                >
                                    Request Shipment
                                </button>
                                <button
                                class="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                                on:click={() => deleteSupplier(supplier.id)}
                            >
                                Delete
                            </button>

                            </div>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</main>
