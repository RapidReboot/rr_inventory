<script lang="ts">
  import { supabase } from '$lib/supabase';
  export let data: { box: { id: number; name: string; count: number } };
  let showConfirm = false;

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
</main>
