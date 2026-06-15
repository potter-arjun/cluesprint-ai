'use client'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface AITypingEffectProps {
  text: string
  speed?: number
  onComplete?: () => void
  className?: string
  showCursor?: boolean
}

export function AITypingEffect({
  text,
  speed = 30,
  onComplete,
  className,
  showCursor = true,
}: AITypingEffectProps) {
  const [displayed, setDisplayed] = useState('')
  const [isDone, setIsDone] = useState(false)
  const [cursorVisible, setCursorVisible] = useState(true)

  // Reset when text prop changes
  useEffect(() => {
    setDisplayed('')
    setIsDone(false)
  }, [text])

  // Typing effect
  useEffect(() => {
    if (displayed.length >= text.length) {
      setIsDone(true)
      onComplete?.()
      return
    }

    const interval = setInterval(() => {
      setDisplayed((prev) => {
        const next = text.slice(0, prev.length + 1)
        if (next.length >= text.length) {
          clearInterval(interval)
          setIsDone(true)
          onComplete?.()
        }
        return next
      })
    }, speed)

    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed, displayed.length])

  // Blinking cursor
  useEffect(() => {
    if (isDone && !showCursor) return
    const blink = setInterval(() => {
      setCursorVisible((v) => !v)
    }, 530)
    return () => clearInterval(blink)
  }, [isDone, showCursor])

  return (
    <span className={cn('inline', className)}>
      {displayed}
      {showCursor && (
        <span
          className={cn(
            'inline-block w-[2px] h-[1.1em] align-text-bottom ml-[1px]',
            'bg-blue-400 transition-opacity duration-100',
            cursorVisible ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
    </span>
  )
}

export default AITypingEffect
