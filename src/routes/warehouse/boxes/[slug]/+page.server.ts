import { supabase } from "$lib/supabase";
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const { slug } = params;
  const { data: box, error } = await supabase
    .from("boxes")
    .select()
    .eq('name', slug)
    .single();

  if (error) {
    console.error("Supabase error:", error);
  }

  return { box };
};

import type { EntryGenerator } from './$types';

export const entries: EntryGenerator = () => {
	return [
        { slug: 'Arm' },
        { slug: 'Leg' },
        { slug: 'Group Test' },
	];
};

export const prerender = true;