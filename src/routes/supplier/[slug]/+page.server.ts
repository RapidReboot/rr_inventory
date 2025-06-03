import { supabase } from "$lib/supabase";

import type { EntryGenerator, PageServerLoad } from './$types';

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
