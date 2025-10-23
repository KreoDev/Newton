"use client"

import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { ViewOnlyBadge } from "@/components/ui/view-only-badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Plus } from "lucide-react"

interface EntityListPageProps {
  title: string
  description: (isViewOnly: boolean) => string
  addButtonLabel: string
  onAddClick: () => void
  canView: boolean
  canManage: boolean
  isViewOnly: boolean
  permissionLoading: boolean
  children: ReactNode
}

/**
 * Standard wrapper for entity list pages
 * Handles page header, permissions, loading states
 */
export function EntityListPage({
  title,
  description,
  addButtonLabel,
  onAddClick,
  canView,
  canManage,
  isViewOnly,
  permissionLoading,
  children,
}: EntityListPageProps) {
  // Show loading spinner while checking permissions
  if (permissionLoading) {
    return <LoadingSpinner fullScreen message="Checking permissions..." />
  }

  // Show permission denied message
  if (!canView) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">You don&apos;t have permission to view {title.toLowerCase()}.</p>
      </div>
    )
  }

  // Render page with standard header
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">{description(isViewOnly)}</p>
          </div>
          {isViewOnly && <ViewOnlyBadge />}
        </div>
        {canManage && (
          <Button variant="outline" onClick={onAddClick}>
            <Plus className="mr-2 h-4 w-4" />
            {addButtonLabel}
          </Button>
        )}
      </div>

      {/* Page content */}
      {children}
    </div>
  )
}
