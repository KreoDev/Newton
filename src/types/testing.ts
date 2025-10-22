import { z } from "zod"

/**
 * Zod Schemas for Testing Checklist
 */

export const ChecklistItemSchema = z.object({
  id: z.string(), // e.g., "1.1.0", "1.1.1", "3.2.1.0"
  text: z.string(),
  checked: z.boolean().default(false),
  children: z.lazy(() => z.array(ChecklistItemSchema)).optional(),
})

export const ChecklistSubsectionSchema = z.object({
  id: z.string(), // e.g., "1.1", "3.2"
  title: z.string(),
  items: z.array(ChecklistItemSchema),
})

export const ChecklistSectionSchema = z.object({
  id: z.string(), // e.g., "1", "3", "14"
  title: z.string(),
  location: z.string().optional(), // e.g., "Admin → Companies"
  subsections: z.array(ChecklistSubsectionSchema),
})

export const TestingChecklistSchema = z.object({
  sections: z.array(ChecklistSectionSchema),
  metadata: z.object({
    title: z.string(),
    phase: z.string(),
    totalItems: z.number(),
    lastUpdated: z.string(),
  }),
})

export const ProgressStateSchema = z.record(z.string(), z.boolean())

/**
 * TypeScript Types (inferred from Zod schemas)
 */

export type ChecklistItem = z.infer<typeof ChecklistItemSchema>
export type ChecklistSubsection = z.infer<typeof ChecklistSubsectionSchema>
export type ChecklistSection = z.infer<typeof ChecklistSectionSchema>
export type TestingChecklist = z.infer<typeof TestingChecklistSchema>
export type ProgressState = z.infer<typeof ProgressStateSchema>

/**
 * Progress Statistics
 */

export interface ProgressStats {
  totalItems: number
  completedItems: number
  percentage: number
  sectionStats: Record<
    string,
    {
      total: number
      completed: number
      percentage: number
    }
  >
}
