import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient<Database>(
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
              // The `set` method may throw inside a Server Component.
              // Safe to ignore — the middleware will refresh the session.
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Honour the `next` param but never allow open redirects to external URLs
      const redirectTo = next.startsWith('/') ? next : '/dashboard'
      return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
    }
  }

  // Something went wrong — send the user back to login with an error flag
  return NextResponse.redirect(
    new URL('/login?error=auth_callback_error', requestUrl.origin)
  )
}
