import adapter from '@sveltejs/adapter-static';
import sveltePreprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: sveltePreprocess({
    postcss: true
  }),
  kit: {
    adapter: adapter({
			strict: false
		}),

    paths: {
      base: '/rr_inventory', // important for GitHub Pages
    }
  }
};

export default config;