// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/auth-helpers-sveltekit';

declare global {
	namespace App {
		interface Locals {
			sb: SupabaseClient;
			session: Session | null;
		}
	}
}

export {};
