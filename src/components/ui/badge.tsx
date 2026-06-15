import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-blue-500/30 bg-blue-500/20 text-blue-300',
        secondary:
          'border-violet-500/30 bg-violet-500/20 text-violet-300',
        destructive:
          'border-red-500/30 bg-red-500/20 text-red-300',
        outline:
          'border-slate-600 text-slate-300 bg-transparent',
        success:
          'border-green-500/30 bg-green-500/20 text-green-300',
        gold:
          'border-amber-500/30 bg-amber-500/20 text-amber-300',
        cyber:
          'border-transparent bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-500 text-white',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
