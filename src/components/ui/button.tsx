import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:pointer-events-none disabled:opacity-50 active:scale-95',
  {
    variants: {
      variant: {
        default:     'bg-blue-600 text-white shadow hover:bg-blue-500 glow-blue',
        destructive: 'bg-red-600 text-white shadow hover:bg-red-500',
        outline:     'border border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white hover:border-slate-500',
        secondary:   'bg-violet-700 text-white shadow hover:bg-violet-600 glow-purple',
        ghost:       'text-slate-300 hover:bg-slate-800 hover:text-white',
        link:        'text-blue-400 underline-offset-4 hover:underline hover:text-blue-300',
        cyber:       'bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-500 text-white shadow-lg hover:opacity-90 hover:shadow-xl',
        glow:        'bg-cyan-600 text-white shadow hover:bg-cyan-500 glow-cyan',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm:      'h-8 rounded-md px-3 text-xs',
        lg:      'h-12 rounded-lg px-6 text-base',
        xl:      'h-14 rounded-xl px-8 text-lg',
        icon:    'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  ref?: React.Ref<HTMLButtonElement>
}

function Button({ className, variant, size, asChild = false, ref, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
}
Button.displayName = 'Button'

export { Button, buttonVariants }
