'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Zap, Loader2, Users, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Suspense } from 'react'

function JoinForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [code, setCode] = useState(searchParams.get('code') ?? '')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // If already logged in with a real account, redirect away
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !session.user.is_anonymous) {
        router.push('/dashboard')
      }
    })
  }, [router, supabase])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !code.trim()) return
    setError(null)
    setLoading(true)

    try {
      // Sign in anonymously — creates a real Supabase session with no email/password
      const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously()
      if (anonError || !anonData.user) throw new Error(anonError?.message ?? 'Sign-in failed')

      const res = await fetch('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase(), name: name.trim() }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)

      router.push(`/events/${json.eventId}/mission`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />

      <motion.div
        className="glass-card w-full max-w-md mx-auto p-8 shadow-2xl relative z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 mb-4 glow-blue">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Join the Game</h1>
          <p className="text-slate-400 text-sm">Enter your name and the event code to start playing</p>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleJoin} className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">Your Name</Label>
            <Input
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={loading}
              autoFocus
              className="bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
            />
          </div>

          {/* Code */}
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">Event Join Code</Label>
            <Input
              placeholder="e.g. 88FSUW"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              disabled={loading}
              className="bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500 font-mono tracking-widest text-lg text-center uppercase"
              maxLength={10}
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !name.trim() || !code.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 glow-blue disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Joining…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Users className="w-4 h-4" />
                Join Game
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-6">
          No account required &bull; Just your name and the code
        </p>
      </motion.div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinForm />
    </Suspense>
  )
}
