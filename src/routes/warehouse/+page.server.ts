import { supabase } from "$lib/supabase";

export async function load() {
  const { data: table, error } = await supabase.from("warehouse").select();

  if (error) {
    console.error("Supabase error:", error);
  }

  return { table: table ?? [] };
}
