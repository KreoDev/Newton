"use client"

import type { ChecklistSubsection } from "@/types/testing"
import { TestingChecklistItem } from "./TestingChecklistItem"
import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface TestingSubsectionProps {
  subsection: ChecklistSubsection
  isChecked: (itemId: string) => boolean
  toggleItem: (itemId: string) => void
  completedCount: number
  totalCount: number
}

export function TestingSubsection({ subsection, isChecked, toggleItem, completedCount, totalCount }: TestingSubsectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="border-l-2 border-border/40 pl-4 my-4">
      {/* Subsection header (collapsible) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full py-2 px-3 rounded-md hover:bg-accent/50 transition-colors touch-manipulation mb-2"
      >
        <div className="flex items-center gap-3">
          <ChevronDown
            className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200", !isExpanded && "-rotate-90")}
          />
          <h4 className="font-semibold text-lg text-left">
            {subsection.id} {subsection.title}
          </h4>
        </div>
        <span className="text-sm text-muted-foreground font-medium">
          {completedCount}/{totalCount}
        </span>
      </button>

      {/* Items */}
      {isExpanded && (
        <div className="space-y-1">
          {subsection.items.map(item => (
            <TestingChecklistItem key={item.id} item={item} isChecked={isChecked} toggleItem={toggleItem} />
          ))}
        </div>
      )}
    </div>
  )
}
