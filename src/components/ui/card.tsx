import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card" className={cn("glass-surface glass-layer-gradient text-card-foreground flex flex-col gap-2 rounded-2xl border border-[var(--glass-border-soft)] p-3 shadow-[var(--glass-shadow-lg)] transition-all hover:-translate-y-1 hover:glass-shadow-hover", className)} {...props} />
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 has-data-[slot=card-action]:grid-cols-[1fr_auto] p-2 rounded-sm backdrop-blur-[var(--glass-blur-sm)]", className)} {...props} />
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-title" className={cn("leading-tight font-semibold tracking-tight drop-shadow-sm", className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-muted-foreground text-sm", className)} {...props} />
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-action" className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)} {...props} />
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-2", className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center px-2", className)} {...props} />
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }
