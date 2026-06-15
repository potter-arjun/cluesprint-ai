import * as React from 'react'
import { cn } from '@/lib/utils'

function Card({ className, ref, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      className={cn('rounded-xl border border-slate-700/50 bg-slate-800/50 text-slate-100 shadow-lg', className)}
      {...props}
    />
  )
}
Card.displayName = 'Card'

function CardHeader({ className, ref, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
}
CardHeader.displayName = 'CardHeader'

function CardTitle({ className, ref, ...props }: React.HTMLAttributes<HTMLHeadingElement> & { ref?: React.Ref<HTMLHeadingElement> }) {
  return (
    <h3
      ref={ref}
      className={cn('text-xl font-semibold leading-none tracking-tight text-white', className)}
      {...props}
    />
  )
}
CardTitle.displayName = 'CardTitle'

function CardDescription({ className, ref, ...props }: React.HTMLAttributes<HTMLParagraphElement> & { ref?: React.Ref<HTMLParagraphElement> }) {
  return <p ref={ref} className={cn('text-sm text-slate-400', className)} {...props} />
}
CardDescription.displayName = 'CardDescription'

function CardContent({ className, ref, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
}
CardContent.displayName = 'CardContent'

function CardFooter({ className, ref, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
}
CardFooter.displayName = 'CardFooter'

function GlassCard({ className, ref, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      className={cn('glass-card text-slate-100 shadow-lg', className)}
      {...props}
    />
  )
}
GlassCard.displayName = 'GlassCard'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, GlassCard }
