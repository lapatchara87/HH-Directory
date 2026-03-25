import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const ALLOWED_DOMAINS = ['huahed.com', 'procandid.com']

export function isAllowedDomain(email) {
  if (!email) return false
  const domain = email.split('@')[1]
  return ALLOWED_DOMAINS.includes(domain)
}
