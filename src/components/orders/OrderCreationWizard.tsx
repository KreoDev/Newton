"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Company, User, Order, Allocation } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { WizardSteps } from "@/components/ui/wizard-steps"
import { OrderService } from "@/services/order.service"
import { data as globalData } from "@/services/data.service"
import { utilityService } from "@/services/utility.service"
import { useSignals } from "@preact/signals-react/runtime"
import { useAlert } from "@/hooks/useAlert"
import { useTransporterTrucks } from "@/hooks/useTransporterTrucks"
import { toast } from "sonner"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, Plus, Minus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"

interface OrderCreationWizardProps {
  company: Company
  user: User
}

interface OrderFormData {
  orderNumber: string
  orderType: "receiving" | "dispatching"
  clientCompanyId: string
  dispatchStartDate: string
  dispatchEndDate: string
  totalWeight: number
  collectionSiteId: string
  destinationSiteId: string
  productId: string
  sealRequired: boolean
  sealQuantity: number
  dailyTruckLimit: number
  dailyWeightLimit: number
  monthlyLimit: number
  tripLimit: number
  tripDuration: number
  tripConfigMode: "trips" | "duration"
  allocationMode: "lc" | "transporters"
  lcCompanyId: string
  allocations: Allocation[]
}

export function OrderCreationWizard({ company, user }: OrderCreationWizardProps) {
  useSignals()
  const router = useRouter()
  const { showSuccess, showError } = useAlert()

  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [orderNumberMode, setOrderNumberMode] = useState<"auto" | "manual">("auto")
  const [validatingOrderNumber, setValidatingOrderNumber] = useState(false)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)

  // Form data with defaults from company.orderConfig
  const [formData, setFormData] = useState<OrderFormData>({
    orderNumber: "",
    orderType: "dispatching",
    clientCompanyId: "",
    dispatchStartDate: format(new Date(), "yyyy-MM-dd"),
    dispatchEndDate: format(new Date(), "yyyy-MM-dd"),
    totalWeight: company.orderConfig?.minTotalWeight ?? 0,
    collectionSiteId: "",
    destinationSiteId: "",
    productId: "",
    sealRequired: company.orderConfig?.defaultSealRequired ?? true,
    sealQuantity: company.orderConfig?.defaultSealQuantity ?? 2,
    dailyTruckLimit: company.orderConfig?.defaultDailyTruckLimit ?? 10,
    dailyWeightLimit: company.orderConfig?.defaultDailyWeightLimit ?? 100,
    monthlyLimit: company.orderConfig?.defaultMonthlyLimit ?? 1000,
    tripLimit: company.orderConfig?.defaultTripLimit ?? 1,
    tripDuration: 4,
    tripConfigMode: "trips",
    allocationMode: "lc",
    lcCompanyId: "",
    allocations: [],
  })

  // Get data from globalData
  const clients = globalData.clients.value.filter(c => c.isActive)
  const products = globalData.products.value.filter(p => p.isActive)
  const sites = globalData.sites.value.filter(s => s.isActive)
  const companies = globalData.companies.value.filter(c => c.isActive)

  // Generate order number on mount or when mode changes to auto
  useEffect(() => {
    if (orderNumberMode === "auto") {
      OrderService.generateOrderNumber(company.orderConfig?.orderNumberPrefix || "ORD-").then(num => setFormData(prev => ({ ...prev, orderNumber: num })))
    }
  }, [orderNumberMode, company.orderConfig?.orderNumberPrefix])

  const collectionSites = sites.filter(s => s.siteType === "collection")
  const destinationSites = sites.filter(s => s.siteType === "destination")

  // LC companies: logistics_coordinator OR transporter with isAlsoLogisticsCoordinator flag
  const lcCompanies = companies.filter(c =>
    c.companyType === "logistics_coordinator" ||
    (c.companyType === "transporter" && c.isAlsoLogisticsCoordinator === true)
  )

  // Transporter companies: transporter OR logistics_coordinator with isAlsoTransporter flag
  const transporterCompanies = companies.filter(c =>
    c.companyType === "transporter" ||
    (c.companyType === "logistics_coordinator" && c.isAlsoTransporter === true)
  )

  // State for transporter selection in Step 8
  const [selectedTransporterId, setSelectedTransporterId] = useState<string>("")

  // Use custom truck fetching hook
  const { fetchTrucksForTransporter, getAvailableTrucks, isLoadingTrucks, isAnyLoading } = useTransporterTrucks()

  // Helper functions for allocation management
  const handleAddTransporter = async () => {
    if (!selectedTransporterId) return

    // Check if transporter is already added
    if (formData.allocations.some(a => a.companyId === selectedTransporterId)) {
      toast.error("Transporter already added")
      return
    }

    // Fetch trucks for this transporter
    await fetchTrucksForTransporter(selectedTransporterId)

    // Get transporter company name
    const transporterCompany = transporterCompanies.find(c => c.id === selectedTransporterId)
    const companyName = transporterCompany?.name ?? "Unknown"

    setFormData(prev => ({
      ...prev,
      allocations: [
        ...prev.allocations,
        {
          companyId: selectedTransporterId,
          companyName, // Add denormalized company name
          numberOfTrucks: 0,
          allocatedWeight: 0,
          loadingDates: [],
          completedWeight: 0,
          status: "pending",
        },
      ],
    }))
    setSelectedTransporterId("")
  }

  // Helper function to calculate truck capacity over order duration
  const calculateTruckCapacityOverDuration = () => {
    const truckCapacity = company.orderConfig?.defaultWeightPerTruck ?? 0

    // Calculate trips per day
    let tripsPerDay = 1
    if (formData.tripConfigMode === "trips") {
      tripsPerDay = formData.tripLimit
    } else if (formData.tripConfigMode === "duration" && formData.collectionSiteId) {
      const collectionSite = sites.find(s => s.id === formData.collectionSiteId)
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
        const { tripDuration } = formData
        if (tripDuration <= 24) {
          // If trip fits within operating hours, calculate multiple trips per day
          if (tripDuration <= operatingHours) {
            tripsPerDay = Math.floor(operatingHours / tripDuration)
          } else {
            // Trip exceeds operating hours but ≤24 hours
            // Can still do 1 trip per day (truck starts within operating window)
            tripsPerDay = 1
          }
        } else {
          // Multi-day trip (>24 hours)
          tripsPerDay = 1 / Math.ceil(tripDuration / 24)
        }
      }
    }

    // Calculate order duration in days
    const orderDurationDays = Math.max(
      1,
      Math.ceil((new Date(formData.dispatchEndDate).getTime() - new Date(formData.dispatchStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
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

  // Handler for updating allocated weight (PRIMARY INPUT)
  const handleUpdateWeight = (index: number, weight: number) => {
    const minimumTrucks = calculateMinimumTrucks(weight)

    setFormData(prev => ({
      ...prev,
      allocations: prev.allocations.map((a, i) =>
        i === index
          ? {
              ...a,
              allocatedWeight: weight,
              numberOfTrucks: minimumTrucks, // Auto-set to minimum required
            }
          : a
      ),
    }))
  }

  // Handler for updating truck count (SECONDARY - can only increase from minimum)
  const handleUpdateTrucks = (index: number, trucks: number) => {
    setFormData(prev => ({
      ...prev,
      allocations: prev.allocations.map((a, i) => (i === index ? { ...a, numberOfTrucks: trucks } : a)),
    }))
  }

  const handleRemoveAllocation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      allocations: prev.allocations.filter((_, i) => i !== index),
    }))
  }

  // Calculate allocation summary
  const totalAllocated = formData.allocations.reduce((sum, a) => sum + a.allocatedWeight, 0)
  const remainingWeight = formData.totalWeight - totalAllocated
  const allocationPercent = formData.totalWeight > 0 ? (totalAllocated / formData.totalWeight) * 100 : 0

  // Review step data
  const reviewClient = clients.find(c => c.id === formData.clientCompanyId)
  const reviewProduct = products.find(p => p.id === formData.productId)
  const reviewCollectionSite = sites.find(s => s.id === formData.collectionSiteId)
  const reviewDestinationSite = sites.find(s => s.id === formData.destinationSiteId)

  const validateStep = async (step: number): Promise<boolean> => {
    switch (step) {
      case 1: // Order Number
        if (!formData.orderNumber || formData.orderNumber.trim() === "") {
          showError("Order Number Required", "Please enter an order number")
          return false
        }
        // Check for invalid values like "0", "00", "000", etc.
        if (/^0+$/.test(formData.orderNumber.trim())) {
          showError("Invalid Order Number", "Order number cannot be just zeros (0, 00, 000, etc.)")
          return false
        }

        // For manual entries, validate against ALL orders in Firebase
        if (orderNumberMode === "manual") {
          setValidatingOrderNumber(true)
          try {
            const globalValidation = await OrderService.validateOrderNumberGlobal(formData.orderNumber, company.id)
            if (!globalValidation.isValid) {
              showError("Invalid Order Number", globalValidation.error!)
              return false
            }
          } catch (error) {
            showError("Validation Error", "Failed to validate order number")
            return false
          } finally {
            setValidatingOrderNumber(false)
          }
        } else {
          // For auto-generated, quick in-memory check is sufficient
          const validation = OrderService.validateOrderNumber(formData.orderNumber)
          if (!validation.isValid) {
            showError("Invalid Order Number", validation.error!)
            return false
          }
        }
        return true

      case 2: // Basic Info
        if (!formData.clientCompanyId) {
          showError("Client Required", "Please select a client")
          return false
        }
        if (!formData.dispatchStartDate || !formData.dispatchEndDate) {
          showError("Date Range Required", "Please select dispatch dates")
          return false
        }
        if (formData.totalWeight <= 0) {
          showError("Weight Required", "Please enter total weight")
          return false
        }
        const minWeight = company.orderConfig?.minTotalWeight ?? 0
        if (minWeight > 0 && formData.totalWeight < minWeight) {
          showError("Minimum Weight Not Met", `Total weight must be at least ${minWeight} kg`)
          return false
        }
        const dateValidation = OrderService.validateDateRange(formData.dispatchStartDate, formData.dispatchEndDate)
        if (!dateValidation.isValid) {
          showError("Invalid Dates", dateValidation.error!)
          return false
        }
        return true

      case 3: // Sites
        // Dispatching orders only need collection site (leaving the mine)
        // Receiving orders only need destination site (coming into the mine)
        if (formData.orderType === "dispatching") {
          if (!formData.collectionSiteId) {
            showError("Collection Site Required", "Please select a collection site")
            return false
          }
        } else if (formData.orderType === "receiving") {
          if (!formData.destinationSiteId) {
            showError("Destination Site Required", "Please select a destination site")
            return false
          }
        }
        return true

      case 4: // Product
        if (!formData.productId) {
          showError("Product Required", "Please select a product")
          return false
        }
        return true

      case 5: // Seals
        if (formData.sealRequired && formData.sealQuantity <= 0) {
          showError("Seal Quantity Required", "Please enter seal quantity")
          return false
        }
        return true

      case 6: // Limits
        if (formData.dailyWeightLimit <= 0) {
          showError("Daily Weight Limit Required", "Please enter a valid daily weight limit")
          return false
        }
        return true

      case 7: // Trip Config
        if (formData.tripConfigMode === "trips" && formData.tripLimit <= 0) {
          showError("Trip Limit Required", "Please enter valid trip limit")
          return false
        }
        if (formData.tripConfigMode === "duration" && formData.tripDuration <= 0) {
          showError("Trip Duration Required", "Please enter valid trip duration")
          return false
        }
        return true

      case 8: // Allocation
        if (formData.allocationMode === "lc" && !formData.lcCompanyId) {
          showError("LC Required", "Please select a logistics coordinator")
          return false
        }
        if (formData.allocationMode === "transporters") {
          if (formData.allocations.length === 0) {
            showError("Allocations Required", "Please add at least one transporter allocation")
            return false
          }

          // Validate each allocation
          for (const allocation of formData.allocations) {
            const transporter = transporterCompanies.find(t => t.id === allocation.companyId)
            const transporterName = transporter?.name || "Unknown Transporter"

            // 1. Weight must be > 0
            if (allocation.allocatedWeight <= 0) {
              showError("Invalid Allocation", `${transporterName}: Please allocate weight to this transporter`)
              return false
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
              return false
            }

            // 4. Check trucks >= minimum
            if (allocation.numberOfTrucks < minimumTrucks) {
              showError("Insufficient Trucks", `${transporterName}: Minimum ${minimumTrucks} trucks required for ${allocation.allocatedWeight.toLocaleString()} kg`)
              return false
            }

            // 5. Check trucks <= available
            if (allocation.numberOfTrucks > availableTrucks) {
              showError("Insufficient Trucks", `${transporterName} only has ${availableTrucks} trucks available, but ${allocation.numberOfTrucks} were allocated`)
              return false
            }
          }

          // Validate total allocated weight EXACTLY equals order weight
          const totalAllocated = formData.allocations.reduce((sum, a) => sum + a.allocatedWeight, 0)

          if (totalAllocated < formData.totalWeight) {
            const remaining = formData.totalWeight - totalAllocated
            showError(
              "Under-allocated",
              `Total allocated weight (${totalAllocated.toLocaleString()} kg) is less than order weight (${formData.totalWeight.toLocaleString()} kg). Please allocate remaining ${remaining.toLocaleString()} kg.`
            )
            return false
          }

          if (totalAllocated > formData.totalWeight) {
            const excess = totalAllocated - formData.totalWeight
            showError(
              "Over-allocated",
              `Total allocated weight (${totalAllocated.toLocaleString()} kg) exceeds order weight (${formData.totalWeight.toLocaleString()} kg). Please reduce allocations by ${excess.toLocaleString()} kg.`
            )
            return false
          }

          // Validate daily weight limit constraint
          const orderDurationDays = Math.max(
            1,
            Math.ceil((new Date(formData.dispatchEndDate).getTime() - new Date(formData.dispatchStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
          )
          const totalDailyWeight = formData.allocations.reduce((sum, a) => sum + a.allocatedWeight / orderDurationDays, 0)
          const dailyWeightLimit = formData.dailyWeightLimit

          if (totalDailyWeight > dailyWeightLimit) {
            const excess = totalDailyWeight - dailyWeightLimit
            showError(
              "Daily Limit Exceeded",
              `Total daily weight required (${Math.round(totalDailyWeight).toLocaleString()} kg/day) exceeds daily weight limit (${dailyWeightLimit.toLocaleString()} kg/day) by ${Math.round(excess).toLocaleString()} kg/day. The allocated weights cannot be fulfilled within the daily limit constraints. Please reduce allocations or extend the order duration.`
            )
            return false
          }

          // Validate daily truck limit constraint
          const totalTrucks = formData.allocations.reduce((sum, a) => sum + a.numberOfTrucks, 0)
          const dailyTruckLimit = formData.dailyTruckLimit

          if (totalTrucks > dailyTruckLimit) {
            const excess = totalTrucks - dailyTruckLimit
            showError(
              "Daily Truck Limit Exceeded",
              `Total trucks allocated (${totalTrucks}) exceeds daily truck limit (${dailyTruckLimit}) by ${excess} truck${excess > 1 ? 's' : ''}. Please reduce the number of trucks allocated to transporters.`
            )
            return false
          }
        }
        return true

      default:
        return true
    }
  }

  const handleNext = async () => {
    const isValid = await validateStep(currentStep)
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 9))
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(8)) return // Validate allocation step

    setLoading(true)
    try {
      // Build allocations array
      // Determine allocation structure based on mode
      let allocations: Allocation[] = []
      let assignedToLCId: string | undefined = undefined

      if (formData.allocationMode === "lc" && formData.lcCompanyId) {
        // Assign to LC - no allocations yet, LC will create them
        assignedToLCId = formData.lcCompanyId
        allocations = [] // Empty - LC hasn't allocated to transporters yet
      } else if (formData.allocationMode === "transporters") {
        // Direct allocation to transporters - add denormalized company names
        allocations = formData.allocations.map(alloc => {
          const transporterCompany = transporterCompanies.find(c => c.id === alloc.companyId)
          return {
            ...alloc,
            companyName: transporterCompany?.name ?? "Unknown",
          }
        })
      }

      // Extract transporter company IDs for Firestore querying (empty array if no allocations)
      const allocatedCompanyIds = allocations.map(a => a.companyId)

      // Get denormalized data for order
      const product = products.find(p => p.id === formData.productId)
      const client = clients.find(c => c.id === formData.clientCompanyId)
      const collectionSite = sites.find(s => s.id === formData.collectionSiteId)
      const destinationSite = sites.find(s => s.id === formData.destinationSiteId)
      const lcCompany = assignedToLCId ? transporterCompanies.find(c => c.id === assignedToLCId) : null

      const orderData: Omit<Order, "id" | "createdAt" | "updatedAt" | "dbCreatedAt" | "dbUpdatedAt"> = {
        companyId: company.id,
        orderNumber: formData.orderNumber,
        orderType: formData.orderType,

        // Foreign key IDs
        clientCompanyId: formData.clientCompanyId,
        collectionSiteId: formData.collectionSiteId,
        destinationSiteId: formData.destinationSiteId,
        productId: formData.productId,
        assignedToLCId,

        // DENORMALIZED DATA - for cross-company access
        productName: product?.name ?? "Unknown",
        productCode: product?.code ?? "",
        clientName: client?.name ?? "Unknown",
        collectionSiteName: collectionSite?.name ?? "Unknown",
        collectionSiteAddress: collectionSite?.physicalAddress,
        destinationSiteName: destinationSite?.name ?? "Unknown",
        destinationSiteAddress: destinationSite?.physicalAddress,
        companyName: company.name,
        defaultWeightPerTruck: company.orderConfig?.defaultWeightPerTruck ?? 0,
        assignedToLCName: lcCompany?.name,

        // Order details
        dispatchStartDate: formData.dispatchStartDate,
        dispatchEndDate: formData.dispatchEndDate,
        totalWeight: formData.totalWeight,
        sealRequired: formData.sealRequired,
        sealQuantity: formData.sealQuantity,
        dailyTruckLimit: formData.dailyTruckLimit,
        dailyWeightLimit: formData.dailyWeightLimit,
        monthlyLimit: formData.monthlyLimit,
        tripLimit: formData.tripLimit,
        tripDuration: formData.tripConfigMode === "duration" ? formData.tripDuration : undefined,

        // Allocations and status
        allocations, // With denormalized company names
        allocatedCompanyIds, // Flat array for Firestore querying
        status: "pending", // Will be set automatically by service
        createdById: user.id,
      }

      const orderId = await OrderService.create(orderData, "Order created successfully")

      // Show success alert
      await showSuccess("Order Created", `Order ${formData.orderNumber} has been successfully created and saved to the system.`)

      // Redirect to order details
      router.push(`/orders/${orderId}`)
    } catch (error) {
      console.error("Error creating order:", error)
      toast.error("Failed to create order")
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1: // Order Number
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Order Number</h2>
              <p className="text-muted-foreground">Configure the order number for this order</p>
            </div>

            {company.orderConfig?.orderNumberMode === "autoOnly" ? (
              <div>
                <Label>Order Number (Auto-Generated)</Label>
                <Input value={formData.orderNumber} disabled className="mt-2" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Order Number Mode</Label>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="orderNumberMode" checked={orderNumberMode === "auto"} onChange={() => setOrderNumberMode("auto")} className="cursor-pointer" />
                      <span>Use Auto-Generated</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="orderNumberMode"
                        checked={orderNumberMode === "manual"}
                        onChange={() => {
                          setOrderNumberMode("manual")
                          setFormData(prev => ({ ...prev, orderNumber: "" }))
                        }}
                        className="cursor-pointer"
                      />
                      <span>Enter Manual Order Number</span>
                    </label>
                  </div>
                </div>

                <div>
                  <Label>Order Number</Label>
                  <Input value={formData.orderNumber} onChange={e => setFormData(prev => ({ ...prev, orderNumber: e.target.value }))} disabled={orderNumberMode === "auto"} className="mt-2" placeholder={orderNumberMode === "auto" ? "Auto-generated..." : "Enter order number..."} />
                </div>
              </div>
            )}
          </div>
        )

      case 2: // Basic Info
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Basic Information</h2>
              <p className="text-muted-foreground">Enter the basic order details</p>
            </div>

            <div>
              <Label>Order Type</Label>
              <Select value={formData.orderType} onValueChange={value => setFormData(prev => ({ ...prev, orderType: value as "receiving" | "dispatching" }))}>
                <SelectTrigger className="mt-2 w-full glass-surface border-[var(--glass-border-soft)] shadow-[var(--glass-shadow-xs)] bg-[oklch(1_0_0_/_0.72)] backdrop-blur-[18px]">
                  <SelectValue placeholder="Select order type" className="capitalize" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receiving">Receiving</SelectItem>
                  <SelectItem value="dispatching">Dispatching</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Client</Label>
              <Select value={formData.clientCompanyId || undefined} onValueChange={value => setFormData(prev => ({ ...prev, clientCompanyId: value }))}>
                <SelectTrigger className="mt-2 !w-full glass-surface border-[var(--glass-border-soft)] shadow-[var(--glass-shadow-xs)] bg-[oklch(1_0_0_/_0.72)] backdrop-blur-[18px]">
                  <SelectValue placeholder="Select client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Dispatch Start Date</Label>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="calendar" className="mt-2">
                      <CalendarIcon className="size-4" />
                      {formData.dispatchStartDate ? format(new Date(formData.dispatchStartDate), "yyyy/MM/dd") : "yyyy/mm/dd"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="glass-surface border-[var(--glass-border-soft)] shadow-[var(--glass-shadow-lg)] backdrop-blur-[28px] p-3">
                    <Calendar
                      mode="single"
                      selected={formData.dispatchStartDate ? new Date(formData.dispatchStartDate) : undefined}
                      onSelect={date => {
                        setFormData(prev => ({
                          ...prev,
                          dispatchStartDate: date ? format(date, "yyyy-MM-dd") : "",
                        }))
                        setStartDateOpen(false)
                      }}
                      disabled={date => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Dispatch End Date</Label>
                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="calendar" className="mt-2">
                      <CalendarIcon className="size-4" />
                      {formData.dispatchEndDate ? format(new Date(formData.dispatchEndDate), "yyyy/MM/dd") : "yyyy/mm/dd"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="glass-surface border-[var(--glass-border-soft)] shadow-[var(--glass-shadow-lg)] backdrop-blur-[28px] p-3">
                    <Calendar
                      mode="single"
                      selected={formData.dispatchEndDate ? new Date(formData.dispatchEndDate) : undefined}
                      onSelect={date => {
                        setFormData(prev => ({
                          ...prev,
                          dispatchEndDate: date ? format(date, "yyyy-MM-dd") : "",
                        }))
                        setEndDateOpen(false)
                      }}
                      disabled={date => {
                        if (!formData.dispatchStartDate) {
                          // If no start date selected, disable dates before today
                          const today = new Date(new Date().setHours(0, 0, 0, 0))
                          return date < today
                        }
                        // Normalize both dates to midnight for proper comparison
                        const startDate = new Date(formData.dispatchStartDate)
                        startDate.setHours(0, 0, 0, 0)
                        const compareDate = new Date(date)
                        compareDate.setHours(0, 0, 0, 0)
                        // Allow dates >= start date (same day or after)
                        return compareDate < startDate
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label>Total Weight (kg)</Label>
              <Input
                type="text"
                value={formData.totalWeight || ""}
                onChange={e => {
                  const cleaned = utilityService.validateWholeNumber(e.target.value)
                  const parsed = utilityService.parseWholeNumber(cleaned)
                  setFormData(prev => ({ ...prev, totalWeight: parsed }))
                }}
                className="mt-2"
                placeholder={`Min: ${company.orderConfig?.minTotalWeight ?? 0} kg`}
              />
              {company.orderConfig?.minTotalWeight && (
                <p className="text-xs text-muted-foreground mt-1">Minimum: {company.orderConfig.minTotalWeight} kg</p>
              )}
            </div>
          </div>
        )

      case 3: // Sites
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Site</h2>
              <p className="text-muted-foreground">{formData.orderType === "dispatching" ? "Select the collection site (where material is collected from)" : "Select the destination site (where material is delivered to)"}</p>
            </div>

            {formData.orderType === "dispatching" ? (
              <div>
                <Label>Collection Site</Label>
                <Select value={formData.collectionSiteId || undefined} onValueChange={value => setFormData(prev => ({ ...prev, collectionSiteId: value }))}>
                  <SelectTrigger className="mt-2 w-full glass-surface border-[var(--glass-border-soft)] shadow-[var(--glass-shadow-xs)] bg-[oklch(1_0_0_/_0.72)] backdrop-blur-[18px]">
                    <SelectValue placeholder="Select collection site..." />
                  </SelectTrigger>
                  <SelectContent>
                    {collectionSites.map(site => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label>Destination Site</Label>
                <Select value={formData.destinationSiteId || undefined} onValueChange={value => setFormData(prev => ({ ...prev, destinationSiteId: value }))}>
                  <SelectTrigger className="mt-2 w-full glass-surface border-[var(--glass-border-soft)] shadow-[var(--glass-shadow-xs)] bg-[oklch(1_0_0_/_0.72)] backdrop-blur-[18px]">
                    <SelectValue placeholder="Select destination site..." />
                  </SelectTrigger>
                  <SelectContent>
                    {destinationSites.map(site => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )

      case 4: // Product
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Product</h2>
              <p className="text-muted-foreground">Select the product for this order</p>
            </div>

            <div>
              <Label>Product</Label>
              <Select value={formData.productId || undefined} onValueChange={value => setFormData(prev => ({ ...prev, productId: value }))}>
                <SelectTrigger className="mt-2 w-full glass-surface border-[var(--glass-border-soft)] shadow-[var(--glass-shadow-xs)] bg-[oklch(1_0_0_/_0.72)] backdrop-blur-[18px]">
                  <SelectValue placeholder="Select product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 5: // Seals
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Seal Requirements</h2>
              <p className="text-muted-foreground">Configure seal requirements for this order</p>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="sealRequired" checked={formData.sealRequired} onCheckedChange={checked => setFormData(prev => ({ ...prev, sealRequired: checked as boolean }))} />
              <Label htmlFor="sealRequired">Seal Required</Label>
            </div>

            {formData.sealRequired && (
              <div>
                <Label>Seal Quantity</Label>
                <Input type="number" value={formData.sealQuantity} onChange={e => setFormData(prev => ({ ...prev, sealQuantity: parseInt(e.target.value) || 0 }))} className="mt-2" placeholder="0" />
              </div>
            )}
          </div>
        )

      case 6: // Limits
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Limits</h2>
              <p className="text-muted-foreground">Configure operational limits for this order</p>
            </div>

            <div>
              <Label>Daily Weight Limit (kg)</Label>
              <Input type="number" value={formData.dailyWeightLimit} onChange={e => setFormData(prev => ({ ...prev, dailyWeightLimit: parseFloat(e.target.value) || 0 }))} className="mt-2" placeholder="0" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Label>Monthly Limit (kg, optional)</Label>
                <span className="text-xs text-yellow-600 font-medium px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded">
                  Not currently used in calculations
                </span>
              </div>
              <Input type="number" value={formData.monthlyLimit} onChange={e => setFormData(prev => ({ ...prev, monthlyLimit: parseFloat(e.target.value) || 0 }))} className="mt-2" placeholder="0" />
            </div>
          </div>
        )

      case 7: // Trip Config
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Trip Configuration</h2>
              <p className="text-muted-foreground">Configure trip limits for this order</p>
            </div>

            <div>
              <Label>Trip Configuration Mode</Label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.tripConfigMode === "trips"} onChange={() => setFormData(prev => ({ ...prev, tripConfigMode: "trips" }))} />
                  <span>Maximum Trips Per Day</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.tripConfigMode === "duration"} onChange={() => setFormData(prev => ({ ...prev, tripConfigMode: "duration" }))} />
                  <span>Trip Duration (hours)</span>
                </label>
              </div>
            </div>

            {formData.tripConfigMode === "trips" ? (
              <div>
                <Label>Maximum Trips Per Day</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (formData.tripLimit > 1) {
                        setFormData(prev => ({ ...prev, tripLimit: prev.tripLimit - 1 }))
                      } else {
                        toast.error("Minimum 1 trip per day required")
                      }
                    }}
                    disabled={formData.tripLimit <= 1}
                    className="h-10 w-10"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-semibold">{formData.tripLimit}</div>
                    <div className="text-xs text-muted-foreground">{formData.tripLimit === 1 ? "trip" : "trips"} per day</div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, tripLimit: prev.tripLimit + 1 }))
                    }}
                    className="h-10 w-10"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Trip Duration (hours)</Label>
                  <Input type="number" value={formData.tripDuration} onChange={e => setFormData(prev => ({ ...prev, tripDuration: parseFloat(e.target.value) || 0 }))} className="mt-2" placeholder="4" />
                </div>

                {formData.tripDuration > 0 && formData.collectionSiteId && (() => {
                  const collectionSite = sites.find(s => s.id === formData.collectionSiteId)
                  if (!collectionSite?.operatingHours) return null

                  // Calculate operating hours for the collection site
                  const calculateDailyOperatingHours = () => {
                    const hours = collectionSite.operatingHours
                    if (!hours || typeof hours !== 'object') return 12 // Default 12 hours

                    // Get today's day of week
                    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
                    const daySchedule = hours[today as keyof typeof hours]

                    if (!daySchedule || typeof daySchedule !== 'object' || !('open' in daySchedule)) return 12

                    const { open, close } = daySchedule as { open: string; close: string }
                    if (open === 'closed' || close === 'closed') return 0

                    // Parse time strings (e.g., "06:00" to 6, "18:00" to 18)
                    const openHour = parseInt(open.split(':')[0])
                    const closeHour = parseInt(close.split(':')[0])
                    return closeHour - openHour
                  }

                  const operatingHours = calculateDailyOperatingHours()
                  const { tripDuration } = formData

                  if (tripDuration <= 24) {
                    // Trip can be completed within a day
                    let tripsPerDay: number
                    let exceedsOperatingHours = false

                    if (tripDuration <= operatingHours) {
                      // Multiple trips possible
                      tripsPerDay = Math.floor(operatingHours / tripDuration)
                    } else {
                      // Trip exceeds operating hours but ≤24 hours
                      // Can still do 1 trip per day (truck starts within operating window)
                      tripsPerDay = 1
                      exceedsOperatingHours = true
                    }

                    return (
                      <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Per Truck Trip Capacity:</span>
                        </div>
                        <div className="text-sm">
                          <p>• <span className="font-semibold">{tripsPerDay} {tripsPerDay === 1 ? "trip" : "trips"} per day per truck</span> (based on {operatingHours}-hour operating window)</p>
                        </div>
                        {exceedsOperatingHours && (
                          <p className="text-sm text-yellow-600 mt-2">⚠️ Trip duration ({tripDuration}h) exceeds operating hours ({operatingHours}h), but trucks can still complete 1 trip per day by starting within the operating window.</p>
                        )}
                      </div>
                    )
                  } else {
                    // Trip exceeds 24 hours
                    const daysPerTrip = Math.ceil(tripDuration / 24)
                    return (
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-yellow-600">⚠️ Multi-Day Trip Warning (Per Truck):</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <p>• Trip duration exceeds 24 hours</p>
                          <p>• <span className="font-semibold">{daysPerTrip} days required per trip per truck</span></p>
                          <p className="text-xs text-muted-foreground mt-2">Each truck&apos;s trip will span multiple days. Consider reducing trip duration or adjusting order timeline.</p>
                        </div>
                      </div>
                    )
                  }
                })()}
              </div>
            )}
          </div>
        )

      case 8: // Allocation
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Allocation</h2>
              <p className="text-muted-foreground">Assign this order to logistics coordinator or transporters</p>
            </div>

            <div>
              <Label>Allocation Mode</Label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.allocationMode === "lc"} onChange={() => setFormData(prev => ({ ...prev, allocationMode: "lc" }))} />
                  <span>Assign to Logistics Coordinator</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.allocationMode === "transporters"} onChange={() => setFormData(prev => ({ ...prev, allocationMode: "transporters" }))} />
                  <span>Assign to Transporter Companies</span>
                </label>
              </div>
            </div>

            {formData.allocationMode === "lc" ? (
              <div>
                <Label>Logistics Coordinator</Label>
                <Select value={formData.lcCompanyId || undefined} onValueChange={value => setFormData(prev => ({ ...prev, lcCompanyId: value }))}>
                  <SelectTrigger className="mt-2 w-full glass-surface border-[var(--glass-border-soft)] shadow-[var(--glass-shadow-xs)] bg-[oklch(1_0_0_/_0.72)] backdrop-blur-[18px]">
                    <SelectValue placeholder="Select LC..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lcCompanies.map(lc => (
                      <SelectItem key={lc.id} value={lc.id}>
                        {lc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Transporter Selection */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select value={selectedTransporterId} onValueChange={setSelectedTransporterId} disabled={isAnyLoading()}>
                      <SelectTrigger className="w-full glass-surface border-[var(--glass-border-soft)] shadow-[var(--glass-shadow-xs)] bg-[oklch(1_0_0_/_0.72)] backdrop-blur-[18px]">
                        <SelectValue placeholder="Select transporter to add..." />
                      </SelectTrigger>
                      <SelectContent>
                        {transporterCompanies
                          .filter(t => !formData.allocations.some(a => a.companyId === t.id))
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

                {/* Allocation Cards */}
                {formData.allocations.length > 0 && (
                  <div className="space-y-3">
                    {formData.allocations.map((allocation, index) => {
                      const transporter = transporterCompanies.find(t => t.id === allocation.companyId)
                      const availableTrucks = getAvailableTrucks(allocation.companyId)
                      const isLoading = isLoadingTrucks(allocation.companyId)
                      const truckCapacity = company.orderConfig?.defaultWeightPerTruck ?? 0
                      const exceedsAvailable = allocation.numberOfTrucks > availableTrucks

                      // Calculate trip capacity per truck per day
                      const calculateTripCapacity = () => {
                        if (formData.tripConfigMode === "trips") {
                          return formData.tripLimit
                        } else if (formData.tripConfigMode === "duration" && formData.collectionSiteId) {
                          const collectionSite = sites.find(s => s.id === formData.collectionSiteId)
                          if (!collectionSite?.operatingHours) return 1

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
                          const { tripDuration } = formData
                          if (tripDuration <= 24) {
                            // If trip fits within operating hours, calculate multiple trips per day
                            if (tripDuration <= operatingHours) {
                              return Math.floor(operatingHours / tripDuration)
                            } else {
                              // Trip exceeds operating hours but ≤24 hours
                              // Can still do 1 trip per day (truck starts within operating window)
                              return 1
                            }
                          } else {
                            // Multi-day trip (>24 hours)
                            return 1 / Math.ceil(tripDuration / 24)
                          }
                        }
                        return 1
                      }

                      // Calculate order duration in days
                      const orderDurationDays = Math.max(
                        1,
                        Math.ceil((new Date(formData.dispatchEndDate).getTime() - new Date(formData.dispatchStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
                      )

                      const tripsPerDay = calculateTripCapacity()
                      const weightPerTripPerTruck = truckCapacity
                      const weightPerDayPerTruck = tripsPerDay * weightPerTripPerTruck
                      const weightPerTruckOverDuration = weightPerDayPerTruck * orderDurationDays

                      // Calculate minimum trucks for allocated weight
                      const minimumTrucks = calculateMinimumTrucks(allocation.allocatedWeight)
                      const weightPercentage = formData.totalWeight > 0 ? ((allocation.allocatedWeight / formData.totalWeight) * 100).toFixed(1) : "0.0"
                      const totalCapacity = allocation.numberOfTrucks * weightPerTruckOverDuration
                      const insufficientTrucks = minimumTrucks > availableTrucks

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
                            <p className="text-muted-foreground">
                              • {tripsPerDay} {tripsPerDay === 1 ? "trip" : "trips"} per day × {weightPerTripPerTruck.toLocaleString()} kg per trip = {weightPerDayPerTruck.toLocaleString()} kg/day
                            </p>
                            <p className="text-muted-foreground">
                              • Over {orderDurationDays} {orderDurationDays === 1 ? "day" : "days"}: <span className="font-semibold">{weightPerTruckOverDuration.toLocaleString()} kg per truck</span>
                            </p>
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
                                max={formData.totalWeight}
                                value={allocation.allocatedWeight || ""}
                                onChange={e => {
                                  const weight = parseInt(e.target.value) || 0
                                  handleUpdateWeight(index, weight)
                                }}
                                placeholder="Enter weight to allocate..."
                                className={allocation.allocatedWeight > formData.totalWeight ? "border-destructive" : ""}
                                disabled={isLoading}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                                {weightPercentage}%
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {allocation.allocatedWeight.toLocaleString()} / {formData.totalWeight.toLocaleString()} kg
                            </p>
                            {allocation.allocatedWeight > formData.totalWeight && (
                              <p className="text-xs text-destructive">Cannot exceed order total ({formData.totalWeight.toLocaleString()} kg)</p>
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
                {formData.allocations.length > 0 && (
                  <div className="glass-surface rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold">Allocation Summary</h4>

                    {/* Per-Transporter Breakdown */}
                    <div className="space-y-2 border-b pb-3">
                      {formData.allocations.map((allocation, index) => {
                        const transporter = transporterCompanies.find(t => t.id === allocation.companyId)
                        const percentage = formData.totalWeight > 0 ? ((allocation.allocatedWeight / formData.totalWeight) * 100).toFixed(1) : "0.0"
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
                        <span className={totalAllocated === formData.totalWeight ? "text-green-600 font-semibold" : "font-semibold"}>
                          {totalAllocated.toLocaleString()} / {formData.totalWeight.toLocaleString()} kg
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
                      {totalAllocated === formData.totalWeight && <p className="text-xs text-green-600 mt-2">✓ Order is fully allocated</p>}
                    </div>

                    {/* Total Trucks */}
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Trucks:</span>
                        <span className="font-semibold">{formData.allocations.reduce((sum, a) => sum + a.numberOfTrucks, 0)} trucks</span>
                      </div>
                    </div>

                    {/* Daily Weight Limit Check */}
                    <div className="border-t pt-3 space-y-2">
                      {(() => {
                        const orderDurationDays = Math.max(
                          1,
                          Math.ceil((new Date(formData.dispatchEndDate).getTime() - new Date(formData.dispatchStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
                        )
                        const totalDailyWeight = formData.allocations.reduce((sum, a) => sum + a.allocatedWeight / orderDurationDays, 0)
                        const dailyWeightLimit = formData.dailyWeightLimit
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

                {formData.allocations.length === 0 && (
                  <div className="glass-surface rounded-lg p-6 text-center text-muted-foreground">
                    <p className="text-sm">No transporters allocated yet. Select a transporter above to begin allocation.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )

      case 9: // Review
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Review & Submit</h2>
              <p className="text-muted-foreground">Review your order details before submitting</p>
            </div>

            <div className="glass-surface rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Order Number</Label>
                  <p className="font-medium">{formData.orderNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Order Type</Label>
                  <p className="font-medium capitalize">{formData.orderType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Client</Label>
                  <p className="font-medium">{reviewClient?.name || "Unknown"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Product</Label>
                  <p className="font-medium">{reviewProduct?.name || "Unknown"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Weight</Label>
                  <p className="font-medium">{formData.totalWeight} kg</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date Range</Label>
                  <p className="font-medium text-sm">
                    {formData.dispatchStartDate} to {formData.dispatchEndDate}
                  </p>
                </div>
                {formData.orderType === "dispatching" ? (
                  <div>
                    <Label className="text-muted-foreground">Collection Site</Label>
                    <p className="font-medium">{reviewCollectionSite?.name || "Unknown"}</p>
                  </div>
                ) : (
                  <div>
                    <Label className="text-muted-foreground">Destination Site</Label>
                    <p className="font-medium">{reviewDestinationSite?.name || "Unknown"}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Seals</Label>
                  <p className="font-medium">{formData.sealRequired ? `Yes (${formData.sealQuantity})` : "No"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Daily Limits</Label>
                  <p className="font-medium text-sm">
                    {formData.dailyTruckLimit} trucks / {formData.dailyWeightLimit} kg
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="glass-surface rounded-lg p-4">
        <WizardSteps currentStep={currentStep} totalSteps={9} />
      </div>

      {/* Step Content */}
      <div className="glass-surface rounded-lg p-6">{renderStep()}</div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 1 || loading} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        {currentStep < 9 ? (
          <Button onClick={handleNext} className="gap-2" disabled={loading || validatingOrderNumber}>
            {validatingOrderNumber ? "Checking..." : "Next"}
            {!validatingOrderNumber && <ChevronRight className="h-4 w-4" />}
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? "Creating Order..." : "Submit Order"}
          </Button>
        )}
      </div>
    </div>
  )
}
