"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto rounded-lg">
      <table data-slot="table" className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn("backdrop-blur-[var(--glass-blur-sm)]", className)} {...props} />
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0 divide-y divide-[var(--glass-border-soft)]", className)} {...props} />
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return <tfoot data-slot="table-footer" className={cn("bg-[oklch(1_0_0_/_0.2)] border-t font-medium backdrop-blur-[var(--glass-blur-sm)] [&>tr]:last:border-b-0 glass-inner-soft", className)} {...props} />
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-[oklch(1_0_0_/_0.18)] border-b transition-all duration-200",
        // Selected row styling - reusable across all tables
        "data-[state=selected]:bg-[oklch(0.7_0.1_240_/_0.12)]", // Subtle blue tint with 12% opacity
        "data-[state=selected]:border-l-2",
        "data-[state=selected]:border-l-primary/40",
        "data-[state=selected]:shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.2)]", // Inner border glow
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return <th data-slot="table-head" className={cn("text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap backdrop-blur-[var(--glass-blur-sm)] [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className)} {...props} />
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap backdrop-blur-[var(--glass-blur-sm)]",
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        // Cell-level hover effect with border
        "hover:bg-[oklch(1_0_0_/_0.22)] hover:shadow-[inset_0_0_0_1px_oklch(0.922_0_0_/_0.75)]",
        "transition-all duration-150",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return <caption data-slot="table-caption" className={cn("text-muted-foreground mt-4 text-sm backdrop-blur-[var(--glass-blur-sm)]", className)} {...props} />
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }
