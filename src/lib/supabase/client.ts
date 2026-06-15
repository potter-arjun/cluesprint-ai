'use client'
import { createBrowserClient } from '@supabase/ssr'
import { type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// @supabase/ssr 0.5.2 returns SupabaseClient<DB, SchemaName, Schema> but
// supabase-js 2.108.1 SupabaseClient added a new 2nd type param
// (SchemaNameOrClientOptions), shifting Schema to the wrong slot → never.
// Cast to SupabaseClient<Database> so TypeScript uses the correct defaults.
export function createClient(): SupabaseClient<Database> {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as unknown as SupabaseClient<Database>
}
