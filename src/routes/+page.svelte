<script lang="ts">
	import { base } from '$app/paths';
    import { supabase } from '$lib/supabase';
	import { writable, derived } from 'svelte/store';
	import { onMount } from 'svelte';

	let inventoryLevel = 'Moderate';
	interface EventHistoryRow {
	  date: string;
	  account: string;
	  product: string;
	  amount: number;
	  tracking: string;
	  type: 'shipment' | 'box';
	}

	let shipmentHistory = writable<EventHistoryRow[]>([]);

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

	onMount(async () => {
		calculateInventoryLevel();

		// Fetch all shipments for event history
		const { data: shipments, error: shipmentsError } = await supabase
			.from('shipments')
			.select('*')
			.order('created_at', { ascending: false });

		// Fetch all box history for event history
		const { data: boxHistory, error: boxHistoryError } = await supabase
			.from('box_history')
			.select('*')
			.order('created_at', { ascending: false });

		let mergedHistory: EventHistoryRow[] = [];
		if (!shipmentsError && shipments) {
			mergedHistory = shipments.map(row => ({
				date: row.created_at,
				account: row.supplier,
				product: row.product,
				amount: row.amount,
				tracking: row.tracking_number || '',
				type: 'shipment' as const
			}));
		}
		if (!boxHistoryError && boxHistory) {
			const boxEvents = boxHistory.map(row => ({
				date: row.created_at,
				account: row.account,
				product: row.product,
				amount: row.amount,
				tracking: '',
				type: 'box' as const
			}));
			mergedHistory = [...mergedHistory, ...boxEvents];
		}
		mergedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
		shipmentHistory.set(mergedHistory);
	});

	const groupedShipmentHistory = derived(shipmentHistory, ($shipmentHistory) => {
		const groups: Record<string, any[]> = {};
		$shipmentHistory.forEach(row => {
			const dateKey = row.date ? new Date(row.date).toLocaleString() : 'Unknown';
			if (!groups[dateKey]) groups[dateKey] = [];
			groups[dateKey].push(row);
		});
		return Object.entries(groups).map(([date, rows]) => ({ date, rows }));
	});
</script>

<main class="flex flex-col">
		<p
			class="text-2xl text-center text-black font-semibold mt-2 p-4 rounded mt-8"
			style="background-color: {inventoryLevel === 'Low' ? 'orange' : inventoryLevel === 'Moderate' ? 'teal' : 'green'}"
		>
			Inventory Level: {inventoryLevel}
		</p>
		<div class="grid grid-cols-3 gap-2 mt-3 place-items-center w-full">
			<a href="{base}/suppliers" class="w-full h-40 bg-lime-600 hover:bg-lime-700 text-white font-bold text-xl py-4 px-6 rounded flex justify-center items-center">
				Suppliers
			</a>
			<a href="{base}/products" class="w-full h-40 bg-lime-600 hover:bg-lime-700 text-white font-bold text-xl py-4 px-6 rounded flex justify-center items-center">
				Products
			</a>
			<a href="{base}/warehouse" class="w-full h-40 bg-lime-600 hover:bg-lime-700 text-white font-bold text-xl py-4 px-6 rounded flex justify-center items-center">
				Warehouse
			</a>
		</div>

		<!-- Event History Section -->
		<div class="mt-4 bg-gray-800 rounded-lg shadow-lg p-4 max-w-full w-full">
			<h2 class="text-white text-xl font-semibold mb-2">Event History</h2>
			<div class="overflow-x-auto overflow-y-auto max-h-50">
				<table class="w-full text-xs text-white">
					<thead>
						<tr>
							<th class="text-left font-semibold pb-1">Date</th>
							<th class="text-left font-semibold pb-1">Account</th>
							<th class="text-left font-semibold pb-1">Product</th>
							<th class="text-left font-semibold pb-1">Amount</th>
							<th class="text-left font-semibold pb-1">Tracking #</th>
						</tr>
					</thead>
					<tbody>
					{#if $shipmentHistory.length === 0}
						<tr><td colspan="5" class="text-white/70 text-sm py-4 text-center">No shipments yet.</td></tr>
					{/if}
					{#if $shipmentHistory.length > 0}
						{#each $groupedShipmentHistory as group}
							<tr><td colspan="5" class="p-0"><hr class="my-2 border-lime-400 w-full h-1" style="border: none; background: #84cc16; height: 3px; width: 100%; margin: 0;" /></td></tr>
							{#each group.rows as row, i}
								<tr>
									{#if i === 0}
										<td class="py-1" rowspan={group.rows.length}>{group.date}</td>
									{/if}
									<td class="pr-2 py-1">{row.account}</td>
									<td class="pr-2 py-1">{row.product}</td>
									<td class="pr-2 py-1">{row.amount}</td>
									{#if i === 0}
										<td class="py-1" rowspan={group.rows.length}>{row.tracking}</td>
									{/if}
								</tr>
							{/each}
						{/each}
					{/if}
				</tbody>
				</table>
			</div>
		</div>
	</main>
