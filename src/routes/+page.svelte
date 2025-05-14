<script lang="ts">
	import { base } from '$app/paths';
    import { supabase } from '$lib/supabase';

	let inventoryLevel = 'Moderate';

	async function calculateInventoryLevel() {
		const { data, error } = await supabase
			.from('products')
			.select('on_hand, needed');

		if (error) {
			console.error('Error fetching inventory data:', error);
			return;
		}

		if (data && data.length > 0) {
			const totalLevels = data.reduce(
				(acc, product) => acc + (product.on_hand / product.needed),
				0
			);
			const averageLevel = totalLevels / data.length;

			if (averageLevel < 0.5) {
				inventoryLevel = 'Low';
			} else if (averageLevel < 1) {
				inventoryLevel = 'Moderate';
			} else {
				inventoryLevel = 'High';
			}
		}
	}

	calculateInventoryLevel();
</script>

<main class="flex flex-col p-4">

	
		<p
			class="text-2xl text-center text-black font-semibold mt-2 p-4 rounded mt-8"
			style="background-color: {inventoryLevel === 'Low' ? 'orange' : inventoryLevel === 'Moderate' ? 'teal' : 'green'}"
		>
			Inventory Level: {inventoryLevel}
		</p>

		<div class="grid grid-cols-2 gap-2 mt-8 place-items-center w-full">
			<a href="{base}/supplier" class="w-full h-70 bg-lime-700 hover:bg-lime-800 text-white font-bold text-xl py-4 px-6 rounded flex justify-center items-center">
				Suppliers
			</a>
			<a href="{base}/products" class="w-full h-70 bg-lime-700 hover:bg-lime-800 text-white font-bold text-xl py-4 px-6 rounded flex justify-center items-center">
				Products
			</a>
			<a href="{base}/shipments" class="w-full h-70 bg-lime-700 hover:bg-lime-800 text-white font-bold text-xl py-4 px-6 rounded flex justify-center items-center">
				Shipments
			</a>
			<a href="{base}/warehouse" class="w-full h-70 bg-lime-700 hover:bg-lime-800 text-white font-bold text-xl py-4 px-6 rounded flex justify-center items-center">
				Warehouse
			</a>
			
		</div>
</main>
