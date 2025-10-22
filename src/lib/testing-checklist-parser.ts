import type { TestingChecklist, ChecklistSection, ChecklistSubsection, ChecklistItem } from "@/types/testing"

/**
 * Parse the markdown testing checklist into structured JSON
 * Handles sections (## 1.), subsections (### 1.1), and checkbox items (- [ ])
 */

export function parseTestingChecklist(markdownContent: string): TestingChecklist {
  const lines = markdownContent.split("\n")
  const sections: ChecklistSection[] = []
  let currentSection: ChecklistSection | null = null
  let currentSubsection: ChecklistSubsection | null = null
  let currentItemIndex = 0
  let totalItems = 0

  // Metadata
  let title = ""
  let phase = ""

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip empty lines
    if (!trimmed) continue

    // Parse main title (# heading)
    if (trimmed.startsWith("# ") && !title) {
      title = trimmed.replace(/^#\s+/, "")
      continue
    }

    // Parse phase (## Phase heading)
    if (trimmed.match(/^##\s+Phase\s+/i) && !phase) {
      phase = trimmed.replace(/^##\s+/, "")
      continue
    }

    // Parse main section (## 1. Companies Management)
    const sectionMatch = trimmed.match(/^##\s+(\d+)\.\s+(.+)$/)
    if (sectionMatch) {
      // Save previous subsection and section
      if (currentSubsection && currentSection) {
        currentSection.subsections.push(currentSubsection)
        currentSubsection = null
      }
      if (currentSection) {
        sections.push(currentSection)
      }

      // Create new section
      const sectionId = sectionMatch[1]
      const sectionTitle = sectionMatch[2]

      currentSection = {
        id: sectionId,
        title: sectionTitle,
        subsections: [],
      }
      currentItemIndex = 0
      continue
    }

    // Parse location (Location: Admin → Companies)
    if (trimmed.startsWith("**Location**:") && currentSection && currentSection.subsections.length === 0) {
      const location = trimmed.replace(/^\*\*Location\*\*:\s*/, "")
      currentSection.location = location
      continue
    }

    // Parse subsection (### 1.1 View Companies List)
    const subsectionMatch = trimmed.match(/^###\s+([\d.]+)\s+(.+)$/)
    if (subsectionMatch) {
      // Save previous subsection
      if (currentSubsection && currentSection) {
        currentSection.subsections.push(currentSubsection)
      }

      // Create new subsection
      const subsectionId = subsectionMatch[1]
      const subsectionTitle = subsectionMatch[2]

      currentSubsection = {
        id: subsectionId,
        title: subsectionTitle,
        items: [],
      }
      currentItemIndex = 0
      continue
    }

    // Parse checkbox item (- [ ] text)
    if (trimmed.startsWith("- [ ]") && currentSubsection) {
      const itemText = trimmed.replace(/^-\s+\[\s*\]\s+/, "")
      const indentLevel = getIndentLevel(line)

      // Root-level item (no indentation)
      if (indentLevel === 0) {
        const item: ChecklistItem = {
          id: `${currentSubsection.id}.${currentItemIndex}`,
          text: itemText,
          checked: false,
          children: [],
        }
        currentSubsection.items.push(item)
        currentItemIndex++
        totalItems++
      }
      // Child item (indented by 2+ spaces)
      else if (indentLevel > 0 && currentSubsection.items.length > 0) {
        const parentItem = currentSubsection.items[currentSubsection.items.length - 1]

        // Handle nested children (check if we're nested within a child)
        let targetParent = parentItem
        const childDepth = Math.floor(indentLevel / 2) - 1

        // Navigate to correct nesting level
        for (let depth = 0; depth < childDepth && targetParent.children && targetParent.children.length > 0; depth++) {
          targetParent = targetParent.children[targetParent.children.length - 1]
        }

        if (!targetParent.children) {
          targetParent.children = []
        }

        const childItem: ChecklistItem = {
          id: `${parentItem.id}.${targetParent.children.length}`,
          text: itemText,
          checked: false,
        }
        targetParent.children.push(childItem)
        totalItems++
      }
    }
  }

  // Save last subsection and section
  if (currentSubsection && currentSection) {
    currentSection.subsections.push(currentSubsection)
  }
  if (currentSection) {
    sections.push(currentSection)
  }

  return {
    sections,
    metadata: {
      title: title || "Newton Web Application - Testing Checklist",
      phase: phase || "Phase 1, 2 & 3",
      totalItems,
      lastUpdated: new Date().toISOString(),
    },
  }
}

/**
 * Get indentation level of a line (number of leading spaces)
 */
function getIndentLevel(line: string): number {
  const match = line.match(/^(\s*)/)
  return match ? match[1].length : 0
}

/**
 * Count total checkable items in the checklist
 */
export function countTotalItems(checklist: TestingChecklist): number {
  let count = 0

  function countInItem(item: ChecklistItem): number {
    let itemCount = 1 // Count the item itself
    if (item.children) {
      for (const child of item.children) {
        itemCount += countInItem(child)
      }
    }
    return itemCount
  }

  for (const section of checklist.sections) {
    for (const subsection of section.subsections) {
      for (const item of subsection.items) {
        count += countInItem(item)
      }
    }
  }

  return count
}

/**
 * Get all item IDs from the checklist (flat list)
 */
export function getAllItemIds(checklist: TestingChecklist): string[] {
  const ids: string[] = []

  function collectIds(item: ChecklistItem) {
    ids.push(item.id)
    if (item.children) {
      for (const child of item.children) {
        collectIds(child)
      }
    }
  }

  for (const section of checklist.sections) {
    for (const subsection of section.subsections) {
      for (const item of subsection.items) {
        collectIds(item)
      }
    }
  }

  return ids
}
