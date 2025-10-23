"use client"

import { useMemo } from "react"
import Link from "next/link"
import type { Order, Company } from "@/types"
import { DataTable } from "@/components/ui/data-table/DataTable"
import { Button } from "@/components/ui/button"
import { FileText, Trash2 } from "lucide-react"
import { OrderStatusBadge } from "./OrderStatusBadge"
import { FilterableColumnHeader } from "@/components/ui/data-table/FilterableColumnHeader"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"
import { format } from "date-fns"
import { OrderService } from "@/services/order.service"
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"
import { toast } from "sonner"

interface OrdersTableViewProps {
  orders: Order[]
  company: Company | null
}

export function OrdersTableView({ orders, company }: OrdersTableViewProps) {
  useSignals()
  const canCancel = usePermission(PERMISSIONS.ORDERS_CANCEL)

  // Get related data from globalData
  const clients = globalData.clients.value
  const products = globalData.products.value
  const sites = globalData.sites.value

  const columns = [
    {
      id: "orderNumber",
      accessorFn: row => row.orderNumber,
      header: "Order #",
      cell: ({ row }) => (
        <Link href={`/orders/${row.original.id}`} className="font-medium hover:underline">
          {row.original.orderNumber}
        </Link>
      ),
    },
    {
      id: "orderType",
      accessorFn: row => row.orderType,
      header: "Type",
      cell: ({ row }) => (
        <span className="capitalize">{row.original.orderType}</span>
      ),
    },
    {
      id: "client",
      accessorFn: row => row.clientCompanyId,
      header: "Client",
      cell: ({ row }) => {
        const client = clients.find(c => c.id === row.original.clientCompanyId)
        return <span>{client?.name || "Unknown"}</span>
      },
    },
    {
      id: "product",
      accessorFn: row => row.productId,
      header: "Product",
      cell: ({ row }) => {
        const product = products.find(p => p.id === row.original.productId)
        return <span>{product?.name || "Unknown"}</span>
      },
    },
    {
      id: "totalWeight",
      accessorFn: row => row.totalWeight,
      header: "Total Weight",
      cell: ({ row }) => <span>{row.original.totalWeight} tons</span>,
    },
    {
      id: "progress",
      accessorFn: row => row.completedWeight || 0,
      header: "Progress",
      cell: ({ row }) => {
        const order = row.original
        const completed = order.completedWeight || 0
        const percentage = order.totalWeight > 0 ? Math.round((completed / order.totalWeight) * 100) : 0

        return (
          <div className="space-y-1">
            <div className="text-sm">
              {completed}/{order.totalWeight} tons
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      },
    },
    {
      id: "dateRange",
      accessorFn: row => row.dispatchStartDate,
      header: "Dispatch Dates",
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{format(new Date(row.original.dispatchStartDate), "MMM d, yyyy")}</div>
          <div className="text-muted-foreground">to {format(new Date(row.original.dispatchEndDate), "MMM d, yyyy")}</div>
        </div>
      ),
    },
    {
      id: "status",
      accessorFn: row => row.status,
      header: ({ column }) => (
        <FilterableColumnHeader
          column={column}
          title="Status"
          filterOptions={[
            { label: "All", value: "all" },
            { label: "Pending", value: "pending" },
            { label: "Allocated", value: "allocated" },
            { label: "Completed", value: "completed" },
            { label: "Cancelled", value: "cancelled" },
          ]}
        />
      ),
      cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue === "all") return true
        const status = row.getValue(columnId) as string
        return status === filterValue
      },
    },
    {
      id: "actions",
      accessorFn: row => row.id,
      header: "Actions",
      cell: ({ row }) => {
        const order = row.original
        return (
          <div className="flex items-center gap-2">
            <Link href={`/orders/${order.id}`}>
              <Button variant="ghost" size="sm">
                <FileText className="h-4 w-4" />
              </Button>
            </Link>

            {canCancel && order.status !== "cancelled" && order.status !== "completed" && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => handleCancel(order.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  const handleCancel = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return

    const reason = prompt("Please enter cancellation reason:")
    if (!reason) return

    try {
      await OrderService.cancel(orderId, reason)
      toast.success("Order cancelled successfully")
    } catch (error) {
      console.error("Error cancelling order:", error)
      toast.error("Failed to cancel order")
    }
  }

  return (
    <DataTable
      data={orders}
      columns={columns}
      tableId="orders-table"
      defaultColumnOrder={[
        "orderNumber",
        "orderType",
        "client",
        "product",
        "totalWeight",
        "progress",
        "dateRange",
        "status",
        "actions",
      ]}
      defaultPageSize={20}
      searchPlaceholder="Search by order #, client, or product..."
      enablePagination={true}
      enableColumnResizing={true}
      enableExport={true}
    />
  )
}
