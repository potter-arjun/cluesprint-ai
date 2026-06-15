'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  glow?: 'blue' | 'purple' | 'cyan' | 'none'
  hover?: boolean
  onClick?: () => void
}

const glowStyles: Record<NonNullable<GlassCardProps['glow']>, string> = {
  blue: 'shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_35px_rgba(37,99,235,0.5)]',
  purple: 'shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_35px_rgba(124,58,237,0.5)]',
  cyan: 'shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)]',
  none: '',
}

const glowBorder: Record<NonNullable<GlassCardProps['glow']>, string> = {
  blue: 'border-blue-500/30',
  purple: 'border-purple-500/30',
  cyan: 'border-cyan-500/30',
  none: 'border-slate-700/50',
}

export function GlassCard({
  children,
  className,
  glow = 'none',
  hover = true,
  onClick,
}: GlassCardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hover ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        'rounded-xl border bg-slate-800/60 backdrop-blur-md',
        'transition-shadow duration-300',
        glowBorder[glow],
        glowStyles[glow],
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </motion.div>
  )
}

export default GlassCard
