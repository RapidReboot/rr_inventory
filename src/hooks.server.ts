import "$lib/supabase"
import { supabase } from "$lib/supabase";
import { createSupabaseServerClient } from "@supabase/auth-helpers-sveltekit"
import type { Handle } from "@sveltejs/kit"

export const handle: Handle = async ({ event, resolve }) => {
	const session = await supabase.auth.getSession();

	event.locals.sb = supabase
	event.locals.session = session

	return resolve(event)
}
