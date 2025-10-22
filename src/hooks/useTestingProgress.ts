import { useState, useEffect, useCallback } from "react"
import type { ProgressState, ProgressStats, TestingChecklist, ChecklistItem } from "@/types/testing"
import { toast } from "sonner"

const STORAGE_KEY = "newton-testing-checklist-v1"
const DEBOUNCE_MS = 300

/**
 * Custom hook for managing testing checklist progress
 * Handles localStorage persistence, export/import, and statistics
 */
export function useTestingProgress(checklist: TestingChecklist) {
  const [progress, setProgress] = useState<ProgressState>({})
  const [stats, setStats] = useState<ProgressStats>({
    totalItems: 0,
    completedItems: 0,
    percentage: 0,
    sectionStats: {},
  })
  const [saveTimeoutId, setSaveTimeoutId] = useState<NodeJS.Timeout | null>(null)

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setProgress(parsed)
      }
    } catch (error) {
      console.error("Failed to load progress from localStorage:", error)
      toast.error("Failed to load saved progress")
    }
  }, [])

  // Calculate statistics whenever progress changes
  useEffect(() => {
    const newStats = calculateStats(checklist, progress)
    setStats(newStats)
  }, [checklist, progress])

  // Debounced save to localStorage
  const saveToLocalStorage = useCallback(
    (newProgress: ProgressState) => {
      // Clear existing timeout
      if (saveTimeoutId) {
        clearTimeout(saveTimeoutId)
      }

      // Set new timeout
      const timeoutId = setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress))
        } catch (error) {
          console.error("Failed to save progress to localStorage:", error)
          toast.error("Failed to save progress")
        }
      }, DEBOUNCE_MS)

      setSaveTimeoutId(timeoutId)
    },
    [saveTimeoutId]
  )

  // Toggle a single item's checked state
  const toggleItem = useCallback(
    (itemId: string) => {
      const newProgress = {
        ...progress,
        [itemId]: !progress[itemId],
      }
      setProgress(newProgress)
      saveToLocalStorage(newProgress)
    },
    [progress, saveToLocalStorage]
  )

  // Export progress as JSON file
  const exportProgress = useCallback(() => {
    try {
      const exportData = {
        version: 1,
        timestamp: new Date().toISOString(),
        progress,
        stats,
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `newton-testing-progress-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("Progress exported successfully")
    } catch (error) {
      console.error("Failed to export progress:", error)
      toast.error("Failed to export progress")
    }
  }, [progress, stats])

  // Import progress from JSON file
  const importProgress = useCallback(
    (file: File) => {
      const reader = new FileReader()

      reader.onload = e => {
        try {
          const content = e.target?.result as string
          const imported = JSON.parse(content)

          if (imported.progress) {
            setProgress(imported.progress)
            saveToLocalStorage(imported.progress)
            toast.success("Progress imported successfully")
          } else {
            toast.error("Invalid progress file format")
          }
        } catch (error) {
          console.error("Failed to import progress:", error)
          toast.error("Failed to import progress file")
        }
      }

      reader.readAsText(file)
    },
    [saveToLocalStorage]
  )

  // Reset all progress (with confirmation handled in component)
  const resetProgress = useCallback(() => {
    setProgress({})
    localStorage.removeItem(STORAGE_KEY)
    toast.success("Progress reset successfully")
  }, [])

  // Check if an item is checked
  const isChecked = useCallback((itemId: string): boolean => {
    return progress[itemId] || false
  }, [progress])

  return {
    progress,
    stats,
    toggleItem,
    isChecked,
    exportProgress,
    importProgress,
    resetProgress,
  }
}

/**
 * Calculate statistics from checklist and progress
 */
function calculateStats(checklist: TestingChecklist, progress: ProgressState): ProgressStats {
  let totalItems = 0
  let completedItems = 0
  const sectionStats: Record<string, { total: number; completed: number; percentage: number }> = {}

  function countInItem(item: ChecklistItem): { total: number; completed: number } {
    let total = 1
    let completed = progress[item.id] ? 1 : 0

    if (item.children) {
      for (const child of item.children) {
        const childCounts = countInItem(child)
        total += childCounts.total
        completed += childCounts.completed
      }
    }

    return { total, completed }
  }

  for (const section of checklist.sections) {
    let sectionTotal = 0
    let sectionCompleted = 0

    for (const subsection of section.subsections) {
      for (const item of subsection.items) {
        const counts = countInItem(item)
        sectionTotal += counts.total
        sectionCompleted += counts.completed
      }
    }

    sectionStats[section.id] = {
      total: sectionTotal,
      completed: sectionCompleted,
      percentage: sectionTotal > 0 ? Math.round((sectionCompleted / sectionTotal) * 100) : 0,
    }

    totalItems += sectionTotal
    completedItems += sectionCompleted
  }

  return {
    totalItems,
    completedItems,
    percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
    sectionStats,
  }
}
