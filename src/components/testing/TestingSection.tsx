"use client"

import type { ChecklistSection, ChecklistItem } from "@/types/testing"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { TestingSubsection } from "./TestingSubsection"
import { Badge } from "@/components/ui/badge"

interface TestingSectionProps {
  section: ChecklistSection
  isChecked: (itemId: string) => boolean
  toggleItem: (itemId: string) => void
  sectionStats: {
    total: number
    completed: number
    percentage: number
  }
}

export function TestingSection({ section, isChecked, toggleItem, sectionStats }: TestingSectionProps) {
  return (
    <Accordion type="single" collapsible defaultValue={section.id} className="w-full">
      <AccordionItem value={section.id} className="glass-surface rounded-lg px-4 mb-4">
        <AccordionTrigger className="hover:no-underline py-5">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex flex-col items-start gap-1">
              <h3 className="text-xl font-bold text-left">
                {section.id}. {section.title}
              </h3>
              {section.location && <p className="text-sm text-muted-foreground font-normal">{section.location}</p>}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {sectionStats.completed}/{sectionStats.total}
                </p>
                <p className="text-xs text-muted-foreground">{sectionStats.percentage}%</p>
              </div>
              {sectionStats.percentage === 100 && <Badge variant="success">Complete</Badge>}
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-2 pb-4">
          {section.subsections.map(subsection => {
            const subsectionStats = calculateSubsectionStats(subsection, isChecked)
            return (
              <TestingSubsection
                key={subsection.id}
                subsection={subsection}
                isChecked={isChecked}
                toggleItem={toggleItem}
                completedCount={subsectionStats.completed}
                totalCount={subsectionStats.total}
              />
            )
          })}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

/**
 * Calculate stats for a subsection
 */
function calculateSubsectionStats(subsection: any, isChecked: (id: string) => boolean): { total: number; completed: number } {
  let total = 0
  let completed = 0

  function countInItem(item: ChecklistItem): { total: number; completed: number } {
    let itemTotal = 1
    let itemCompleted = isChecked(item.id) ? 1 : 0

    if (item.children) {
      for (const child of item.children) {
        const childCounts = countInItem(child)
        itemTotal += childCounts.total
        itemCompleted += childCounts.completed
      }
    }

    return { total: itemTotal, completed: itemCompleted }
  }

  for (const item of subsection.items) {
    const counts = countInItem(item)
    total += counts.total
    completed += counts.completed
  }

  return { total, completed }
}
