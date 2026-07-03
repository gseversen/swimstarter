// ponytail: Wire up when auth is needed.
// Expected env vars (Vite exposes VITE_-prefixed vars to the client):
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY
//
// import { createClient } from "@supabase/supabase-js";
// export const supabase = createClient(
//   import.meta.env.VITE_SUPABASE_URL,
//   import.meta.env.VITE_SUPABASE_ANON_KEY,
// );

export const supabase = null;
