"use client"

import { useParams, useRouter } from "next/navigation"
import { useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useCompany } from "@/contexts/CompanyContext"
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { ArrowLeft, XCircle, ClipboardList } from "lucide-react"
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge"
import { OrderService } from "@/services/order.service"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"

export default function OrderDetailsPage() {
  useSignals()
  const params = useParams()
  const router = useRouter()
  const { company } = useCompany()
  const canCancel = usePermission(PERMISSIONS.ORDERS_CANCEL)

  const orderId = params.id as string
  const order = useMemo(() => OrderService.getById(orderId), [orderId, globalData.orders.value])

  // Look up the actual LC company from globalData (companies are always loaded)
  const lcCompany = useMemo(() => {
    if (!order?.assignedToLCId) return null
    return globalData.companies.value.find(c => c.id === order.assignedToLCId)
  }, [order?.assignedToLCId, globalData.companies.value])

  // All data now comes from denormalized fields on the order object!
  // No more cross-company lookups needed

  const progress = useMemo(() =>
    order ? OrderService.getProgress(order.id) : null,
    [order, globalData.orders.value]
  )

  const isPending = order?.status === "pending"
  const isAllocated = order?.status === "allocated"
  const canAllocate = company?.id === order?.assignedToLCId

  if (!order) {
    return (
      <div className="p-6">
        <div className="glass-surface rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Order not found</p>
          <Link href="/orders">
            <Button variant="outline" className="mt-4">
              Back to Orders
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return

    const reason = prompt("Please enter cancellation reason:")
    if (!reason) return

    try {
      await OrderService.cancel(order.id, reason)
      toast.success("Order cancelled successfully")
      router.push("/orders")
    } catch (error) {
      console.error("Error cancelling order:", error)
      toast.error("Failed to cancel order")
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
            <p className="text-muted-foreground mt-1">Order Details</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
          {isPending && canAllocate && (
            <Link href={`/orders/allocate/${order.id}`}>
              <Button variant="default" size="sm" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Allocate Now
              </Button>
            </Link>
          )}
          {canCancel && company?.companyType === "mine" && order.status !== "cancelled" && order.status !== "completed" && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive gap-2"
              onClick={handleCancel}
            >
              <XCircle className="h-4 w-4" />
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      {/* Pending Order Notice */}
      {isPending && (
        <div className="glass-surface rounded-lg p-6 border-l-4 border-yellow-500">
          <h2 className="text-xl font-bold mb-2 text-yellow-600">Awaiting Allocation</h2>
          <p className="text-muted-foreground mb-4">
            This order has been assigned to a logistics coordinator and is awaiting allocation to transporter companies.
          </p>
          {order.assignedToLCId && lcCompany && (
            <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Assigned to Logistics Coordinator:</p>
              <p className="font-semibold text-lg text-blue-600 dark:text-blue-400">
                {lcCompany.name}
              </p>
              {lcCompany.physicalAddress && (
                <p className="text-sm text-muted-foreground mt-2">{lcCompany.physicalAddress}</p>
              )}
            </div>
          )}
          {canAllocate && (
            <Link href={`/orders/allocate/${order.id}`}>
              <Button variant="default" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Allocate to Transporters
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Progress Card - Only show for allocated/completed orders */}
      {isAllocated && progress && (
        <div className="glass-surface rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Progress</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Weight Completed</span>
                <span className="font-medium">
                  {progress.completedWeight}/{progress.totalWeight} kg ({progress.percentageComplete}%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all"
                  style={{ width: `${progress.percentageComplete}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Completed Trips</p>
                <p className="text-2xl font-bold">{progress.completedTrips}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining Weight</p>
                <p className="text-2xl font-bold">
                  {(progress.totalWeight - progress.completedWeight).toFixed(1)} kg
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Card */}
      <div className="glass-surface rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Order Information</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Order Number</p>
            <p className="font-medium">{order.orderNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Order Type</p>
            <p className="font-medium capitalize">{order.orderType}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Client</p>
            <p className="font-medium">{order.clientName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Product</p>
            <p className="font-medium">{order.productName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Weight</p>
            <p className="font-medium">{order.totalWeight} kg</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Dispatch Date Range</p>
            <p className="font-medium text-sm">
              {format(new Date(order.dispatchStartDate), "MMM d, yyyy")} - {format(new Date(order.dispatchEndDate), "MMM d, yyyy")}
            </p>
          </div>
          {order.orderType === "dispatching" ? (
            <div>
              <p className="text-sm text-muted-foreground">Collection Site</p>
              <p className="font-medium">{order.collectionSiteName}</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground">Destination Site</p>
              <p className="font-medium">{order.destinationSiteName}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Seals</p>
            <p className="font-medium">
              {order.sealRequired ? `Required (${order.sealQuantity})` : "Not Required"}
            </p>
          </div>
          {order.assignedToLCId && lcCompany && (
            <div>
              <p className="text-sm text-muted-foreground">Assigned Logistics Coordinator</p>
              <p className="font-medium text-blue-600 dark:text-blue-400">
                {lcCompany.name}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Daily Truck Limit</p>
            <p className="font-medium">{order.dailyTruckLimit} trucks</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Daily Weight Limit</p>
            <p className="font-medium">{order.dailyWeightLimit} kg</p>
          </div>
          {order.tripLimit !== undefined ? (
            <div>
              <p className="text-sm text-muted-foreground">Trip Limit</p>
              <p className="font-medium">{order.tripLimit} per day</p>
            </div>
          ) : order.tripDuration !== undefined ? (
            <div>
              <p className="text-sm text-muted-foreground">Trip Duration</p>
              <p className="font-medium">{order.tripDuration} hours</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground">Trip Configuration</p>
              <p className="font-medium text-muted-foreground">Not configured</p>
            </div>
          )}
        </div>
      </div>

      {/* Allocations Card - Only show for allocated orders */}
      {isAllocated && order.allocations.length > 0 && (
        <div className="glass-surface rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Allocations</h2>
          <div className="space-y-4">
            {order.allocations.map((allocation, index) => {
              const allocationProgress = allocation.allocatedWeight > 0
                ? Math.round((allocation.completedWeight / allocation.allocatedWeight) * 100)
                : 0

              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{allocation.companyName}</p>
                      <p className="text-sm text-muted-foreground">
                        {allocation.completedWeight}/{allocation.allocatedWeight} kg
                      </p>
                    </div>
                    <span className="text-sm font-medium">{allocationProgress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${allocationProgress}%` }}
                    />
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Loading dates: {allocation.loadingDates.join(", ")}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
