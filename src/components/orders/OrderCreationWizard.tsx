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
import { useSignals } from "@preact/signals-react/runtime"
import { useAlert } from "@/hooks/useAlert"
import { toast } from "sonner"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
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

  // Form data with defaults from company.orderConfig
  const [formData, setFormData] = useState<OrderFormData>({
    orderNumber: "",
    orderType: "dispatching",
    clientCompanyId: "",
    dispatchStartDate: format(new Date(), "yyyy-MM-dd"),
    dispatchEndDate: format(new Date(), "yyyy-MM-dd"),
    totalWeight: 0,
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
  const lcCompanies = companies.filter(c => c.companyType === "logistics_coordinator")
  const transporterCompanies = companies.filter(c => c.companyType === "transporter")

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
        const dateValidation = OrderService.validateDateRange(formData.dispatchStartDate, formData.dispatchEndDate)
        if (!dateValidation.isValid) {
          showError("Invalid Dates", dateValidation.error!)
          return false
        }
        return true

      case 3: // Sites
        if (!formData.collectionSiteId || !formData.destinationSiteId) {
          showError("Sites Required", "Please select both collection and destination sites")
          return false
        }
        const siteValidation = OrderService.validateSites(formData.collectionSiteId, formData.destinationSiteId)
        if (!siteValidation.isValid) {
          showError("Invalid Sites", siteValidation.error!)
          return false
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
        if (formData.dailyTruckLimit <= 0 || formData.dailyWeightLimit <= 0) {
          showError("Limits Required", "Please enter valid daily limits")
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
        if (formData.allocationMode === "transporters" && formData.allocations.length === 0) {
          showError("Allocations Required", "Please add at least one transporter allocation")
          return false
        }
        if (formData.allocationMode === "transporters") {
          const allocValidation = OrderService.validateAllocation(formData.allocations, formData.totalWeight)
          if (!allocValidation.isValid) {
            showError("Invalid Allocation", allocValidation.error!)
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
      let allocations: Allocation[] = []

      if (formData.allocationMode === "lc" && formData.lcCompanyId) {
        allocations = [
          {
            companyId: formData.lcCompanyId,
            allocatedWeight: formData.totalWeight,
            loadingDates: [formData.dispatchStartDate],
            completedWeight: 0,
            status: "pending" as const,
          },
        ]
      } else if (formData.allocationMode === "transporters") {
        allocations = formData.allocations
      }

      const orderData: Omit<Order, "id" | "createdAt" | "updatedAt" | "dbCreatedAt" | "dbUpdatedAt"> = {
        companyId: company.id,
        orderNumber: formData.orderNumber,
        orderType: formData.orderType,
        clientCompanyId: formData.clientCompanyId,
        dispatchStartDate: formData.dispatchStartDate,
        dispatchEndDate: formData.dispatchEndDate,
        totalWeight: formData.totalWeight,
        collectionSiteId: formData.collectionSiteId,
        destinationSiteId: formData.destinationSiteId,
        productId: formData.productId,
        sealRequired: formData.sealRequired,
        sealQuantity: formData.sealQuantity,
        dailyTruckLimit: formData.dailyTruckLimit,
        dailyWeightLimit: formData.dailyWeightLimit,
        monthlyLimit: formData.monthlyLimit,
        tripLimit: formData.tripLimit,
        tripDuration: formData.tripConfigMode === "duration" ? formData.tripDuration : undefined,
        allocations,
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
                <Popover>
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
                      onSelect={date =>
                        setFormData(prev => ({
                          ...prev,
                          dispatchStartDate: date ? format(date, "yyyy-MM-dd") : "",
                        }))
                      }
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Dispatch End Date</Label>
                <Popover>
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
                      onSelect={date =>
                        setFormData(prev => ({
                          ...prev,
                          dispatchEndDate: date ? format(date, "yyyy-MM-dd") : "",
                        }))
                      }
                      disabled={(date) => {
                        const today = new Date(new Date().setHours(0, 0, 0, 0))
                        const startDate = formData.dispatchStartDate ? new Date(formData.dispatchStartDate) : today
                        return date < startDate
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label>Total Weight (kg)</Label>
              <Input type="number" value={formData.totalWeight || ""} onChange={e => setFormData(prev => ({ ...prev, totalWeight: parseFloat(e.target.value) || 0 }))} className="mt-2" placeholder="0" />
            </div>
          </div>
        )

      case 3: // Sites
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Sites</h2>
              <p className="text-muted-foreground">Select collection and destination sites</p>
            </div>

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
              <Label>Daily Truck Limit</Label>
              <Input type="number" value={formData.dailyTruckLimit} onChange={e => setFormData(prev => ({ ...prev, dailyTruckLimit: parseInt(e.target.value) || 0 }))} className="mt-2" placeholder="0" />
            </div>

            <div>
              <Label>Daily Weight Limit (tons)</Label>
              <Input type="number" value={formData.dailyWeightLimit} onChange={e => setFormData(prev => ({ ...prev, dailyWeightLimit: parseFloat(e.target.value) || 0 }))} className="mt-2" placeholder="0" />
            </div>

            <div>
              <Label>Monthly Limit (tons, optional)</Label>
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
                <Input type="number" value={formData.tripLimit} onChange={e => setFormData(prev => ({ ...prev, tripLimit: parseInt(e.target.value) || 0 }))} className="mt-2" placeholder="1" />
              </div>
            ) : (
              <div>
                <Label>Trip Duration (hours)</Label>
                <Input type="number" value={formData.tripDuration} onChange={e => setFormData(prev => ({ ...prev, tripDuration: parseFloat(e.target.value) || 0 }))} className="mt-2" placeholder="4" />
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
                <div className="glass-surface rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-4">Direct allocation to transporters - for simplified implementation. Full allocation UI can be added later.</p>
                  <p className="text-sm">Allocations: {formData.allocations.length}</p>
                  <p className="text-sm">
                    Total allocated: {formData.allocations.reduce((sum, a) => sum + a.allocatedWeight, 0)} / {formData.totalWeight} tons
                  </p>
                </div>
              </div>
            )}
          </div>
        )

      case 9: // Review
        const client = clients.find(c => c.id === formData.clientCompanyId)
        const product = products.find(p => p.id === formData.productId)
        const collectionSite = sites.find(s => s.id === formData.collectionSiteId)
        const destinationSite = sites.find(s => s.id === formData.destinationSiteId)

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
                  <p className="font-medium">{client?.name || "Unknown"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Product</Label>
                  <p className="font-medium">{product?.name || "Unknown"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Weight</Label>
                  <p className="font-medium">{formData.totalWeight} tons</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date Range</Label>
                  <p className="font-medium text-sm">
                    {formData.dispatchStartDate} to {formData.dispatchEndDate}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Collection Site</Label>
                  <p className="font-medium">{collectionSite?.name || "Unknown"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Destination Site</Label>
                  <p className="font-medium">{destinationSite?.name || "Unknown"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Seals</Label>
                  <p className="font-medium">{formData.sealRequired ? `Yes (${formData.sealQuantity})` : "No"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Daily Limits</Label>
                  <p className="font-medium text-sm">
                    {formData.dailyTruckLimit} trucks / {formData.dailyWeightLimit} tons
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
