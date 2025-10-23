"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { Order, Company } from "@/types"
import { DataTable } from "@/components/ui/data-table/DataTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Trash2, History, ChevronDown } from "lucide-react"
import { OrderStatusBadge } from "./OrderStatusBadge"
import { FilterableColumnHeader } from "@/components/ui/data-table/FilterableColumnHeader"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"
import { format } from "date-fns"
import { OrderService } from "@/services/order.service"
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface OrdersTableViewProps {
  orders: Order[]
  company: Company | null
  onLoadHistorical?: (startDate: Date, endDate: Date) => Promise<void>
  onLoadMore?: () => Promise<void>
  loadingHistorical?: boolean
  hasMore?: boolean
  historicalCount?: number
}

export function OrdersTableView({
  orders,
  company,
  onLoadHistorical,
  onLoadMore,
  loadingHistorical = false,
  hasMore = false,
  historicalCount = 0,
}: OrdersTableViewProps) {
  useSignals()
  const canCancel = usePermission(PERMISSIONS.ORDERS_CANCEL)

  // Date picker state
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Get related data from globalData
  const clients = globalData.clients.value
  const products = globalData.products.value
  const sites = globalData.sites.value

  // Handle historical load
  const handleLoadHistorical = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates")
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start > end) {
      toast.error("Start date must be before end date")
      return
    }

    setShowDatePicker(false)
    await onLoadHistorical?.(start, end)
  }

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
      toolbar={
        <>
          {/* Historical Loading Controls */}
          <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <History className="h-4 w-4" />
                Load Historical
                {historicalCount > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({historicalCount} loaded)
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Load Historical Orders</DialogTitle>
                <DialogDescription>
                  Select a date range to load older orders beyond the real-time window
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleLoadHistorical}
                    disabled={loadingHistorical || !startDate || !endDate}
                    className="flex-1"
                  >
                    {loadingHistorical ? "Loading..." : "Load Orders"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowDatePicker(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Load More Button */}
          {hasMore && (
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadMore}
              disabled={loadingHistorical}
              className="gap-2"
            >
              <ChevronDown className="h-4 w-4" />
              {loadingHistorical ? "Loading..." : "Load More"}
            </Button>
          )}
        </>
      }
    />
  )
}
