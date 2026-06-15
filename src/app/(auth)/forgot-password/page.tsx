'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Loader2, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})
type FormData = z.infer<typeof schema>

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const [authError, setAuthError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const supabase = createClient()

  async function onSubmit(data: FormData) {
    setAuthError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
    })
    if (error) {
      setAuthError(error.message)
      return
    }
    setSentEmail(data.email)
    setSuccess(true)
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <motion.div
        className="glass-card w-full max-w-md mx-auto p-10 text-center shadow-2xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-6"
          style={{ boxShadow: '0 0 30px rgba(6,182,212,0.35)' }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.15 }}
        >
          <CheckCircle2 className="w-10 h-10 text-white" />
        </motion.div>

        <h2 className="text-2xl font-bold text-white mb-2">Reset link sent!</h2>
        <p className="text-slate-400 text-sm mb-1">
          We&apos;ve emailed a password reset link to
        </p>
        <p className="text-blue-400 font-semibold text-sm mb-6 break-all">{sentEmail}</p>
        <p className="text-slate-500 text-xs mb-8">
          Follow the link in that email to set a new password. The link expires in 1 hour.
          <br />
          <span className="mt-1 inline-block">
            Didn&apos;t receive it? Check your spam folder or{' '}
            <button
              onClick={() => setSuccess(false)}
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
            >
              try again
            </button>
            .
          </span>
        </p>

        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-sm transition-all duration-200 glow-blue"
        >
          Back to Sign In
        </Link>
      </motion.div>
    )
  }

  // ── Request form ───────────────────────────────────────────────────────────
  return (
    <motion.div
      className="glass-card w-full max-w-md mx-auto p-8 shadow-2xl"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 mb-4 glow-cyan">
          <KeyRound className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Forgot your password?</h1>
        <p className="text-slate-400 text-sm max-w-xs mx-auto">
          No worries — enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {/* Error alert */}
      {authError && (
        <motion.div
          className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {authError}
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-slate-300 text-sm">
            Email address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@company.com"
              className="pl-10 bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-red-400 text-xs">{errors.email.message}</p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 glow-blue disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending reset link…
            </span>
          ) : (
            'Send Reset Link'
          )}
        </Button>
      </form>

      {/* Back link */}
      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-slate-500 text-sm hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>
      </div>
    </motion.div>
  )
}
