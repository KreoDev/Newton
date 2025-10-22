import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold tracking-[0.04em] uppercase transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-[var(--glass-blur-sm)]", {
  variants: {
    variant: {
      default: "border-[color:oklch(0.9_0.02_260/_0.6)] bg-[oklch(0.97_0.01_260/_0.85)] text-[color:oklch(0.38_0.02_260)] shadow-[var(--glass-shadow-xs)] dark:border-white/20 dark:bg-white/10 dark:text-white",
      secondary: "border-[color:oklch(0.76_0.12_220/_0.55)] bg-[oklch(0.92_0.08_220/_0.78)] text-[color:oklch(0.4_0.12_220)] shadow-[var(--glass-shadow-xs)] dark:border-sky-400/60 dark:bg-sky-500/20 dark:text-sky-100",
      destructive: "border-[color:oklch(0.66_0.17_25/_0.55)] bg-[oklch(0.9_0.15_30/_0.78)] text-[color:oklch(0.42_0.18_25)] shadow-[var(--glass-shadow-xs)] dark:border-rose-500/60 dark:bg-rose-500/20 dark:text-rose-50",
      warning: "border-[color:oklch(0.75_0.16_85/_0.55)] bg-[oklch(0.94_0.12_85/_0.82)] text-[color:oklch(0.46_0.16_85)] shadow-[var(--glass-shadow-xs)] dark:border-amber-400/60 dark:bg-amber-500/20 dark:text-amber-50",
      success: "border-[color:oklch(0.74_0.16_150/_0.55)] bg-[oklch(0.93_0.14_150/_0.82)] text-[color:oklch(0.44_0.16_150)] shadow-[var(--glass-shadow-xs)] dark:border-emerald-400/65 dark:bg-emerald-500/20 dark:text-emerald-50",
      info: "border-[color:oklch(0.75_0.14_225/_0.55)] bg-[oklch(0.92_0.12_225/_0.82)] text-[color:oklch(0.42_0.14_225)] shadow-[var(--glass-shadow-xs)] dark:border-blue-400/60 dark:bg-blue-500/20 dark:text-blue-100",
      neutral: "border-[color:oklch(0.85_0.01_260/_0.55)] bg-[oklch(0.96_0.01_260/_0.82)] text-[color:oklch(0.42_0.01_260)] shadow-[var(--glass-shadow-xs)] dark:border-white/25 dark:bg-white/15 dark:text-white/80",
      outline: "border-[color:oklch(0.85_0_0/_0.5)] text-[color:oklch(0.42_0_0)] shadow-[var(--glass-shadow-xs)] dark:border-white/25 dark:text-white",
      purple: "border-[color:oklch(0.72_0.16_290/_0.55)] bg-[oklch(0.9_0.12_290/_0.82)] text-[color:oklch(0.4_0.16_290)] shadow-[var(--glass-shadow-xs)] dark:border-purple-400/60 dark:bg-purple-500/20 dark:text-purple-100",
      orange: "border-[color:oklch(0.74_0.16_50/_0.55)] bg-[oklch(0.92_0.14_50/_0.82)] text-[color:oklch(0.42_0.16_50)] shadow-[var(--glass-shadow-xs)] dark:border-orange-400/60 dark:bg-orange-500/20 dark:text-orange-100",
      lime: "border-[color:oklch(0.76_0.16_130/_0.55)] bg-[oklch(0.92_0.14_130/_0.82)] text-[color:oklch(0.42_0.16_130)] shadow-[var(--glass-shadow-xs)] dark:border-lime-400/60 dark:bg-lime-500/20 dark:text-lime-100",
      pink: "border-[color:oklch(0.74_0.16_350/_0.55)] bg-[oklch(0.92_0.14_350/_0.82)] text-[color:oklch(0.42_0.16_350)] shadow-[var(--glass-shadow-xs)] dark:border-pink-400/60 dark:bg-pink-500/20 dark:text-pink-100",
      rose: "border-[color:oklch(0.72_0.16_10/_0.55)] bg-[oklch(0.91_0.14_10/_0.82)] text-[color:oklch(0.42_0.16_10)] shadow-[var(--glass-shadow-xs)] dark:border-rose-400/60 dark:bg-rose-500/20 dark:text-rose-100",
      fuchsia: "border-[color:oklch(0.72_0.18_320/_0.55)] bg-[oklch(0.9_0.15_320/_0.82)] text-[color:oklch(0.4_0.18_320)] shadow-[var(--glass-shadow-xs)] dark:border-fuchsia-400/60 dark:bg-fuchsia-500/20 dark:text-fuchsia-100",
      teal: "border-[color:oklch(0.74_0.14_190/_0.55)] bg-[oklch(0.92_0.12_190/_0.82)] text-[color:oklch(0.42_0.14_190)] shadow-[var(--glass-shadow-xs)] dark:border-teal-400/60 dark:bg-teal-500/20 dark:text-teal-100",
      cyan: "border-[color:oklch(0.76_0.14_210/_0.55)] bg-[oklch(0.93_0.12_210/_0.82)] text-[color:oklch(0.42_0.14_210)] shadow-[var(--glass-shadow-xs)] dark:border-cyan-400/60 dark:bg-cyan-500/20 dark:text-cyan-100",
      indigo: "border-[color:oklch(0.7_0.16_270/_0.55)] bg-[oklch(0.88_0.14_270/_0.82)] text-[color:oklch(0.38_0.16_270)] shadow-[var(--glass-shadow-xs)] dark:border-indigo-400/60 dark:bg-indigo-500/20 dark:text-indigo-100",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
