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

export const entries: EntryGenerator = async () => {
    const { data: boxes, error } = await supabase
        .from("boxes")
        .select("name");
    if (error) {
        console.error("Supabase error (entries):", error);
        return [];
    }
    return (boxes || []).map(box => ({ slug: box.name }));
};

export const prerender = true;