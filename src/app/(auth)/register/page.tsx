'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Loader2,
  Zap,
  Gamepad2,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ─── Schema ───────────────────────────────────────────────────────────────────
const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
    terms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  })

type RegisterFormData = z.infer<typeof registerSchema>
type Role = 'player' | 'admin'

// ─── Role card ────────────────────────────────────────────────────────────────
function RoleCard({
  role,
  selected,
  onSelect,
}: {
  role: Role
  selected: boolean
  onSelect: () => void
}) {
  const isPlayer = role === 'player'
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
        selected
          ? isPlayer
            ? 'border-blue-500 bg-blue-500/10 glow-blue'
            : 'border-purple-500 bg-purple-500/10 glow-purple'
          : 'border-slate-700 bg-slate-900/40 hover:border-slate-600'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          selected
            ? isPlayer
              ? 'bg-blue-600'
              : 'bg-purple-600'
            : 'bg-slate-800'
        }`}
      >
        {isPlayer ? (
          <Gamepad2 className="w-5 h-5 text-white" />
        ) : (
          <ShieldCheck className="w-5 h-5 text-white" />
        )}
      </div>
      <div>
        <p
          className={`font-semibold text-sm ${
            selected ? (isPlayer ? 'text-blue-300' : 'text-purple-300') : 'text-slate-300'
          }`}
        >
          {isPlayer ? "I'm a Player" : "I'm an Admin"}
        </p>
        <p className="text-slate-500 text-xs mt-0.5">
          {isPlayer ? 'Join events & hunt clues' : 'Create & manage events'}
        </p>
      </div>
      {selected && (
        <div className="absolute top-2 right-2">
          <CheckCircle2
            className={`w-4 h-4 ${isPlayer ? 'text-blue-400' : 'text-purple-400'}`}
          />
        </div>
      )}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [role, setRole] = useState<Role>('player')
  const [authError, setAuthError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { terms: undefined as unknown as true },
  })

  const termsChecked = watch('terms')
  const supabase = createClient()

  async function onSubmit(data: RegisterFormData) {
    setAuthError(null)
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name, role },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    if (error) {
      setAuthError(error.message)
      return
    }
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
          className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-cyan-500 flex items-center justify-center mx-auto mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.15 }}
        >
          <CheckCircle2 className="w-10 h-10 text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2">Check your email!</h2>
        <p className="text-slate-400 text-sm mb-2">
          We sent a confirmation link to your inbox. Click it to activate your account and start your
          adventure.
        </p>
        <p className="text-slate-500 text-xs mb-8">
          Didn&apos;t receive it? Check your spam folder or{' '}
          <button
            onClick={() => setSuccess(false)}
            className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
          >
            try again
          </button>
          .
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

  // ── Registration form ──────────────────────────────────────────────────────
  return (
    <motion.div
      className="glass-card w-full max-w-md mx-auto p-8 shadow-2xl"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 mb-4 glow-blue">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
        <p className="text-slate-400 text-sm">Join the adventure today</p>
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
        {/* Full name */}
        <div className="space-y-1.5">
          <Label htmlFor="full_name" className="text-slate-300 text-sm">
            Full name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <Input
              id="full_name"
              type="text"
              autoComplete="name"
              placeholder="Ada Lovelace"
              className="pl-10 bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20"
              {...register('full_name')}
            />
          </div>
          {errors.full_name && (
            <p className="text-red-400 text-xs">{errors.full_name.message}</p>
          )}
        </div>

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
              placeholder="you@company.com"
              className="pl-10 bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-red-400 text-xs">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-slate-300 text-sm">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              className="pl-10 pr-10 bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-400 text-xs">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm_password" className="text-slate-300 text-sm">
            Confirm password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <Input
              id="confirm_password"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repeat your password"
              className="pl-10 pr-10 bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20"
              {...register('confirm_password')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirm_password && (
            <p className="text-red-400 text-xs">{errors.confirm_password.message}</p>
          )}
        </div>

        {/* Role selection */}
        <div className="space-y-2">
          <Label className="text-slate-300 text-sm">I am joining as…</Label>
          <div className="flex gap-3">
            <RoleCard role="player" selected={role === 'player'} onSelect={() => setRole('player')} />
            <RoleCard role="admin" selected={role === 'admin'} onSelect={() => setRole('admin')} />
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            role="checkbox"
            aria-checked={!!termsChecked}
            onClick={() => setValue('terms', termsChecked ? (undefined as unknown as true) : true, { shouldValidate: true })}
            className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded flex items-center justify-center border-2 transition-all duration-150 ${
              termsChecked
                ? 'bg-blue-600 border-blue-600'
                : 'bg-transparent border-slate-600 hover:border-slate-400'
            }`}
          >
            {termsChecked && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <label className="text-slate-400 text-sm leading-relaxed cursor-pointer select-none" onClick={() => setValue('terms', termsChecked ? (undefined as unknown as true) : true, { shouldValidate: true })}>
            I agree to the{' '}
            <Link href="/terms" className="text-blue-400 hover:text-blue-300 transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors">
              Privacy Policy
            </Link>
          </label>
        </div>
        {errors.terms && (
          <p className="text-red-400 text-xs -mt-3">{errors.terms.message}</p>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 glow-blue disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating account…
            </span>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-slate-500 text-sm mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-400 font-medium hover:text-blue-300 transition-colors">
          Sign in
        </Link>
      </p>
    </motion.div>
  )
}
