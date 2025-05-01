import { createClient } from "@supabase/supabase-js"

// Create a single supabase client for interacting with your database
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(supabaseUrl, supabaseAnonKey)
}

// Client-side singleton to avoid multiple instances
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient()
  }
  return supabaseInstance
}

// Server-side client (always creates a fresh instance)
export const getSupabaseServerClient = () => {
  return createSupabaseClient()
}

// Types for user progress
export type UserProgress = {
  id?: number
  user_id: string
  completed_words: Record<number, string[]>
  current_level: number
  last_updated?: string
}
