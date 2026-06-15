'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ScoreDisplayProps {
  score: number
  previousScore?: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showChange?: boolean
}

const sizeConfig = {
  sm: 'text-lg font-bold',
  md: 'text-2xl font-bold',
  lg: 'text-4xl font-extrabold',
  xl: 'text-6xl font-extrabold',
}

interface FloatingDelta {
  id: number
  delta: number
}

export default function ScoreDisplay({
  score,
  previousScore,
  size = 'md',
  showChange = true,
}: ScoreDisplayProps) {
  const [floaters, setFloaters] = useState<FloatingDelta[]>([])
  const idRef = useRef(0)
  const prevRef = useRef(previousScore ?? score)

  useEffect(() => {
    const prev = prevRef.current
    const delta = score - prev
    prevRef.current = score

    if (showChange && delta !== 0) {
      const id = ++idRef.current
      setFloaters((f) => [...f, { id, delta }])
      const t = setTimeout(() => {
        setFloaters((f) => f.filter((x) => x.id !== id))
      }, 1400)
      return () => clearTimeout(t)
    }
  }, [score, showChange])

  const isLarge = size === 'lg' || size === 'xl'

  return (
    <div className="relative inline-flex flex-col items-center">
      {/* Score value */}
      <motion.span
        key={score}
        initial={{ scale: 1.15, opacity: 0.7 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
        className={cn(
          sizeConfig[size],
          isLarge
            ? 'bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent'
            : 'text-white'
        )}
      >
        {score.toLocaleString()}
      </motion.span>

      {/* Floating delta badges */}
      <AnimatePresence>
        {floaters.map(({ id, delta }) => (
          <motion.span
            key={id}
            initial={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            animate={{ opacity: 0, y: -40, x: 0, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className={cn(
              'absolute -top-1 left-1/2 -translate-x-1/2',
              'text-sm font-bold pointer-events-none whitespace-nowrap',
              delta > 0 ? 'text-emerald-400' : 'text-red-400'
            )}
          >
            {delta > 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString()}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  )
}
