import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive backdrop-blur-md relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "glass-surface-strong glass-layer-gradient text-primary dark:text-white shadow-[var(--glass-shadow-lg)] border border-[var(--glass-border-strong)] hover:glass-shadow-hover hover:border-[var(--glass-border-floating)]",
        destructive: "glass-surface bg-[oklch(0.577_0.245_27.325_/_0.6)] text-white shadow-[var(--glass-shadow-sm)] border border-[color:oklch(0.577_0.245_27.325_/_0.55)] hover:bg-[oklch(0.577_0.245_27.325_/_0.75)] hover:border-[color:oklch(0.577_0.245_27.325_/_0.75)]",
        outline: "border border-[var(--glass-border-soft)] text-foreground hover:bg-[oklch(1_0_0_/_0.2)] hover:border-[var(--glass-border-floating)]",
        secondary: "glass-surface text-secondary-foreground dark:text-white bg-[oklch(0.92_0_0_/_0.35)] hover:bg-[oklch(0.92_0_0_/_0.45)] hover:border-[var(--glass-border-soft)]",
        ghost: "glass-surface bg-transparent text-foreground dark:text-white hover:bg-[oklch(1_0_0_/_0.18)] hover:border-[var(--glass-border-soft)]",
        link: "text-primary underline-offset-4 hover:underline hover:shadow-[0_0_0_1px_oklch(0.205_0_0_/_0.35)]",
        calendar: "border-input border bg-[oklch(1_0_0_/_0.32)] dark:bg-[oklch(1_0_260_/_0.04)] backdrop-blur-[18px] text-sm font-normal justify-start gap-2 px-3 w-full h-9 text-left",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
