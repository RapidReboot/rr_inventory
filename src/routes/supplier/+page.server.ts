import { supabase } from "$lib/supabase";

export async function load() {
  const { data: table, error } = await supabase.from("suppliers").select();

  if (error) {
    console.error("Supabase error:", error);
  }

  return { suppliers: table ?? [] };
}
