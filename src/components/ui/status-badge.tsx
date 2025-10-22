import { Badge } from "@/components/ui/badge"

interface StatusBadgeProps {
  isActive: boolean
  activeLabel?: string
  inactiveLabel?: string
  className?: string
}

/**
 * Reusable status badge component
 * Shows active/inactive status with appropriate styling
 */
export function StatusBadge({ isActive, activeLabel = "Active", inactiveLabel = "Inactive", className }: StatusBadgeProps) {
  return (
    <Badge variant={isActive ? "success" : "secondary"} className={className}>
      {isActive ? activeLabel : inactiveLabel}
    </Badge>
  )
}

/**
 * Status badge specifically for entities
 */
export function EntityStatusBadge({ entity }: { entity: { isActive: boolean } }) {
  return <StatusBadge isActive={entity.isActive} />
}
