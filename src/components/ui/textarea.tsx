import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  ref?: React.Ref<HTMLTextAreaElement>
}

function Textarea({ className, ref, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white',
        'placeholder:text-slate-500',
        'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'resize-none transition-colors scrollbar-thin',
        className
      )}
      ref={ref}
      {...props}
    />
  )
}
Textarea.displayName = 'Textarea'

export { Textarea }
