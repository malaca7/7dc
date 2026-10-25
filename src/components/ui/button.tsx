import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-neutral-100 text-neutral-900 shadow-sm hover:bg-neutral-200 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200',
        destructive:
          'bg-red-600 text-neutral-50 shadow-sm hover:bg-red-700 dark:bg-red-900/60 dark:text-red-100 dark:border dark:border-red-800 dark:hover:bg-red-900',
        outline:
          'border border-neutral-200 bg-transparent shadow-sm hover:bg-neutral-100 text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900/40 dark:hover:bg-neutral-800 dark:text-neutral-100',
        secondary:
          'bg-neutral-100 text-neutral-900 shadow-sm hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800 dark:border dark:border-neutral-800',
        ghost:
          'hover:bg-neutral-100 text-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-neutral-100',
        link: 'text-neutral-900 underline-offset-4 hover:underline dark:text-neutral-100',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
