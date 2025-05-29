<script lang="ts">
  import { supabase } from '$lib/supabase';
  export let data: { box: { id: number; name: string; count: number } };
  import { onMount } from 'svelte';
  import QRCode from 'qrcode';
	import { writable } from 'svelte/store';
	import type { User } from '@supabase/supabase-js';
  export let text: string = `https://rapidreboot.github.io/rr_inventory/warehouse/boxes/${data.box.name}`;


	let user = writable<User | null>(null);

  let email = '';
  let password = '';
  let error = '';
  let canvas: HTMLCanvasElement;
  error = '';
  let showConfirm = false;


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

  onMount(async () => {
    // Fetch user session and user data
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

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
      const { data: accounts, error } = await supabase
        .from('accounts')
        .select('isWarehouse, isSupplier')
        .eq('username', fetchedUser.email)
        .single();

      if (error) {
        console.error("Error fetching account roles:", error);
      }
    }

    // Draw the QR code
    if (canvas && text) {
      QRCode.toCanvas(canvas, text, { width: 256 }, function (error) {
        if (error) console.error("QR Code Error:", error);
      });
    }
  });

  function printQRCode() {
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print QR Code</title>
              <style>
                body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: white; }
                img { width: 256px; height: 256px; }
              </style>
            </head>
            <body>
              <img src='${dataUrl}' />
              <script>window.onload = function() { window.print(); }<\/script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
  }

  function handleContainerClick() {
    showConfirm = true;
  }

  function closeConfirm() {
    showConfirm = false;
  }

  async function confirmRemove() {
    const { data: product, error } = await supabase
      .from('products')
      .select('on_hand')
      .eq('name', data.box.name)
      .single();
    if (error || !product) {
      console.error('Error fetching product:', error);
      showConfirm = false;
      return;
    }
    const newOnHand = (product.on_hand || 0) - data.box.count;
    const { error: updateError } = await supabase
      .from('products')
      .update({ on_hand: newOnHand })
      .eq('name', data.box.name);
    if (updateError) {
      console.error('Error updating on_hand:', updateError);
    }
    showConfirm = false;

  }
</script>

<main class="flex flex-col items-center justify-center bg-gray-900 p-4 ">
  {#if !$user}
    <div class="fixed inset-0 bg-opacity-60 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
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
  {#if $user}
    {#if data.box}
      <button type="button" class="w-full max-w-lg bg-lime-700 hover:bg-lime-800 text-white rounded-lg shadow-md p-16 flex flex-col items-center mt-10 cursor-pointer" on:click={handleContainerClick}>
        <h2 class="text-2xl font-bold mb-4">{data.box.name}</h2>
        <span class="text-4xl font-bold">{data.box.count}</span>
      </button>
      {#if showConfirm}
        <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div class="bg-white text-black rounded-lg shadow-lg p-8 flex flex-col items-center">
            <p class="mb-6 text-lg font-semibold text-center">
              Are you sure you want to remove {data.box.count} from {data.box.name}?
            </p>
            <div class="flex gap-4">
              <button class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" on:click={closeConfirm}>Cancel</button>
              <button class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded" on:click={confirmRemove}>Confirm</button>
            </div>
          </div>
        </div>
      {/if}

    {:else}
      <div class="text-white text-center mt-10">Box not found.</div>
    {/if}
    <canvas bind:this={canvas} class="mt-16 cursor-pointer" style="width: 256px; height: 256px;" on:click={printQRCode} title="Tap to print QR code"></canvas>
  {/if}
</main>
