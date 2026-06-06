import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const envError = !supabaseUrl || !supabaseKey
	? 'Missing Vite env vars: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY. Restart dev server after editing .env.'
	: null;

if (envError) {
	console.error(envError);
}

const createBrokenClient = (message) => ({
	from() {
		throw new Error(message);
	},
});

export const supabase = envError
	? createBrokenClient(envError)
	: createClient(supabaseUrl, supabaseKey);

export const supabaseConfigError = envError;
