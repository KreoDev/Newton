"use client"

import { useParams, useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useCompany } from "@/contexts/CompanyContext"
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { OrderService } from "@/services/order.service"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"
import Link from "next/link"
import { useAlert } from "@/hooks/useAlert"
import { toast } from "sonner"
import type { Allocation } from "@/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function OrderAllocationPage() {
  useSignals()
  const params = useParams()
  const router = useRouter()
  const { company } = useCompany()
  const { showSuccess, showError } = useAlert()
  const canAllocate = usePermission(PERMISSIONS.ORDERS_ALLOCATE)

  const orderId = params.id as string
  const order = useMemo(() => OrderService.getById(orderId), [orderId, globalData.orders.value])

  const [allocations, setAllocations] = useState<Allocation[]>(order?.allocations || [])
  const [loading, setLoading] = useState(false)

  const transporterCompanies = globalData.companies.value.filter(c => c.isActive && c.companyType === "transporter")

  // Check if user can allocate this order
  const canAllocateOrder = useMemo(() => {
    if (!company || !order || !canAllocate) return false
    // Only LC companies can allocate
    if (company.companyType !== "logistics_coordinator") return false
    // Order must be pending or already allocated to this LC
    return order.status === "pending" || order.allocations.some(a => a.companyId === company.id)
  }, [company, order, canAllocate])

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

  if (!canAllocateOrder) {
    return (
      <div className="p-6">
        <div className="glass-surface rounded-lg p-8 text-center">
          <p className="text-muted-foreground">You do not have permission to allocate this order</p>
          <Link href="/orders">
            <Button variant="outline" className="mt-4">
              Back to Orders
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedWeight, 0)
  const remainingWeight = order.totalWeight - totalAllocated

  const handleAddAllocation = () => {
    setAllocations([
      ...allocations,
      {
        companyId: "",
        allocatedWeight: 0,
        loadingDates: [order.dispatchStartDate],
        completedWeight: 0,
        status: "pending",
      },
    ])
  }

  const handleRemoveAllocation = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index))
  }

  const handleUpdateAllocation = (index: number, field: keyof Allocation, value: any) => {
    const updated = [...allocations]
    updated[index] = { ...updated[index], [field]: value }
    setAllocations(updated)
  }

  const handleSubmit = async () => {
    // Validate allocations
    const validation = OrderService.validateAllocation(allocations, order.totalWeight)
    if (!validation.isValid) {
      showError("Invalid Allocation", validation.error!)
      return
    }

    // Check all allocations have companies
    if (allocations.some(a => !a.companyId)) {
      showError("Missing Companies", "Please select a company for all allocations")
      return
    }

    setLoading(true)
    try {
      await OrderService.allocate(orderId, allocations, "Order allocated successfully")

      await showSuccess("Order Allocated", `Order ${order.orderNumber} has been successfully allocated to ${allocations.length} transporter(s).`)

      router.push(`/orders/${orderId}`)
    } catch (error) {
      console.error("Error allocating order:", error)
      toast.error("Failed to allocate order")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/orders/${orderId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Allocate Order</h1>
          <p className="text-muted-foreground mt-1">{order.orderNumber}</p>
        </div>
      </div>

      {/* Order Summary */}
      <div className="glass-surface rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Order Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Weight</p>
            <p className="font-medium">{order.totalWeight} tons</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date Range</p>
            <p className="font-medium text-sm">
              {order.dispatchStartDate} to {order.dispatchEndDate}
            </p>
          </div>
        </div>
      </div>

      {/* Allocation Progress */}
      <div className="glass-surface rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Allocation Progress</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Allocated</span>
            <span className="font-medium">
              {totalAllocated} / {order.totalWeight} tons
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div className={`h-3 rounded-full transition-all ${remainingWeight === 0 ? "bg-green-500" : remainingWeight < 0 ? "bg-red-500" : "bg-primary"}`} style={{ width: `${Math.min((totalAllocated / order.totalWeight) * 100, 100)}%` }} />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Remaining:</span>
            <span className={`font-medium ${remainingWeight === 0 ? "text-green-600" : remainingWeight < 0 ? "text-red-600" : ""}`}>{remainingWeight.toFixed(1)} tons</span>
          </div>
        </div>
      </div>

      {/* Allocations */}
      <div className="glass-surface rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Transporter Allocations</h2>
          <Button onClick={handleAddAllocation} variant="outline" size="sm">
            Add Allocation
          </Button>
        </div>

        <div className="space-y-4">
          {allocations.map((allocation, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="space-y-4">
                <div>
                  <Label>Transporter Company</Label>
                  <Select value={allocation.companyId || undefined} onValueChange={value => handleUpdateAllocation(index, "companyId", value)}>
                    <SelectTrigger className="mt-2 w-full glass-surface border-[var(--glass-border-soft)] shadow-[var(--glass-shadow-xs)] bg-[oklch(1_0_0_/_0.72)] backdrop-blur-[18px]">
                      <SelectValue placeholder="Select transporter..." />
                    </SelectTrigger>
                    <SelectContent>
                      {transporterCompanies.map(comp => (
                        <SelectItem key={comp.id} value={comp.id}>
                          {comp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Allocated Weight (tons)</Label>
                  <Input type="number" value={allocation.allocatedWeight || ""} onChange={e => handleUpdateAllocation(index, "allocatedWeight", parseFloat(e.target.value) || 0)} className="mt-2" placeholder="0" />
                </div>

                <Button variant="outline" size="sm" onClick={() => handleRemoveAllocation(index)} className="text-destructive hover:text-destructive">
                  Remove
                </Button>
              </div>
            </div>
          ))}

          {allocations.length === 0 && <div className="text-center py-8 text-muted-foreground">No allocations yet. Click &ldquo;Add Allocation&rdquo; to start.</div>}
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-2">
        <Link href={`/orders/${orderId}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={loading || allocations.length === 0 || remainingWeight !== 0} className="bg-green-600 hover:bg-green-700">
          {loading ? "Allocating..." : "Submit Allocation"}
        </Button>
      </div>
    </div>
  )
}
