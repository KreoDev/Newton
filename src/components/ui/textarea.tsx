import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-sm transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-45",
        "border-input border bg-[oklch(1_0_0_/_0.32)] dark:bg-[oklch(1_0_260_/_0.04)] backdrop-blur-[18px] focus-visible:shadow-[var(--glass-shadow-hover)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
