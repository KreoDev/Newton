"use client"

import type { ChecklistItem } from "@/types/testing"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface TestingChecklistItemProps {
  item: ChecklistItem
  isChecked: (itemId: string) => boolean
  toggleItem: (itemId: string) => void
  level?: number // Nesting level for visual indentation
}

export function TestingChecklistItem({ item, isChecked, toggleItem, level = 0 }: TestingChecklistItemProps) {
  const checked = isChecked(item.id)

  return (
    <div className={cn("space-y-2", level > 0 && "ml-6 mt-2")}>
      {/* Main checkbox item */}
      <label
        htmlFor={item.id}
        className={cn(
          "flex items-start gap-3 py-3 px-2 rounded-md transition-colors cursor-pointer touch-manipulation",
          "hover:bg-accent/50 active:bg-accent/70",
          checked && "opacity-60"
        )}
      >
        <Checkbox
          id={item.id}
          checked={checked}
          onCheckedChange={() => toggleItem(item.id)}
          className="mt-0.5 w-6 h-6 flex-shrink-0" // Large touch target
        />
        <span className={cn("text-base leading-relaxed select-none", checked && "line-through text-muted-foreground")}>{item.text}</span>
      </label>

      {/* Nested children */}
      {item.children && item.children.length > 0 && (
        <div className="space-y-1">
          {item.children.map(child => (
            <TestingChecklistItem key={child.id} item={child} isChecked={isChecked} toggleItem={toggleItem} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
