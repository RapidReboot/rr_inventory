<script lang="ts">
    import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';

	export let data: { products: { id: number; name: string; on_hand: number, image: string, description: string, weight: number, needed: number, group_products: string[] }[] };

    async function updateProduct(id: number, updatedFields: { name?: string; on_hand?: number; image?: string; description?: string; weight?: number, needed?: number, group_products?: string[] }) {
        if (updatedFields.image && !updatedFields.image.startsWith('http')) {
            console.error("Invalid image URL:", updatedFields.image);
            return;
        }
        const { error } = await supabase.from("products").update(updatedFields).eq("id", id);
        if (error) {
            console.error("Error updating product:", error);
            return;
        }
        // await fetchProducts();
    }

	async function addProduct() {
		const { data: newProdcut, error } = await supabase
		.from("products")
		.insert([{ 
			name: "Product Name", 
			on_hand: 0,
			needed: 0,
			image: "https://placehold.co/600x400",
			description: "Product Description",
			weight: 0.0,
			group_products: [],
		}])
		.select()
		.single();

		if (error) {
		console.error("Error adding product:", error);
		return;
		}

		data = { ...data, products: [...data.products, newProdcut] };
	}

	async function addBox() {
		const { data: newBox, error } = await supabase
		.from("boxes")
		.insert([{ 
			name: "New Box", 
			count: 0 
		}])
		.select()
		.single();

		if (error) {
		console.error("Error adding box:", error);
		return;
		}

		boxes = [...boxes, newBox];
	}

	async function fetchProducts() {
		const { data: product, error } = await supabase.from("products").select("*");
		if (error) {
			console.error("Error fetching products:", error);
			return;
		}
		data.products = product;
	}

	async function deleteProduct(id: number) {
		const { error } = await supabase.from("products").delete().eq("id", id);
		if (error) {
			console.error("Error deleting product:", error);
			return;
		}

		const updatedProducts = data.products.map(product => {
			if (product.group_products.includes(data.products.find(p => p.id === id)?.name || "")) {
				const updatedGroupProducts = product.group_products.filter(name => name !== data.products.find(p => p.id === id)?.name);
				updateProduct(product.id, { group_products: updatedGroupProducts });
				return { ...product, group_products: updatedGroupProducts };
			}
			return product;
		});

		data.products = updatedProducts.filter(product => product.id !== id);
	}

	let showDeleteConfirmation = false;
    let productToDelete: number | null = null;

    function confirmDelete(id: number) {
        showDeleteConfirmation = true;
        productToDelete = id;
    }

    function cancelDelete() {
        showDeleteConfirmation = false;
        productToDelete = null;
    }

    async function handleDelete() {
        if (productToDelete !== null) {
            await deleteProduct(productToDelete);
            showDeleteConfirmation = false;
            productToDelete = null;
        }
    }


    function addToGroupProducts(product: { id: number; group_products: string[] }, selectedProduct: string) {
        if (!product.group_products.includes(selectedProduct)) {
            const updatedGroupProducts = [...product.group_products, selectedProduct];
            updateProduct(product.id, { group_products: updatedGroupProducts }).then(() => {
                product.group_products = updatedGroupProducts;
				fetchProducts();
            });
        }
    }

	let showBoxes = false;
	let boxes: { id: number; name: string; count: number }[] = [];

	async function fetchBoxes() {
		const { data: boxList, error } = await supabase.from("boxes").select("id, name, count");
		if (error) {
			console.error("Error fetching boxes:", error);
			return;
		}
		boxes = boxList || [];
	}

	function showProductsView() {
		showBoxes = false;
	}

	function showBoxesView() {
		showBoxes = true;
		if (boxes.length === 0) fetchBoxes();
	}

	async function updateBox(id: number, updatedFields: { name?: string; count?: number }) {
        const { error } = await supabase.from("boxes").update(updatedFields).eq("id", id);
        if (error) {
            console.error("Error updating box:", error);
            return;
        }
        fetchBoxes();
    }

	function handleAdd() {
		if (showBoxes) {
			addBox();
		} else {
			addProduct();
		}
	}

	async function deleteBox(id: number) {
    const { error } = await supabase.from("boxes").delete().eq("id", id);
    if (error) {
        console.error("Error deleting box:", error);
        return;
    }
    boxes = boxes.filter(box => box.id !== id);
}

	// Fetch accounts on component load
	fetchProducts();
</script>

<main class="flex flex-col p-4">
	<div class="bg-white p-4 mt-4 rounded shadow-lg">
		<div class="flex justify-between items-center">
			<div class="flex gap-4 items-center">
				<button type="button"
					class="text-left text-xl font-bold border-b border-gray-300 pb-2 cursor-pointer bg-transparent border-0 p-0 m-0 focus:outline-none focus:underline"
					on:click={showProductsView}
					on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && showProductsView()}
					aria-pressed={!showBoxes}
					tabindex="0"
				>
					Products
				</button>
				<span class="text-xl font-bold">|</span>
				<button type="button"
					class="text-left text-xl font-bold border-b border-gray-300 pb-2 cursor-pointer bg-transparent border-0 p-0 m-0 focus:outline-none focus:underline"
					on:click={showBoxesView}
					on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && showBoxesView()}
					aria-pressed={showBoxes}
					tabindex="0"
				>
					Boxes
				</button>
			</div>
			<button
				class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
				on:click={handleAdd}
			>
				{showBoxes ? 'Add Box' : 'Add Product'}
			</button>
		</div>
		{#if showBoxes}
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
				{#each boxes as box (box.id)}
					<div class="bg-gradient-to-br from-green-400 via-green-500 to-green-600 text-white rounded-2xl shadow-xl border-2 border-green-700 p-8 flex flex-col items-center transition-transform duration-200 hover:scale-105 hover:shadow-2xl relative">
						<label class="text-lg font-semibold mb-1" for="box-name-{box.id}">Name</label>
						<select
							id="box-name-{box.id}"
							class="text-green-900 rounded-lg p-2 mb-4 w-full text-center bg-white focus:ring-2 focus:ring-green-300 border border-green-300 shadow-sm transition"
							bind:value={box.name}
							on:change={(e) => {
                                const target = e.target as HTMLSelectElement | null;
                                if (target) updateBox(box.id, { name: target.value });
                            }}
						>
							{#each data.products as product}
								<option value={product.name}>{product.name}</option>
							{/each}
						</select>
						<label class="text-lg font-semibold mb-1" for="box-count-{box.id}">Count</label>
						<input
							id="box-count-{box.id}"
							class="text-green-900 rounded-lg p-2 mb-2 w-full text-center bg-white focus:ring-2 focus:ring-green-300 border border-green-300 shadow-sm transition"
							type="number"
							bind:value={box.count}
							on:change={() => updateBox(box.id, { count: box.count })}
						/>
						<button
							class="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded shadow"
							on:click={() => deleteBox(box.id)}
						>
							Delete Box
						</button>
					</div>
				{/each}
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
				{#each data.products as product (product.id)}
					<div class="border rounded p-4 shadow-md bg-gray-100">
						<div class="relative flex justify-center items-center">
							<button 
								type="button" 
								class="w-100 h-60 rounded mb-2 p-0 border-0 bg-transparent cursor-pointer focus:outline-none"
								on:click={() => {
									const newImageUrl = prompt("Enter new image URL:", product.image);
									if (newImageUrl) {
										updateProduct(product.id, { image: newImageUrl });
										product.image = newImageUrl;
									}
								}}
							>
								<img 
									src={product.image} 
									alt={product.name} 
									class="w-full h-full object-cover rounded"
								/>
							</button>
						</div>
						<div class="flex flex-col gap-2">
							<label for="name-{product.id}" class="text-sm font-semibold">Name</label>
							<input
								id="name-{product.id}"
								type="text"
								class="border p-1"
								bind:value={product.name}
								on:change={() => updateProduct(product.id, { name: product.name })}
								placeholder="Name"
							/>
							<div class="flex gap-2">
								<div class="flex-1 flex flex-col justify-center">
									<label for="on-hand-{product.id}" class="text-sm font-semibold flex-1">On Hand</label>
									<input
										id="on-hand-{product.id}"
										type="number"
										class="border p-1"
										bind:value={product.on_hand}
										on:change={() => updateProduct(product.id, { on_hand: product.on_hand })}
										placeholder="On Hand"
									/>
	
								</div>

								<div class="flex-1 flex flex-col justify-center">

								<label for="on-hand-{product.id}" class="text-sm font-semibold flex-1">Needed</label>
								<input
									id="needed-{product.id}"
									type="number"
									class="border p-1"
									bind:value={product.needed}
									on:change={() => updateProduct(product.id, { needed: product.needed })}
									placeholder="needed"
								/>
								</div>
							</div>

							<label for="description-{product.id}" class="text-sm font-semibold">Description</label>
							<textarea
								id="description-{product.id}"
								class="border p-1"
								bind:value={product.description}
								on:change={() => updateProduct(product.id, { description: product.description })}
								placeholder="Description"
								rows="2"
							></textarea>

							<label for="group-products-{product.id}" class="text-sm font-semibold">Group Products</label>
							<div class="flex gap-2 items-center">
								<select
									class="border p-1"
									on:change={(e) => {
										const selectedProduct = (e.target as HTMLSelectElement).value;
										if (selectedProduct) {
											if (product.group_products.includes(selectedProduct)) {
												const updatedGroupProducts = product.group_products.filter(item => item !== selectedProduct);
												updateProduct(product.id, { group_products: updatedGroupProducts }).then(() => {
													product.group_products = updatedGroupProducts;
													fetchProducts();
												});
											} else {
												addToGroupProducts(product, selectedProduct);
											}
											(e.target as HTMLSelectElement).value = "";
										}
									}}
								>
									<option value="" disabled selected>Select a product</option>
									{#each data.products as otherProduct (otherProduct.id)}
										{#if otherProduct.id !== product.id}
											<option value={otherProduct.name}>{otherProduct.name}</option>
										{/if}
									{/each}
								</select>
								<input
									id="group-products-{product.id}"
									type="text"
									class="border p-1 flex-1"
									value={product.group_products.filter(item => item.trim() !== "").join(", ")}
									readonly
									placeholder="Comma-separated product names"
								/>
							</div>

							<div class="flex gap-2">
								<div class="flex-1 flex flex-col justify-center">
									<label for="weight-{product.id}" class="text-sm font-semibold">Weight</label>
									<input
										id="weight-{product.id}"
										type="number"
										class="border p-1"
										bind:value={product.weight}
										on:change={() => updateProduct(product.id, { weight: product.weight })}
										placeholder="Weight"
									/>
								</div>
								
								<button
									class="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded flex-1"
									on:click={() => confirmDelete(product.id)}
								>
									Delete
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	{#if showDeleteConfirmation}
        <div class="fixed inset-0 flex items-center justify-center">
            <div class="bg-white p-6 rounded shadow-lg text-center">
                <p class="mb-4 text-lg font-semibold">
                    Are you sure you want to delete this product? This action cannot be undone.
                </p>
                <div class="flex justify-center gap-4">
                    <button
                        class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                        on:click={handleDelete}
                    >
                        Yes, Delete
                    </button>
                    <button
                        class="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded"
                        on:click={cancelDelete}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    {/if}
</main>
