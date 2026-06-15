'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const progressIndicatorVariants = cva('h-full w-full flex-1 transition-all duration-500 rounded-full', {
  variants: {
    variant: {
      default:     'bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.5)]',
      success:     'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]',
      destructive: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]',
      warning:     'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]',
      cyber:       'bg-gradient-to-r from-blue-500 to-violet-500 shadow-[0_0_10px_rgba(37,99,235,0.5)]',
    },
  },
  defaultVariants: { variant: 'default' },
})

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressIndicatorVariants> {
  ref?: React.Ref<React.ComponentRef<typeof ProgressPrimitive.Root>>
}

function Progress({ className, value, variant, ref, ...props }: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-slate-700', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(progressIndicatorVariants({ variant }))}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
