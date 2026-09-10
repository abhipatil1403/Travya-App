import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://bdvyohjudxyvahicqxsj.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkdnlvaGp1ZHh5dmFoaWNxeHNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MDQwNzEsImV4cCI6MjA3NDI4MDA3MX0.71tPP2gE8qgTrbE9yDdDhBACQQejSQi1N68idoeeJ7A"

// Main client – used by the app for the logged‑in tourist
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Secondary client with a different storage key so its auth session
// does NOT interfere with the main logged‑in user.
export const supabaseGroupsAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storageKey: 'supabase-auth-token-groups-helper'
  }
})

