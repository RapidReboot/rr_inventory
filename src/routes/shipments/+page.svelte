<script lang="ts">
	import { onMount } from 'svelte';
	import { createClient } from '@supabase/supabase-js';
    import { supabase } from '$lib/supabase';

	type Shipment = { id: string; name: string; tracking_number: string; shipment_number: string; created_at: string };
	let shipments: Shipment[] = [];
	let groupedShipments: Record<string, Shipment[]> = {}; // Explicitly typed

	onMount(async () => {
		const { data, error } = await supabase.from('warehouse_shipment').select('*');
		if (error) {
			console.error('Error fetching shipments:', error);
		} else {
			shipments = data as Shipment[]; // Ensure data is typed correctly
			groupedShipments = shipments.reduce((acc: Record<string, Shipment[]>, shipment) => {
				if (!acc[shipment.shipment_number]) acc[shipment.shipment_number] = [];
				acc[shipment.shipment_number].push(shipment);
				return acc;
			}, {});
		}
	});

	function formatDate(timestamp: string): string {
		const date = new Date(timestamp);
		return date.toLocaleDateString();
	}

	async function refreshShipments() {
		const { data, error } = await supabase.from('warehouse_shipment').select('*');
		if (error) {
			console.error('Error refreshing shipments:', error);
		} else {
			shipments = data as Shipment[];
			groupedShipments = shipments.reduce((acc: Record<string, Shipment[]>, shipment) => {
				if (!acc[shipment.shipment_number]) acc[shipment.shipment_number] = [];
				acc[shipment.shipment_number].push(shipment);
				return acc;
			}, {});
		}
	}

	async function deleteShipmentWarehouse(shipmentNumber: string) {
		const { error } = await supabase.from('warehouse_shipment').delete().eq('shipment_number', shipmentNumber);
		if (error) {
			console.error('Error deleting shipments:', error);
		} else {
			await refreshShipments(); // Refresh shipments after deletion
		}
	}

	async function deleteShipmentSupplier(shipmentId: string) {

        // Delete the shipment after it is fulfilled
        const { error: deleteError } = await supabase
            .from('supplier_shipment')
            .delete()
            .eq('id', shipmentId);

        if (deleteError) {
            console.error('Error deleting shipment:', deleteError);
            return;
        }

        await fetchSupplierShipments(); // Refresh supplier shipments after marking fulfilled
	}


	type SupplierShipment = { id: string; name: string; amount: number; created_at: string };
    let supplierShipments: SupplierShipment[] = [];

    async function fetchSupplierShipments() {
        const { data, error } = await supabase.from('supplier_shipment').select('*');
        if (error) {
            console.error('Error fetching supplier shipments:', error);
        } else {
            supplierShipments = data as SupplierShipment[];
        }
    }

    onMount(() => {
        fetchSupplierShipments();
    });

    async function markShipmentFulfilled(shipmentId: string, orderAmount: number, productName: string) {
        // Fetch the current on_hand value using the product name
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('on_hand')
            .eq('name', productName)
            .single();

        if (fetchError || !product) {
            console.error('Error fetching product on_hand value:', fetchError);
            return;
        }

        // Update the on_hand value
        const newOnHand = product.on_hand + orderAmount;
        const { error: productError } = await supabase
            .from('products')
            .update({ on_hand: newOnHand })
            .eq('name', productName);

        if (productError) {
            console.error('Error updating product on_hand:', productError);
            return;
        }

        // Delete the shipment after it is fulfilled
        const { error: deleteError } = await supabase
            .from('supplier_shipment')
            .delete()
            .eq('id', shipmentId);

        if (deleteError) {
            console.error('Error deleting shipment:', deleteError);
            return;
        }

        await fetchSupplierShipments(); // Refresh supplier shipments after marking fulfilled
    }
</script>

<main class="flex flex-col bg-gray-900 p-4">
	<div class=" p-4 mt-4 rounded shadow-lg">
		<div class="grid grid-cols-2 gap-8"> <!-- Increased gap between columns -->
			<div class="bg-white p-4 rounded shadow-md">
				<h2 class="text-left text-xl font-bold border-b border-gray-300 pb-2">
					Supplier Shipments
				</h2>
				
				{#each supplierShipments as shipment}
                    <div class="border border-gray-300 rounded p-4 mt-4 relative">
                        <h3 class="font-bold text-lg">Name: {shipment.name}</h3>
                        <span class="absolute top-2 right-2 text-sm text-gray-500">
                            {formatDate(shipment.created_at)}
                        </span>
                        <p class="mt-2"><strong>Order Amount:</strong> {shipment.amount}</p>
						<div class="absolute bottom-2 right-2 flex flex-col gap-2">
							<button
								class="bg-lime-600 hover:bg-lime-700 text-white px-2 py-1 rounded"
								on:click={() => markShipmentFulfilled(shipment.id, shipment.amount, shipment.name)}
							>
								Shipment Fulfilled
							</button>
							<button
								class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
								on:click={() => deleteShipmentSupplier(shipment.id)}
							>
								Delete Shipment
							</button>
						</div>
                    </div>
                {/each}
			</div>
			<div class="bg-white p-4 rounded shadow-md">
				<h2 class="text-left text-xl font-bold border-b border-gray-300 pb-2">
					Customer Shipments
				</h2>
				{#each Object.entries(groupedShipments) as [shipmentNumber, shipments]}
					<div class="border border-gray-300 rounded p-4 mt-4 relative">
						<h3 class="font-bold text-lg">Shipment Number: {shipmentNumber}</h3>
						<span class="absolute top-2 right-2 text-sm text-gray-500">
							{formatDate(shipments[0].created_at)}
						</span>
						<p><strong>Total Items:</strong> {shipments.length}</p>
						<p><strong>Products Included:</strong></p>
						<ul class="list-disc ml-4">
						{#each Object.entries(shipments.reduce((acc: Record<string, number>, shipment) => {
							acc[shipment.name] = (acc[shipment.name] || 0) + 1;
							return acc;
						}, {})) as [productName, quantity]}
							<li>{productName}: {quantity}</li>
						{/each}
					</ul>
					<button
							class="absolute bottom-2 right-2 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
							on:click={() => deleteShipmentWarehouse(shipmentNumber)}
						>
							Delete
						</button>
					</div>
				{/each}
			</div>
		</div>
</main>
