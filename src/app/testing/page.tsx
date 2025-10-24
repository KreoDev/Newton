"use client"

import { useEffect, useState } from "react"
import { parseTestingChecklist } from "@/lib/testing-checklist-parser"
import { useTestingProgress } from "@/hooks/useTestingProgress"
import { ProgressHeader } from "@/components/testing/ProgressHeader"
import { TestingSection } from "@/components/testing/TestingSection"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import type { TestingChecklist } from "@/types/testing"

export default function TestingPage() {
  const [checklist, setChecklist] = useState<TestingChecklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load and parse the testing checklist markdown
  useEffect(() => {
    async function loadChecklist() {
      try {
        setLoading(true)

        // Fetch the markdown file
        const response = await fetch("/docs/testing-checklist.md")

        if (!response.ok) {
          throw new Error(`Failed to load checklist: ${response.statusText}`)
        }

        const markdownContent = await response.text()

        // Parse the markdown into structured data
        const parsed = parseTestingChecklist(markdownContent)
        setChecklist(parsed)
        setError(null)
      } catch (err) {
        console.error("Error loading checklist:", err)
        setError(err instanceof Error ? err.message : "Failed to load testing checklist")
      } finally {
        setLoading(false)
      }
    }

    loadChecklist()
  }, [])

  // Initialize progress tracking
  const { stats, isChecked, toggleItem, exportProgress, importProgress, resetProgress } = useTestingProgress(
    checklist || {
      sections: [],
      metadata: { title: "", phase: "", totalItems: 0, lastUpdated: "" },
    }
  )

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading testing checklist..." />
      </div>
    )
  }

  // Error state
  if (error || !checklist) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-surface p-8 rounded-lg max-w-md text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Checklist</h2>
          <p className="text-muted-foreground">{error || "Failed to load the testing checklist"}</p>
          <p className="text-sm text-muted-foreground mt-4">
            Make sure the checklist file exists at <code className="bg-muted px-2 py-1 rounded">docs/testing-checklist.md</code>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Sticky progress header */}
      <ProgressHeader stats={stats} exportProgress={exportProgress} importProgress={importProgress} resetProgress={resetProgress} />

      {/* Main content */}
      <div className="container max-w-5xl mx-auto px-4 py-8">
        {/* Sections */}
        <div className="space-y-2">
          {checklist.sections.map(section => (
            <TestingSection
              key={section.id}
              section={section}
              isChecked={isChecked}
              toggleItem={toggleItem}
              sectionStats={stats.sectionStats[section.id] || { total: 0, completed: 0, percentage: 0 }}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Newton Web Application Testing Checklist</p>
          <p className="mt-1">Phase 1, 2, 3 & 4 User Acceptance Testing</p>
          <p className="mt-4">
            Progress is automatically saved to your browser&apos;s local storage.
            <br />
            Use Export/Import buttons to backup or transfer your progress.
          </p>
        </div>
      </div>
    </div>
  )
}
