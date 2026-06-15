import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4',
  {
    variants: {
      variant: {
        default:     'border-blue-500/30 bg-blue-500/10 text-blue-200 [&>svg]:text-blue-400',
        destructive: 'border-red-500/30 bg-red-500/10 text-red-200 [&>svg]:text-red-400',
        warning:     'border-amber-500/30 bg-amber-500/10 text-amber-200 [&>svg]:text-amber-400',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

function Alert({
  className,
  variant,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants> & {
    ref?: React.Ref<HTMLDivElement>
  }) {
  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}
Alert.displayName = 'Alert'

function AlertTitle({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { ref?: React.Ref<HTMLHeadingElement> }) {
  return (
    <h5
      ref={ref}
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    />
  )
}
AlertTitle.displayName = 'AlertTitle'

function AlertDescription({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { ref?: React.Ref<HTMLParagraphElement> }) {
  return (
    <div
      ref={ref}
      className={cn('text-sm [&_p]:leading-relaxed opacity-90', className)}
      {...props}
    />
  )
}
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription }
