"use client"

import { useMemo } from "react"
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

export default function OrdersPage() {
  useSignals()
  const router = useRouter()
  const { user } = useAuth()
  const { company } = useCompany()
  const canView = usePermission(PERMISSIONS.ORDERS_VIEW)
  const canCreate = usePermission(PERMISSIONS.ORDERS_CREATE)

  // Get orders based on company type
  const orders = useMemo(() => {
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
      <OrdersTableView orders={orders} company={company} />
    </div>
  )
}
