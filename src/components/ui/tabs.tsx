"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-2", className)} {...props} />
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List data-slot="tabs-list" className={cn("glass-surface glass-layer-gradient inline-flex h-10 w-fit items-center justify-center rounded-xl p-1 text-muted-foreground gap-1", className)} {...props} />
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-transparent px-3 text-sm font-medium uppercase tracking-wide transition-all disabled:pointer-events-none disabled:opacity-45",
        "text-muted-foreground hover:text-foreground hover:glass-shadow-hover [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1",
        "data-[state=active]:text-primary dark:data-[state=active]:text-white data-[state=active]:border-primary/40 dark:data-[state=active]:border-[var(--glass-border-floating)] data-[state=active]:shadow-[var(--glass-shadow-lg)] data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 dark:data-[state=active]:from-white/20 dark:data-[state=active]:to-white/5",
        "data-[state=active]:after:absolute data-[state=active]:after:inset-0 data-[state=active]:after:rounded-[inherit] data-[state=active]:after:bg-primary/30 data-[state=active]:after:opacity-20 dark:data-[state=active]:after:bg-white/15 data-[state=active]:after:blur-lg",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("flex-1 outline-none", className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
