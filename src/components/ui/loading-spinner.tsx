import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  fullScreen?: boolean
  message?: string
  className?: string
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
}

export function LoadingSpinner({ size = "md", fullScreen = false, message, className }: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500/20 via-pink-500/20 to-orange-500/20 blur-xl animate-pulse" />

        {/* Glass background */}
        <div className="relative glass-surface-floating glass-layer-gradient border border-[var(--glass-border-floating)] shadow-[var(--glass-shadow-xl)] rounded-full p-4">
          <Loader2 className={cn(sizeClasses[size], "animate-spin text-primary")} />
        </div>
      </div>

      {message && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {message}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
        {spinner}
      </div>
    )
  }

  return spinner
}

// Inline loading spinner for buttons and small spaces
export function InlineSpinner({ size = "sm", className }: { size?: "sm" | "md"; className?: string }) {
  return <Loader2 className={cn(size === "sm" ? "w-4 h-4" : "w-5 h-5", "animate-spin", className)} />
}

// Skeleton loader for content placeholders
export function SkeletonLoader({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer", className)} />
  )
}
