<script lang="ts">
	export let data: { boxes: { id: number; name: string; count: number;}[] };
	import { goto } from '$app/navigation';
    import { base } from '$app/paths';

	function goToBox(boxName: string) {
		goto(`${base}/warehouse/boxes/${boxName}`);
	}
</script>

<main class="flex flex-col bg-gray-900 p-4">
    <div class="bg-white p-4 mt-4 rounded shadow-lg">
        <div class="flex justify-between items-center">
            <h2 class="text-left text-xl font-bold border-b border-gray-300 pb-2">
                Box Submission
            </h2>
        </div>
	</div>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        {#each data.boxes as box}
          <button class="bg-green-500 text-white rounded-lg shadow-md p-6 flex flex-col items-center hover:bg-green-600 transition" on:click={() => goToBox(box.name)}>
            <h3 class="text-lg font-semibold mb-2">{box.name}</h3>
            <span class="text-2xl font-bold">{box.count}</span>
          </button>
        {/each}
    </div>
</main>
