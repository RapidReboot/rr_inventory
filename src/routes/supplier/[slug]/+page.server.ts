import { supabase } from "$lib/supabase";
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const { slug } = params;
  const { data: supplier, error } = await supabase
    .from("suppliers")
    .select()
    .eq('name', slug)
    .single();

  if (error) {
    console.error("Supabase error:", error);
  }

  return { supplier };
};

import type { EntryGenerator } from './$types';

export const entries: EntryGenerator = async () => {
    const { data: supplier, error } = await supabase
        .from("suppliers")
        .select("name");
    if (error) {
        console.error("Supabase error (entries):", error);
        return [];
    }
    return (supplier || []).map(supplier => ({ slug: supplier.name }));
};

export const prerender = true;