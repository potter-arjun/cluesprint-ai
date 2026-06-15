'use client'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface CountdownTimerProps {
  totalSeconds: number
  onExpire?: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeConfig = {
  sm: { svgSize: 64, strokeWidth: 4, fontSize: 'text-sm', radius: 26 },
  md: { svgSize: 96, strokeWidth: 5, fontSize: 'text-lg', radius: 40 },
  lg: { svgSize: 128, strokeWidth: 6, fontSize: 'text-2xl', radius: 54 },
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function CountdownTimer({
  totalSeconds,
  onExpire,
  className,
  size = 'md',
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    setRemaining(totalSeconds)
  }, [totalSeconds])

  useEffect(() => {
    if (remaining <= 0) {
      onExpireRef.current?.()
      return
    }

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onExpireRef.current?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining <= 0])

  const { svgSize, strokeWidth, fontSize, radius } = sizeConfig[size]
  const circumference = 2 * Math.PI * radius
  const pct = totalSeconds > 0 ? remaining / totalSeconds : 0
  const dashOffset = circumference * (1 - pct)

  const colorClass =
    pct > 0.6
      ? 'text-emerald-400'
      : pct > 0.3
      ? 'text-amber-400'
      : 'text-red-400'

  const strokeColor =
    pct > 0.6 ? '#34d399' : pct > 0.3 ? '#fbbf24' : '#f87171'

  const isPulsing = pct < 0.3 && remaining > 0

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={svgSize}
        height={svgSize}
        className={cn('-rotate-90', isPulsing && 'animate-pulse')}
      >
        {/* Track */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s ease',
            filter: `drop-shadow(0 0 6px ${strokeColor})`,
          }}
        />
      </svg>
      {/* Time label */}
      <span
        className={cn(
          'absolute font-mono font-bold tabular-nums',
          fontSize,
          colorClass,
          isPulsing && 'animate-pulse'
        )}
      >
        {formatTime(remaining)}
      </span>
    </div>
  )
}

export default CountdownTimer
