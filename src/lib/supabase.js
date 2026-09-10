import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.'
  )
}

// Main client – used by the app for the logged‑in tourist
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Secondary client with a different storage key so its auth session
// does NOT interfere with the main logged‑in user.
export const supabaseGroupsAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storageKey: 'supabase-auth-token-groups-helper'
  }
})
