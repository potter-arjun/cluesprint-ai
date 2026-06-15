'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  variant?: 'fullscreen' | 'inline' | 'overlay'
  loadingText?: string
  className?: string
}

function SpinnerRing({ size }: { size: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      style={{ filter: 'drop-shadow(0 0 8px rgba(37,99,235,0.8))' }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 4}
        fill="none"
        stroke="#1e293b"
        strokeWidth={4}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 4}
        fill="none"
        stroke="url(#spinnerGrad)"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={`${Math.PI * (size - 8) * 0.75} ${Math.PI * (size - 8) * 0.25}`}
      />
      <defs>
        <linearGradient id="spinnerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
    </motion.svg>
  )
}

export function LoadingSpinner({
  variant = 'inline',
  loadingText,
  className,
}: LoadingSpinnerProps) {
  if (variant === 'fullscreen') {
    return (
      <div className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center',
        'bg-slate-900/90 backdrop-blur-sm',
        className
      )}>
        <SpinnerRing size={64} />
        {loadingText && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-slate-300 text-sm font-medium tracking-wide"
          >
            {loadingText}
          </motion.p>
        )}
      </div>
    )
  }

  if (variant === 'overlay') {
    return (
      <div className={cn(
        'absolute inset-0 z-10 flex flex-col items-center justify-center',
        'bg-slate-900/70 backdrop-blur-sm rounded-xl',
        className
      )}>
        <SpinnerRing size={48} />
        {loadingText && (
          <p className="mt-3 text-slate-300 text-sm font-medium">{loadingText}</p>
        )}
      </div>
    )
  }

  // inline (default)
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <SpinnerRing size={24} />
      {loadingText && (
        <span className="text-slate-400 text-sm">{loadingText}</span>
      )}
    </div>
  )
}

export default LoadingSpinner
