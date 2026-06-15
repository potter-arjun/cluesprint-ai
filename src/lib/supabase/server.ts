import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

// @supabase/ssr 0.5.2 returns SupabaseClient<DB, SchemaName, Schema> but
// supabase-js 2.108.1 added SchemaNameOrClientOptions as the 2nd type param,
// shifting Schema to the wrong slot → Schema = never inside SupabaseClient.
// Cast to SupabaseClient<Database> so TypeScript uses the correct defaults.
export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — cookies are read-only
            // The middleware is responsible for refreshing sessions in that case
          }
        },
      },
    }
  ) as unknown as SupabaseClient<Database>
}
