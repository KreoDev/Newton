import { Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ViewOnlyBadgeProps {
  className?: string
}

export function ViewOnlyBadge({ className }: ViewOnlyBadgeProps) {
  return (
    <Badge variant="secondary" className={className}>
      <Eye className="h-3 w-3 mr-1" />
      View Only
    </Badge>
  )
}
