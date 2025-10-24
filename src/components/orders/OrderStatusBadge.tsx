import { Badge } from "@/components/ui/badge"
import type { Order } from "@/types"

interface OrderStatusBadgeProps {
  status: Order["status"]
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const variants = {
    pending: { variant: "secondary" as const, label: "Pending", color: "text-gray-600" },
    allocated: { variant: "default" as const, label: "Allocated", color: "text-blue-600" },
    completed: { variant: "success" as const, label: "Completed", color: "text-green-600" },
    cancelled: { variant: "destructive" as const, label: "Cancelled", color: "text-red-600" },
  }

  const config = variants[status]

  return (
    <Badge variant={config.variant} className={config.color}>
      {config.label}
    </Badge>
  )
}
