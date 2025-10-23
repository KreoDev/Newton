"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { Order, Company } from "@/types"
import { DataTable } from "@/components/ui/data-table/DataTable"
import { Button } from "@/components/ui/button"
import { FileText, Trash2 } from "lucide-react"
import { OrderStatusBadge } from "./OrderStatusBadge"
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

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Status filter
      if (statusFilter !== "all" && order.status !== statusFilter) return false

      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const client = clients.find(c => c.id === order.clientCompanyId)
        const product = products.find(p => p.id === order.productId)

        const matchesOrderNumber = order.orderNumber.toLowerCase().includes(term)
        const matchesClient = client?.name.toLowerCase().includes(term)
        const matchesProduct = product?.name.toLowerCase().includes(term)

        if (!matchesOrderNumber && !matchesClient && !matchesProduct) return false
      }

      return true
    })
  }, [orders, searchTerm, statusFilter, clients, products])

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
      header: "Status",
      cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
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
    <div className="space-y-4">
      {/* Filters */}
      <div className="glass-surface rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by order #, client, or product..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 rounded-md border bg-background"
          />

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-md border bg-background"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="allocated">Allocated</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filteredOrders}
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
      />

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="glass-surface rounded-lg p-8 text-center">
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== "all"
              ? "No orders match your filters"
              : "No orders yet. Create your first order to get started."}
          </p>
        </div>
      )}
    </div>
  )
}
