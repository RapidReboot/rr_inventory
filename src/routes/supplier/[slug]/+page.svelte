<script lang="ts">
  import type { User } from '@supabase/supabase-js';
	import { onMount } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import { supabase } from '$lib/supabase';
	import { base } from '$app/paths';
	import { page } from '$app/stores';
  export let data: {
    supplier: { id: number; name: string; products: string[]; contact: string; };
  };

  let productInventory = writable<Record<string, { on_hand: number; needed: number; image: string; weight: number;}>>({});
	let user = writable<User | null>(null);
	let isAdmin = writable(false);
  let shipmentHistory = writable<any[]>([]);
  let availableProducts = writable([...data.supplier.products]);
  let cartProducts = writable<string[]>([]);
  let dragItem: string | null = null;
  let dragOrigin: 'available' | 'cart' | null = null;
  let email = '';
  let password = '';
  let error = '';
  error = '';
  $: $page.data.user && user.set($page.data.user);


  onMount(async () => {
    const {
      data: { session },
      error: sessionError
		} = await supabase.auth.getSession();

		if (sessionError) {
			console.error("Error getting session:", sessionError.message);
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


				isAdmin.set(!!accounts?.isWarehouse && !!accounts?.isSupplier);
			};

			fetchRoles();
		}
    
    const { data: products, error } = await supabase
    .from('products')
    .select('name, on_hand, needed, image, weight');

    if (error || !products || !Array.isArray(products)) {
      console.error('Failed to load inventory:', error?.message || 'No products found');
        return;
  }

  const inventoryMap: Record<string, { on_hand: number; needed: number; image: string; weight: number }> = {};
  for (const p of products) {
    if (p && p.name) {
      inventoryMap[p.name] = {
        on_hand: p.on_hand,
        needed: p.needed,
        image: p.image,
        weight: p.weight,
      };
    }
  }
  productInventory.set(inventoryMap);

  // Fetch shipment history for this supplier
  const { data: shipments, error: shipmentsError } = await supabase
    .from('shipments')
    .select('*')
    .eq('supplier', data.supplier.name)
    .order('created_at', { ascending: false });
  if (!shipmentsError && shipments) {
    shipmentHistory.set(shipments);
  }
  });

  async function handleLogin() {      
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

      window.location.reload();

  }


  function handleDragStart(item: string, origin: 'available' | 'cart') {
    dragItem = item;
    dragOrigin = origin;
  }

  function handleDropToCart() {
    if (!dragItem || dragOrigin === 'cart') return;

    availableProducts.update(items => items.filter(i => i !== dragItem));
    cartProducts.update(items => [...items, dragItem!]);

    dragItem = null;
    dragOrigin = null;
  }

  function handleDropToAvailable() {
    if (!dragItem || dragOrigin === 'available') return;

    cartProducts.update(items => items.filter(i => i !== dragItem));
    availableProducts.update(items => [...items, dragItem!]);

    dragItem = null;
    dragOrigin = null;
  }

  function allowDrop(event: DragEvent) {
    event.preventDefault();
  }

  
  function printCart() {
    let cartSnapshot: string[] = [];
    let inventorySnapshot: Record<string, { on_hand: number; needed: number; image: string; weight: number }> = {};

    // Get current cart and inventory values
    cartProducts.subscribe(cart => { cartSnapshot = cart; })();
    productInventory.subscribe(inv => { inventorySnapshot = inv; })();

    // Build printable HTML
    let totalWeight = cartSnapshot.reduce((sum, product) => {
      const inv = inventorySnapshot[product] || { needed: 0, on_hand: 0, weight: 0 };
      const quantity = (inv.needed ?? 0) - (inv.on_hand ?? 0);
      return sum + (quantity * (inv.weight ?? 0));
    }, 0);
    let html = `
      <html>
        <head>
          <title>Shipment Details</title>
          <style>
            body { font-family: Arial, sans-serif; color: #222; margin: 40px; }
            h1 { color: #166534; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #888; padding: 8px 12px; text-align: left; }
            th { background: #e2e8f0; }
            tr:nth-child(even) { background: #f7fafc; }
          </style>
        </head>
        <body>
          <h1>Shipment Details</h1>
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Weight (lbs)</th>
              </tr>
            </thead>
            <tbody>
              ${cartSnapshot.map(product => {
                const inv = inventorySnapshot[product] || { needed: 0, on_hand: 0, weight: 0 };
                const quantity = (inv.needed ?? 0) - (inv.on_hand ?? 0);
                return `<tr><td>${product}</td><td>${quantity}</td><td>${inv.weight ?? 0}</td></tr>`;
              }).join('')}
            </tbody>
          </table>
          <h2 style="margin-top: 30px; color: #166534;">Total Weight: ${totalWeight} lbs</h2>
          <p style="margin-top: 30px;">Printed: ${new Date().toLocaleString()}</p>
        </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } else {
      alert('Unable to open print window. Please allow popups for this site.');
    }
  }

  function submitShipment() {
    let cartSnapshot: string[] = [];
    let inventorySnapshot: Record<string, { on_hand: number; needed: number; image: string; weight: number }> = {};
    // Get current cart and inventory values
    cartProducts.subscribe(cart => { cartSnapshot = cart; })();
    productInventory.subscribe(inv => { inventorySnapshot = inv; })();

    // Collect amounts from the number inputs
    // We'll use the DOM to get the current values
    const shipmentRows = cartSnapshot.map(product => {
      // Find the input for this product
      const input = document.querySelector(
        `input[aria-label=\"Quantity for ${product}\"]`
      ) as HTMLInputElement | null;
      let amount = 0;
      if (input) {
        amount = parseInt(input.value, 10) || 0;
      } else {
        // fallback to calculated value
        const inv = inventorySnapshot[product] || { needed: 0, on_hand: 0 };
        amount = (inv.needed ?? 0) - (inv.on_hand ?? 0);
      }
      return {
        supplier: data.supplier.name,
        product,
        amount,
        tracking_number: 0
      };
    });

    // Insert each row into the shipments table and update products.on_hand
    Promise.all(
      shipmentRows.map(async row => {
        const insertResult = await supabase.from('shipments').insert(row);
        if (!insertResult.error) {
          // Update the on_hand value for the product
          const currentOnHand = inventorySnapshot[row.product]?.on_hand ?? 0;
          const newOnHand = currentOnHand + row.amount;
          await supabase.from('products').update({ on_hand: newOnHand }).eq('name', row.product);
        }
        return insertResult;
      })
    ).then(results => {
      if (results.some(r => r.error)) {
        alert('Error submitting shipment.');
      } else {
        alert('Shipment submitted!');
        window.location.reload();
      }
    });
  }

  	async function logout() {
		await supabase.auth.signOut()

		window.location.reload();
	}

  let showHistory = false;

  // Group shipment history by creation time (to the minute for better grouping)
const groupedShipmentHistory = derived(shipmentHistory, ($shipmentHistory) => {
  const groups: Record<string, any[]> = {};
  $shipmentHistory.forEach(row => {
    const dateKey = row.created_at ? new Date(row.created_at).toLocaleString() : 'Unknown';
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(row);
  });
  return Object.entries(groups).map(([date, rows]) => ({ date, rows }));
});
</script>

<main class="flex bg-gray-900 text-white relative">
  {#if !$user}
    <div class="fixed inset-0 bg-opacity-60 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
     <h1 class="text-2xl font-bold text-black mb-6 text-center">Rapid Reboot Inventory</h1>
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
    </div>
  {/if}

  {#if $user && (() => {
    // Extract domain from URL (after last /)
    const url = $page.url.pathname;
    const urlDomain = url.split('/').filter(Boolean).pop()?.split('.')[0]?.toLowerCase();
    // Extract domain from email (between @ and .)
    const emailDomain = $user.email?.split('@')[1]?.split('.')[0]?.toLowerCase();
    return (urlDomain && emailDomain && urlDomain === emailDomain) || isAdmin;
  })()}
    <!-- Product Container -->
    <div 
      class="w-2/3 pr-6 overflow-y-auto" 
      style="min-height: calc(100vh - 200px);"
      on:dragover={allowDrop}
      on:drop={handleDropToAvailable}
      role="list"
    >
      <div>
        <h1 class="text-3xl text-white font-bold mb-2">
            Rapid Reboot Inventory System
        </h1>
        <p class="text-lg text-white pb-2">
          Welcome, <span class="font-semibold">{$user.email}</span>
        </p>
      </div>
      <div class="grid grid-cols-3 gap-3">
        {#each $availableProducts as product (product)}
          <div
            class="bg-gray-700 p-2 rounded-lg shadow flex flex-col items-center text-center cursor-move"
            draggable="true"
            on:dragstart={() => handleDragStart(product, 'available')}
            role="listitem"
          >
            <img 
              src={$productInventory[product]?.image || '/favicon.png'} 
              alt={product}
              class="w-full h-50 object-cover rounded mb-2"
              draggable="false"
            />
            <div class="text-sm w-full flex justify-between items-center text-white">
              <span class="truncate">{product}</span>
              <span class="text-xs text-white/80 ml-2">
                Short: {($productInventory[product]?.needed ?? 0) - ($productInventory[product]?.on_hand ?? 0)}
              </span>
            </div>
          </div>
        {/each}
      </div>

      <!-- Shipment History Popup -->
      {#if showHistory}
        <div class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div class="bg-green-900 rounded-lg p-6 max-w-2xl w-full relative shadow-lg">
            <button
              class="absolute top-2 right-2 text-white text-2xl font-bold hover:text-lime-400"
              on:click={() => showHistory = false}
              aria-label="Close"
              type="button"
            >&times;</button>
            <h3 class="text-white text-lg font-semibold mb-2">Shipment History</h3>
            {#if $shipmentHistory.length === 0}
              <div class="text-white/70 text-sm">No shipments yet.</div>
            {:else}
              <div class="overflow-x-auto max-h-96">
                <table class="w-full text-xs text-white">
                  <thead>
                    <tr>
                      <th class="text-left font-semibold pb-1">Date</th>
                      <th class="text-left font-semibold pb-1">Product</th>
                      <th class="text-left font-semibold pb-1">Amount</th>
                      <th class="text-left font-semibold pb-1">Tracking #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each $groupedShipmentHistory as group}
                      <tr><td colspan="4"><hr class="my-2 border-lime-400" /></td></tr>
                      {#each group.rows as row, i}
                        <tr>
                          {#if i === 0}
                            <td class="py-1" rowspan={group.rows.length}>{group.date}</td>
                          {/if}
                          <td class="pr-2 py-1">{row.product}</td>
                          <td class="pr-2 py-1">{row.amount}</td>
                          {#if i === 0}
                            <td class="py-1" rowspan={group.rows.length}>
                              <input
                                type="text"
                                class="bg-white text-black rounded px-1 py-0.5 border border-gray-400 focus:outline-none focus:ring-2 w-24"
                                value={group.rows[0].tracking_number}
                                aria-label="Tracking number for group {group.date}"
                                on:change={async (e) => {
                                  const target = e.target as HTMLInputElement | null;
                                  if (!target) return;
                                  const newTracking = target.value;
                                  if (newTracking !== group.rows[0].tracking_number) {
                                    // Update all rows in this group
                                    const ids = group.rows.map(r => r.id);
                                    const { error } = await supabase
                                      .from('shipments')
                                      .update({ tracking_number: newTracking })
                                      .in('id', ids);
                                    if (error) {
                                      alert('Failed to update tracking number.');
                                    } else {
                                      group.rows.forEach(r => r.tracking_number = newTracking);
                                    }
                                  }
                                }}
                              />
                            </td>
                          {/if}
                        </tr>
                      {/each}
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- END Shipment History Button/Popup -->
    </div>
    <!-- Shipment Container -->
    <div
      class="fixed top-0 right-0 bottom-0 w-1/3 bg-green-800 shadow-lg flex flex-col"
      on:dragover={allowDrop}
      on:drop={handleDropToCart}
      role="list"
      aria-label="Cart"
    >
      <!-- Header -->
<div class="p-4 pt-10 flex flex-row justify-between items-start relative">
  <h2 class="text-white text-3xl mb-4 pl-4 font-semibold">Shipment</h2>

  <!-- Right-side buttons container -->
  <div class="absolute top-10 right-8 flex flex-row space-x-4 items-center z-10">
    <!-- Shipment History Button -->
    <button
      class="bg-lime-700 text-white px-4 py-2 rounded hover:bg-lime-800"
      on:click={() => showHistory = true}
      type="button"
    >
      View Shipment History
    </button>

    <!-- Logout Button -->
    <button
      type="button"
      on:click={logout}
      class="text-white font-bold flex items-center justify-center"
      aria-label="Logout"
      style="background: none; border: none; padding: 0;"
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

    <!-- Scrollable Content -->
    <div class="overflow-y-auto px-4" style="flex: 1;">
        <div class="grid grid-cols-2 gap-4 pb-4">
          {#each $cartProducts as product (product)}
            <div
              class="bg-gray-700 p-2 rounded-lg shadow flex flex-col items-center text-center cursor-move"
              draggable="true"
              on:dragstart={() => handleDragStart(product, 'cart')}
              role="listitem"
            >
              <img 
                src={$productInventory[product]?.image} 
                alt={product}
                class="w-full h-40 object-cover rounded mb-2"
                draggable="false"
              />
              <div class="text-sm w-full flex justify-between items-center text-white">
                <span class="truncate">{product}</span>
                <input
                  type="number"
                  min="0"
                  class="ml-2 w-16 text-black rounded px-1 py-0.5 border border-gray-400 focus:outline-none focus:ring-2 bg-white"
                  value={($productInventory[product]?.needed ?? 0) - ($productInventory[product]?.on_hand ?? 0)}
                  aria-label="Quantity for {product}"
                />
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 flex flex-col gap-4 bg-green-800 shadow-md">
        <button
          on:click={printCart}
          class="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500"
        >
          Print Shipment
        </button>
        <button
          on:click={submitShipment}
          class="bg-lime-600 text-black px-4 py-2 rounded hover:bg-lime-700"
        >
          Submit Shipment
        </button>
    </div>
  </div>
  {/if}
</main>
