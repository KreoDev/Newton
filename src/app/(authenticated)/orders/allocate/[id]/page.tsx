"use client"

import { useParams, useRouter } from "next/navigation"
import { useMemo, useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useCompany } from "@/contexts/CompanyContext"
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, Plus, Minus } from "lucide-react"
import { OrderService } from "@/services/order.service"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"
import Link from "next/link"
import { useAlert } from "@/hooks/useAlert"
import { toast } from "sonner"
import type { Allocation } from "@/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTransporterTrucks } from "@/hooks/useTransporterTrucks"

export default function OrderAllocationPage() {
  useSignals()
  const params = useParams()
  const router = useRouter()
  const { company } = useCompany()
  const { showSuccess, showError } = useAlert()
  const canAllocate = usePermission(PERMISSIONS.ORDERS_ALLOCATE)

  // Use custom truck fetching hook
  const { fetchTrucksForTransporter, getAvailableTrucks, isLoadingTrucks, isAnyLoading } = useTransporterTrucks()

  const orderId = params.id as string
  const order = useMemo(() => OrderService.getById(orderId), [orderId, globalData.orders.value])

  const [allocations, setAllocations] = useState<Allocation[]>(order?.allocations || [])
  const [loading, setLoading] = useState(false)
  const [selectedTransporterId, setSelectedTransporterId] = useState<string>("")

  const sites = globalData.sites.value.filter(s => s.isActive)
  const transporterCompanies = useMemo(() =>
    globalData.companies.value.filter(c =>
      c.isActive && (
        c.companyType === "transporter" ||
        (c.companyType === "logistics_coordinator" && c.isAlsoTransporter === true)
      )
    ),
    [globalData.companies.value]
  )

  // Check if user can allocate this order
  const canAllocateOrder = useMemo(() => {
    if (!company || !order || !canAllocate) return false
    // Only LC companies can allocate
    if (company.companyType !== "logistics_coordinator") return false
    // Order must be pending or already allocated to this LC
    return order.status === "pending" || order.allocations.some(a => a.companyId === company.id)
  }, [company, order, canAllocate])

  // Fetch trucks for existing allocations when order loads
  useEffect(() => {
    if (order?.allocations && order.allocations.length > 0) {
      // Fetch trucks for all existing allocations
      order.allocations.forEach(allocation => {
        fetchTrucksForTransporter(allocation.companyId)
      })
    }
  }, [order?.id]) // Only run when order changes

  // Helper function to calculate truck capacity over order duration (LC-specific)
  const calculateTruckCapacityOverDuration = () => {
    if (!order || !company) return 0

    const truckCapacity = company.orderConfig?.defaultWeightPerTruck ?? 0

    // Calculate trips per day
    let tripsPerDay = 1
    if (order.tripLimit) {
      tripsPerDay = order.tripLimit
    } else if (order.tripDuration && order.collectionSiteId) {
      const collectionSite = sites.find(s => s.id === order.collectionSiteId)
      if (collectionSite?.operatingHours) {
        const calculateDailyOperatingHours = () => {
          const hours = collectionSite.operatingHours
          if (!hours || typeof hours !== "object") return 12
          const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
          const daySchedule = hours[today as keyof typeof hours]
          if (!daySchedule || typeof daySchedule !== "object" || !("open" in daySchedule)) return 12
          const { open, close } = daySchedule as { open: string; close: string }
          if (open === "closed" || close === "closed") return 0
          const openHour = parseInt(open.split(":")[0])
          const closeHour = parseInt(close.split(":")[0])
          return closeHour - openHour
        }

        const operatingHours = calculateDailyOperatingHours()
        const tripDuration = order.tripDuration
        if (tripDuration <= 24) {
          if (tripDuration <= operatingHours) {
            tripsPerDay = Math.floor(operatingHours / tripDuration)
          } else {
            tripsPerDay = 1
          }
        } else {
          tripsPerDay = 1 / Math.ceil(tripDuration / 24)
        }
      }
    }

    // Calculate order duration in days
    const orderDurationDays = Math.max(
      1,
      Math.ceil((new Date(order.dispatchEndDate).getTime() - new Date(order.dispatchStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    )

    const weightPerDayPerTruck = tripsPerDay * truckCapacity
    return weightPerDayPerTruck * orderDurationDays
  }

  // Helper function to calculate minimum trucks needed for a given weight
  const calculateMinimumTrucks = (allocatedWeight: number): number => {
    const weightPerTruckOverDuration = calculateTruckCapacityOverDuration()
    if (weightPerTruckOverDuration === 0) return 0
    return Math.ceil(allocatedWeight / weightPerTruckOverDuration)
  }

  // Handler for adding transporter
  const handleAddTransporter = async () => {
    if (!selectedTransporterId) return

    // Check if transporter is already added
    if (allocations.some(a => a.companyId === selectedTransporterId)) {
      toast.error("Transporter already added")
      return
    }

    // Fetch trucks for this transporter
    await fetchTrucksForTransporter(selectedTransporterId)

    setAllocations([
      ...allocations,
      {
        companyId: selectedTransporterId,
        numberOfTrucks: 0,
        allocatedWeight: 0,
        loadingDates: [order!.dispatchStartDate],
        completedWeight: 0,
        status: "pending",
      },
    ])
    setSelectedTransporterId("")
  }

  // Handler for updating allocated weight (PRIMARY INPUT)
  const handleUpdateWeight = (index: number, weight: number) => {
    const minimumTrucks = calculateMinimumTrucks(weight)

    setAllocations(prev =>
      prev.map((a, i) =>
        i === index
          ? {
              ...a,
              allocatedWeight: weight,
              numberOfTrucks: minimumTrucks, // Auto-set to minimum required
            }
          : a
      )
    )
  }

  // Handler for updating truck count (SECONDARY - can only increase from minimum)
  const handleUpdateTrucks = (index: number, trucks: number) => {
    setAllocations(prev =>
      prev.map((a, i) => (i === index ? { ...a, numberOfTrucks: trucks } : a))
    )
  }

  // Handler for removing allocation
  const handleRemoveAllocation = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!order || !company) return

    // Validate each allocation
    for (const allocation of allocations) {
      const transporter = transporterCompanies.find(t => t.id === allocation.companyId)
      const transporterName = transporter?.name || "Unknown Transporter"

      // 1. Weight must be > 0
      if (allocation.allocatedWeight <= 0) {
        showError("Invalid Allocation", `${transporterName}: Please allocate weight to this transporter`)
        return
      }

      // 2. Calculate minimum trucks needed
      const minimumTrucks = calculateMinimumTrucks(allocation.allocatedWeight)
      const availableTrucks = getAvailableTrucks(allocation.companyId)

      // 3. Check sufficient trucks available
      if (minimumTrucks > availableTrucks) {
        showError(
          "Insufficient Trucks",
          `${transporterName} requires ${minimumTrucks} trucks for ${allocation.allocatedWeight.toLocaleString()} kg, but only has ${availableTrucks} trucks available. Please reduce weight or choose a different transporter.`
        )
        return
      }

      // 4. Check trucks >= minimum
      if (allocation.numberOfTrucks < minimumTrucks) {
        showError("Insufficient Trucks", `${transporterName}: Minimum ${minimumTrucks} trucks required for ${allocation.allocatedWeight.toLocaleString()} kg`)
        return
      }

      // 5. Check trucks <= available
      if (allocation.numberOfTrucks > availableTrucks) {
        showError("Insufficient Trucks", `${transporterName} only has ${availableTrucks} trucks available, but ${allocation.numberOfTrucks} were allocated`)
        return
      }
    }

    // Validate total allocated weight EXACTLY equals order weight
    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedWeight, 0)

    if (totalAllocated < order.totalWeight) {
      const remaining = order.totalWeight - totalAllocated
      showError(
        "Under-allocated",
        `Total allocated weight (${totalAllocated.toLocaleString()} kg) is less than order weight (${order.totalWeight.toLocaleString()} kg). Please allocate remaining ${remaining.toLocaleString()} kg.`
      )
      return
    }

    if (totalAllocated > order.totalWeight) {
      const excess = totalAllocated - order.totalWeight
      showError(
        "Over-allocated",
        `Total allocated weight (${totalAllocated.toLocaleString()} kg) exceeds order weight (${order.totalWeight.toLocaleString()} kg). Please reduce allocations by ${excess.toLocaleString()} kg.`
      )
      return
    }

    // Validate daily weight limit constraint
    const orderDurationDays = Math.max(
      1,
      Math.ceil((new Date(order.dispatchEndDate).getTime() - new Date(order.dispatchStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    )
    const totalDailyWeight = allocations.reduce((sum, a) => sum + a.allocatedWeight / orderDurationDays, 0)
    const dailyWeightLimit = order.dailyWeightLimit

    if (totalDailyWeight > dailyWeightLimit) {
      const excess = totalDailyWeight - dailyWeightLimit
      showError(
        "Daily Limit Exceeded",
        `Total daily weight required (${Math.round(totalDailyWeight).toLocaleString()} kg/day) exceeds daily weight limit (${dailyWeightLimit.toLocaleString()} kg/day) by ${Math.round(excess).toLocaleString()} kg/day. The allocated weights cannot be fulfilled within the daily limit constraints. Please reduce allocations or extend the order duration.`
      )
      return
    }

    // Validate daily truck limit constraint
    const totalTrucks = allocations.reduce((sum, a) => sum + a.numberOfTrucks, 0)
    const dailyTruckLimit = order.dailyTruckLimit

    if (totalTrucks > dailyTruckLimit) {
      const excess = totalTrucks - dailyTruckLimit
      showError(
        "Daily Truck Limit Exceeded",
        `Total trucks allocated (${totalTrucks}) exceeds daily truck limit (${dailyTruckLimit}) by ${excess} truck${excess > 1 ? 's' : ''}. Please reduce the number of trucks allocated to transporters.`
      )
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
  const allocationPercent = order.totalWeight > 0 ? (totalAllocated / order.totalWeight) * 100 : 0
  const weightPerTruckOverDuration = calculateTruckCapacityOverDuration()

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Weight</p>
            <p className="font-medium">{order.totalWeight.toLocaleString()} kg</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date Range</p>
            <p className="font-medium text-sm">
              {order.dispatchStartDate} to {order.dispatchEndDate}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Daily Weight Limit</p>
            <p className="font-medium">{order.dailyWeightLimit.toLocaleString()} kg/day</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Trip Configuration</p>
            <p className="font-medium text-sm">
              {order.tripLimit ? `${order.tripLimit} trips/day` : `${order.tripDuration}h per trip`}
            </p>
          </div>
        </div>
      </div>

      {/* Transporter Selection */}
      <div className="glass-surface rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Add Transporters</h2>
        <div className="flex gap-2">
          <div className="flex-1">
            <Select value={selectedTransporterId} onValueChange={setSelectedTransporterId} disabled={isAnyLoading()}>
              <SelectTrigger className="w-full glass-surface border-[var(--glass-border-soft)] shadow-[var(--glass-shadow-xs)] bg-[oklch(1_0_0_/_0.72)] backdrop-blur-[18px]">
                <SelectValue placeholder="Select transporter to add..." />
              </SelectTrigger>
              <SelectContent>
                {transporterCompanies
                  .filter(t => !allocations.some(a => a.companyId === t.id))
                  .map(transporter => (
                    <SelectItem key={transporter.id} value={transporter.id}>
                      {transporter.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddTransporter} disabled={!selectedTransporterId || isAnyLoading()}>
            {isAnyLoading() ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              "Add"
            )}
          </Button>
        </div>
      </div>

      {/* Allocation Cards */}
      {allocations.length > 0 && (
        <div className="space-y-3">
          {allocations.map((allocation, index) => {
            const transporter = transporterCompanies.find(t => t.id === allocation.companyId)
            const availableTrucks = getAvailableTrucks(allocation.companyId)
            const isLoading = isLoadingTrucks(allocation.companyId)
            const minimumTrucks = calculateMinimumTrucks(allocation.allocatedWeight)
            const weightPercentage = order.totalWeight > 0 ? ((allocation.allocatedWeight / order.totalWeight) * 100).toFixed(1) : "0.0"
            const totalCapacity = allocation.numberOfTrucks * weightPerTruckOverDuration
            const insufficientTrucks = minimumTrucks > availableTrucks
            const exceedsAvailable = allocation.numberOfTrucks > availableTrucks

            return (
              <div key={index} className="glass-surface rounded-lg p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{transporter?.name || "Unknown Transporter"}</h4>
                    {isLoading ? (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Loading truck count...</span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">{availableTrucks} trucks available</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveAllocation(index)} className="text-destructive hover:text-destructive">
                    Remove
                  </Button>
                </div>

                {/* Per Truck Capacity Info */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3 text-xs space-y-1">
                  <p className="font-semibold text-blue-700 dark:text-blue-300">Per Truck Capacity (Over Order Duration):</p>
                  <p className="text-muted-foreground">• {weightPerTruckOverDuration.toLocaleString()} kg per truck over order duration</p>
                </div>

                {/* Allocated Weight Input (PRIMARY) */}
                <div className="space-y-2">
                  <Label>
                    Allocated Weight (kg) <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max={order.totalWeight}
                      value={allocation.allocatedWeight || ""}
                      onChange={e => {
                        const weight = parseInt(e.target.value) || 0
                        handleUpdateWeight(index, weight)
                      }}
                      placeholder="Enter weight to allocate..."
                      className={allocation.allocatedWeight > order.totalWeight ? "border-destructive" : ""}
                      disabled={isLoading}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                      {weightPercentage}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {allocation.allocatedWeight.toLocaleString()} / {order.totalWeight.toLocaleString()} kg
                  </p>
                  {allocation.allocatedWeight > order.totalWeight && (
                    <p className="text-xs text-destructive">Cannot exceed order total ({order.totalWeight.toLocaleString()} kg)</p>
                  )}
                </div>

                {/* Truck Requirements Info */}
                {allocation.allocatedWeight > 0 && (
                  <div className={`rounded p-3 text-xs space-y-1 ${insufficientTrucks ? "bg-red-500/10 border border-red-500/20" : "bg-green-500/10 border border-green-500/20"}`}>
                    <p className={`font-semibold ${insufficientTrucks ? "text-red-700 dark:text-red-300" : "text-green-700 dark:text-green-300"}`}>
                      Truck Requirements:
                    </p>
                    <p className="text-muted-foreground">• Minimum Required: {minimumTrucks} trucks</p>
                    <p className="text-muted-foreground">• Assigned: {allocation.numberOfTrucks} trucks</p>
                    <p className="text-muted-foreground">
                      • Total Capacity: {totalCapacity.toLocaleString()} kg
                      {totalCapacity > allocation.allocatedWeight && <span className="text-blue-600"> (over-capacity OK)</span>}
                    </p>
                    {insufficientTrucks && (
                      <p className="text-red-600 font-semibold mt-2">
                        ⚠️ Requires {minimumTrucks} trucks but only {availableTrucks} available. Reduce weight or choose different transporter.
                      </p>
                    )}
                  </div>
                )}

                {/* Truck Count Stepper (SECONDARY) */}
                {allocation.allocatedWeight > 0 && (
                  <div className="space-y-2">
                    <Label>Number of Trucks (minimum: {minimumTrucks})</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (allocation.numberOfTrucks > minimumTrucks) {
                            handleUpdateTrucks(index, allocation.numberOfTrucks - 1)
                          } else {
                            toast.error(`Cannot reduce below minimum ${minimumTrucks} trucks required for ${allocation.allocatedWeight.toLocaleString()} kg`)
                          }
                        }}
                        disabled={isLoading || allocation.numberOfTrucks <= minimumTrucks}
                        className="h-10 w-10"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="flex-1 text-center">
                        <div className="text-2xl font-semibold">{allocation.numberOfTrucks}</div>
                        <div className="text-xs text-muted-foreground">of {availableTrucks} available</div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (allocation.numberOfTrucks < availableTrucks) {
                            handleUpdateTrucks(index, allocation.numberOfTrucks + 1)
                          } else {
                            toast.error(`Maximum ${availableTrucks} trucks available for this transporter`)
                          }
                        }}
                        disabled={isLoading || allocation.numberOfTrucks >= availableTrucks}
                        className="h-10 w-10"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {allocation.numberOfTrucks < minimumTrucks && (
                      <p className="text-xs text-destructive">Minimum {minimumTrucks} trucks required for {allocation.allocatedWeight.toLocaleString()} kg</p>
                    )}
                    {exceedsAvailable && <p className="text-xs text-destructive">Exceeds available trucks ({availableTrucks})</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Allocation Summary */}
      {allocations.length > 0 && (
        <div className="glass-surface rounded-lg p-4 space-y-3">
          <h4 className="font-semibold">Allocation Summary</h4>

          {/* Per-Transporter Breakdown */}
          <div className="space-y-2 border-b pb-3">
            {allocations.map((allocation, index) => {
              const transporter = transporterCompanies.find(t => t.id === allocation.companyId)
              const percentage = order.totalWeight > 0 ? ((allocation.allocatedWeight / order.totalWeight) * 100).toFixed(1) : "0.0"
              return (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{transporter?.name}:</span>
                  <span className="font-medium">
                    {allocation.allocatedWeight.toLocaleString()} kg ({percentage}%) - {allocation.numberOfTrucks} trucks
                  </span>
                </div>
              )
            })}
          </div>

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Allocated:</span>
              <span className={totalAllocated === order.totalWeight ? "text-green-600 font-semibold" : "font-semibold"}>
                {totalAllocated.toLocaleString()} / {order.totalWeight.toLocaleString()} kg
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Remaining:</span>
              <span
                className={
                  remainingWeight === 0 ? "text-green-600 font-semibold" : remainingWeight > 0 ? "text-yellow-600 font-semibold" : "text-red-600 font-semibold"
                }
              >
                {Math.abs(remainingWeight).toLocaleString()} kg{remainingWeight < 0 && " (over)"}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${allocationPercent === 100 ? "bg-green-500" : allocationPercent > 100 ? "bg-red-500" : "bg-primary"}`}
                  style={{ width: `${Math.min(allocationPercent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-right text-muted-foreground">{allocationPercent.toFixed(1)}%</p>
            </div>

            {/* Status Messages */}
            {remainingWeight > 0 && (
              <p className="text-xs text-yellow-600 mt-2">⚠️ Under-allocated by {remainingWeight.toLocaleString()} kg. Please allocate remaining weight.</p>
            )}
            {remainingWeight < 0 && (
              <p className="text-xs text-red-600 mt-2">
                ⚠️ Over-allocated by {Math.abs(remainingWeight).toLocaleString()} kg. Total cannot exceed order weight.
              </p>
            )}
            {totalAllocated === order.totalWeight && <p className="text-xs text-green-600 mt-2">✓ Order is fully allocated</p>}
          </div>

          {/* Total Trucks */}
          <div className="border-t pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Trucks:</span>
              <span className="font-semibold">{allocations.reduce((sum, a) => sum + a.numberOfTrucks, 0)} trucks</span>
            </div>
          </div>

          {/* Daily Weight Limit Check */}
          <div className="border-t pt-3 space-y-2">
            {(() => {
              const orderDurationDays = Math.max(
                1,
                Math.ceil((new Date(order.dispatchEndDate).getTime() - new Date(order.dispatchStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
              )
              const totalDailyWeight = allocations.reduce((sum, a) => sum + a.allocatedWeight / orderDurationDays, 0)
              const dailyWeightLimit = order.dailyWeightLimit
              const dailyUsagePercent = dailyWeightLimit > 0 ? (totalDailyWeight / dailyWeightLimit) * 100 : 0
              const exceedsDailyLimit = totalDailyWeight > dailyWeightLimit

              return (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Daily Weight Required:</span>
                    <span className={exceedsDailyLimit ? "text-red-600 font-semibold" : "font-semibold"}>
                      {Math.round(totalDailyWeight).toLocaleString()} / {dailyWeightLimit.toLocaleString()} kg/day
                    </span>
                  </div>

                  {/* Daily Limit Progress Bar */}
                  <div className="space-y-1">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          dailyUsagePercent <= 100 ? "bg-blue-500" : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(dailyUsagePercent, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-right text-muted-foreground">{dailyUsagePercent.toFixed(1)}% of daily limit</p>
                  </div>

                  {exceedsDailyLimit && (
                    <p className="text-xs text-red-600">
                      ⚠️ Daily weight required ({Math.round(totalDailyWeight).toLocaleString()} kg/day) exceeds daily limit ({dailyWeightLimit.toLocaleString()} kg/day). Reduce allocations or extend order duration.
                    </p>
                  )}

                  {!exceedsDailyLimit && totalDailyWeight > 0 && dailyUsagePercent > 80 && (
                    <p className="text-xs text-yellow-600">
                      ⚠️ Using {dailyUsagePercent.toFixed(1)}% of daily weight limit. Consider the daily limit constraint when planning operations.
                    </p>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      )}

      {allocations.length === 0 && (
        <div className="glass-surface rounded-lg p-6 text-center text-muted-foreground">
          <p className="text-sm">No transporters allocated yet. Select a transporter above to begin allocation.</p>
        </div>
      )}

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
