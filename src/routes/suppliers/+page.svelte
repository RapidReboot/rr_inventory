<script lang="ts">
	import { base } from '$app/paths';
    import { supabase } from '$lib/supabase';

    let suppliers: { id: number; name: string; products: string[]; contact: string }[] = [];
    let products: { id: number; name: string, on_hand: number, needed: number }[] = [];
    let openDropdownSupplierId: number | null = null;


    async function fetchSuppliers() {
        const { data: supplierList, error } = await supabase.from("suppliers").select("id, name, products, contact");
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
            .insert([{ name: "New Supplier", products: [], contact: "New Contact" }])
            .select()
            .single();

        if (error) {
            console.error("Error adding supplier:", error);
            return;
        }

        suppliers = [...suppliers, newSupplier];
    }

    async function updateSupplier(
        id: number,
        updatedFields: { name?: string; products?: string[]; contact?: string }
    ) {
        // Lowercase the name if it is being updated
        if (updatedFields.name) {
            updatedFields.name = updatedFields.name.toLowerCase();
        }
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
                        <td class="border px-4 py-2 relative">
                <div>
                    <button
                        class="border p-1 bg-gray-100 rounded w-full text-left"
                        on:click={() => openDropdownSupplierId = openDropdownSupplierId === supplier.id ? null : supplier.id}
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={openDropdownSupplierId === supplier.id}
                    >
                        {#if supplier.products.length > 0}
                            {supplier.products.join(', ')}
                        {:else}
                            Select products...
                        {/if}
                    </button>
                    {#if openDropdownSupplierId === supplier.id}
                        <div class="absolute z-10 bg-white border rounded shadow-lg mt-1 w-full max-h-40 overflow-auto" role="listbox">
                            {#each products as product}
                                <button
                                    type="button"
                                    class="px-2 py-1 cursor-pointer hover:bg-blue-100 flex items-center w-full text-left"
                                    style="background-color: {supplier.products.includes(product.name) ? '#d1fae5' : 'transparent'}"
                                    on:click={() => {
                                        if (supplier.products.includes(product.name)) {
                                            supplier.products = supplier.products.filter(p => p !== product.name);
                                        } else {
                                            supplier.products = [...supplier.products, product.name];
                                        }
                                        updateSupplier(supplier.id, { products: supplier.products });
                                    }}
                                    on:keydown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            if (supplier.products.includes(product.name)) {
                                                supplier.products = supplier.products.filter(p => p !== product.name);
                                            } else {
                                                supplier.products = [...supplier.products, product.name];
                                            }
                                            updateSupplier(supplier.id, { products: supplier.products });
                                        }
                                    }}
                                    role="option"
                                    aria-selected={supplier.products.includes(product.name)}
                                    tabindex="0"
                                >
                                    <input
                                        type="checkbox"
                                        checked={supplier.products.includes(product.name)}
                                        readonly
                                        class="mr-2 pointer-events-none"
                                        tabindex="-1"
                                    />
                                    {product.name}
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>
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
                style="background-color: {calculateInventoryLevel(supplier.products[0]) === 'Low' ? 'orange' : calculateInventoryLevel(supplier.products[0]) === 'Moderate' ? 'teal' : 'green'}"
            >
                {calculateInventoryLevel(supplier.products[0])}
            </td>
            <td class="border px-4 py-2 text-center">
                <div class="flex justify-center space-x-2">
                    <button
                        class="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded"
                        on:click={() => window.open(`${base}/supplier/${supplier.name}`)}
                    >
                        Visit Site
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
