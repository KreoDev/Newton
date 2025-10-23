"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useCompany } from "@/contexts/CompanyContext"
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"
import Link from "next/link"
import { OrdersTableView } from "@/components/orders/OrdersTableView"
import { OrderService } from "@/services/order.service"
import { toast } from "sonner"
import type { Order } from "@/types"
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore"

export default function OrdersPage() {
  useSignals()
  const router = useRouter()
  const { user } = useAuth()
  const { company } = useCompany()
  const canView = usePermission(PERMISSIONS.ORDERS_VIEW)
  const canCreate = usePermission(PERMISSIONS.ORDERS_CREATE)

  // Historical orders state
  const [historicalOrders, setHistoricalOrders] = useState<Order[]>([])
  const [loadingHistorical, setLoadingHistorical] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | undefined>(undefined)
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null)

  // Get real-time orders from globalData
  const realtimeOrders = useMemo(() => {
    if (!company) return []

    const allOrders = globalData.orders.value

    // Mine companies: See all orders they created
    if (company.companyType === "mine") {
      return allOrders.filter(o => o.companyId === company.id)
    }

    // Transporters: See orders allocated to them
    if (company.companyType === "transporter") {
      return allOrders.filter(o =>
        o.allocations.some(a => a.companyId === company.id)
      )
    }

    // LCs: See orders they manage (either assigned to them or created by them)
    if (company.companyType === "logistics_coordinator") {
      return allOrders.filter(o =>
        o.companyId === company.id ||
        o.allocations.some(a => a.companyId === company.id)
      )
    }

    return []
  }, [company, globalData.orders.value])

  // Combine real-time and historical orders
  const orders = useMemo(() => {
    // Merge and deduplicate (historical orders might overlap with real-time)
    const allOrders = [...realtimeOrders, ...historicalOrders]
    const uniqueOrders = Array.from(
      new Map(allOrders.map(order => [order.id, order])).values()
    )
    // Sort by creation date (newest first)
    return uniqueOrders.sort((a, b) => {
      const aTime = a.dbCreatedAt ? (typeof a.dbCreatedAt === 'number' ? a.dbCreatedAt : a.dbCreatedAt.toMillis()) : a.createdAt
      const bTime = b.dbCreatedAt ? (typeof b.dbCreatedAt === 'number' ? b.dbCreatedAt : b.dbCreatedAt.toMillis()) : b.createdAt
      return bTime - aTime
    })
  }, [realtimeOrders, historicalOrders])

  // Load historical orders for a specific date range
  const loadHistoricalOrders = async (start: Date, end: Date) => {
    if (!company) return

    setLoadingHistorical(true)
    try {
      const result = await OrderService.loadHistoricalOrders(
        company.id,
        company.companyType,
        start,
        end
      )

      setHistoricalOrders(result.orders)
      setHasMore(result.hasMore)
      setLastDoc(result.lastDoc)
      setDateRange({ start, end })

      toast.success(`Loaded ${result.orders.length} historical orders`)
    } catch (error) {
      console.error("Error loading historical orders:", error)
      toast.error("Failed to load historical orders")
    } finally {
      setLoadingHistorical(false)
    }
  }

  // Load more historical orders (pagination)
  const loadMoreHistorical = async () => {
    if (!company || !dateRange || !lastDoc) return

    setLoadingHistorical(true)
    try {
      const result = await OrderService.loadHistoricalOrders(
        company.id,
        company.companyType,
        dateRange.start,
        dateRange.end,
        lastDoc
      )

      // Append new orders to existing historical orders
      setHistoricalOrders(prev => [...prev, ...result.orders])
      setHasMore(result.hasMore)
      setLastDoc(result.lastDoc)

      toast.success(`Loaded ${result.orders.length} more orders`)
    } catch (error) {
      console.error("Error loading more orders:", error)
      toast.error("Failed to load more orders")
    } finally {
      setLoadingHistorical(false)
    }
  }

  // Clear historical orders and return to real-time only
  const clearHistoricalOrders = () => {
    setHistoricalOrders([])
    setDateRange(null)
    setHasMore(false)
    setLastDoc(undefined)
    toast.success("Cleared historical orders")
  }

  if (!canView) {
    return (
      <div className="p-6">
        <div className="glass-surface rounded-lg p-8 text-center">
          <p className="text-muted-foreground">You do not have permission to view orders.</p>
        </div>
      </div>
    )
  }

  // Only mine companies can create orders
  const canShowCreateButton = company?.companyType === "mine" && canCreate

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-1">
            {company?.companyType === "mine" && "Manage orders for your mine"}
            {company?.companyType === "transporter" && "View orders allocated to your company"}
            {company?.companyType === "logistics_coordinator" && "Manage and allocate orders"}
          </p>
        </div>

        {canShowCreateButton && (
          <Link href="/orders/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Order
            </Button>
          </Link>
        )}
      </div>

      {/* Orders Table */}
      <OrdersTableView
        orders={orders}
        company={company}
        onLoadHistorical={loadHistoricalOrders}
        onLoadMore={loadMoreHistorical}
        onClearHistorical={clearHistoricalOrders}
        loadingHistorical={loadingHistorical}
        hasMore={hasMore}
        historicalCount={historicalOrders.length}
        dateRange={dateRange}
      />
    </div>
  )
}
