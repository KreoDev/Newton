"use client"

import { ReactNode } from "react"

interface EntityCardProps {
  icon: ReactNode
  title: ReactNode
  subtitle?: string
  metadata?: string[]
  actions: ReactNode
  statusBadge: ReactNode
  onClick?: () => void
}

/**
 * Reusable entity card component
 * Provides consistent layout: icon + content on left, actions + badge on right
 */
export function EntityCard({
  icon,
  title,
  subtitle,
  metadata,
  actions,
  statusBadge,
  onClick,
}: EntityCardProps) {
  return (
    <div
      className={`flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors backdrop-blur-sm ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      {/* Left: Icon + Content */}
      <div className="flex items-center gap-4 flex-1">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
          {metadata && metadata.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{metadata.join(" • ")}</p>
          )}
        </div>
      </div>

      {/* Right: Actions + Status */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {actions}
        {statusBadge}
      </div>
    </div>
  )
}
