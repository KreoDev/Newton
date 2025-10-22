"use client"

import type { ProgressStats } from "@/types/testing"
import { Button } from "@/components/ui/button"
import { Download, Upload, RotateCcw } from "lucide-react"
import { useRef } from "react"
import { useAlert } from "@/hooks/useAlert"

interface ProgressHeaderProps {
  stats: ProgressStats
  exportProgress: () => void
  importProgress: (file: File) => void
  resetProgress: () => void
}

export function ProgressHeader({ stats, exportProgress, importProgress, resetProgress }: ProgressHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showConfirm } = useAlert()

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      importProgress(file)
      // Reset input so the same file can be selected again
      e.target.value = ""
    }
  }

  const handleResetClick = async () => {
    const confirmed = await showConfirm(
      "Reset All Progress",
      "Are you sure you want to reset all testing progress? This action cannot be undone.",
      "Reset"
    )

    if (confirmed) {
      resetProgress()
    }
  }

  return (
    <div className="sticky top-0 z-50 glass-surface-strong border-b">
      <div className="container max-w-7xl mx-auto px-4 py-4">
        {/* Title and stats */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Testing Checklist</h1>
            <p className="text-sm text-muted-foreground mt-1">Newton Web Application - Phase 1, 2 & 3</p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1">
            <p className="text-2xl font-bold">
              {stats.completedItems}/{stats.totalItems}
            </p>
            <p className="text-sm text-muted-foreground">{stats.percentage}% Complete</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden mb-4">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportProgress} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>

          <Button onClick={handleImportClick} variant="outline" size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>

          <Button onClick={handleResetClick} variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>

          {/* Hidden file input for import */}
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
        </div>
      </div>
    </div>
  )
}
