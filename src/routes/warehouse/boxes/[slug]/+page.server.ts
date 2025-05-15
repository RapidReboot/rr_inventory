import { supabase } from "$lib/supabase";
import type { PageServerLoad } from './$types';
export const prerender = false;

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
