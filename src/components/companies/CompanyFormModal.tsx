"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { CompanyService } from "@/services/company.service"
import { toast } from "sonner"
import type { Company, User } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"

interface CompanyFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  company?: Company
}

export function CompanyFormModal({ open, onClose, onSuccess, company }: CompanyFormModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])

  const [formData, setFormData] = useState({
    // Basic info
    name: company?.name || "",
    companyType: company?.companyType || "mine",
    registrationNumber: company?.registrationNumber || "",
    vatNumber: company?.vatNumber || "",
    physicalAddress: company?.physicalAddress || "",
    mainContactId: company?.mainContactId || "",
    secondaryContactIds: company?.secondaryContactIds || [] as string[],

    // Order Config
    orderNumberMode: company?.orderConfig?.orderNumberMode || "autoOnly",
    orderNumberPrefix: company?.orderConfig?.orderNumberPrefix || "",
    defaultDailyTruckLimit: company?.orderConfig?.defaultDailyTruckLimit || 10,
    defaultDailyWeightLimit: company?.orderConfig?.defaultDailyWeightLimit || 100,
    defaultMonthlyLimit: company?.orderConfig?.defaultMonthlyLimit || 2000,
    defaultTripLimit: company?.orderConfig?.defaultTripLimit || 1,
    defaultWeightPerTruck: company?.orderConfig?.defaultWeightPerTruck || 30,
    preBookingMode: company?.orderConfig?.preBookingMode || "compulsory",
    advanceBookingHours: company?.orderConfig?.advanceBookingHours || 24,
    defaultSealRequired: company?.orderConfig?.defaultSealRequired ?? true,
    defaultSealQuantity: company?.orderConfig?.defaultSealQuantity || 2,

    // System Settings
    fleetNumberEnabled: company?.systemSettings?.fleetNumberEnabled ?? true,
    fleetNumberLabel: company?.systemSettings?.fleetNumberLabel || "Fleet No.",
    transporterGroupEnabled: company?.systemSettings?.transporterGroupEnabled ?? true,
    transporterGroupLabel: company?.systemSettings?.transporterGroupLabel || "Group",
    groupOptions: company?.systemSettings?.groupOptions?.join(", ") || "North, South",

    // Security Alerts
    securityPrimaryContactId: company?.securityAlerts?.primaryContactId || "",
    securitySecondaryContactIds: company?.securityAlerts?.secondaryContactIds || [] as string[],
    escalationMinutes: company?.securityAlerts?.escalationMinutes || 15,
    requiredResponseMinutes: company?.securityAlerts?.requiredResponseMinutes || 5,
  })

  useEffect(() => {
    async function loadUsers() {
      if (!user?.companyId) return
      try {
        const companyUsers = await CompanyService.getCompanyUsers(user.companyId)
        setUsers(companyUsers)
      } catch (error) {
        console.error("Error loading users:", error)
      }
    }
    if (open) {
      loadUsers()
    }
  }, [open, user?.companyId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.name || !formData.companyType || !formData.registrationNumber || !formData.physicalAddress) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!formData.mainContactId) {
      toast.error("Please select a main contact")
      return
    }

    if (!user) {
      toast.error("User not found")
      return
    }

    try {
      setLoading(true)

      const companyData = {
        name: formData.name,
        companyType: formData.companyType as "mine" | "transporter" | "logistics_coordinator",
        registrationNumber: formData.registrationNumber,
        vatNumber: formData.vatNumber,
        physicalAddress: formData.physicalAddress,
        mainContactId: formData.mainContactId,
        secondaryContactIds: formData.secondaryContactIds,
        orderConfig: {
          orderNumberMode: formData.orderNumberMode as "autoOnly" | "manualAllowed",
          orderNumberPrefix: formData.orderNumberPrefix,
          defaultDailyTruckLimit: formData.defaultDailyTruckLimit,
          defaultDailyWeightLimit: formData.defaultDailyWeightLimit,
          defaultMonthlyLimit: formData.defaultMonthlyLimit,
          defaultTripLimit: formData.defaultTripLimit,
          defaultWeightPerTruck: formData.defaultWeightPerTruck,
          preBookingMode: formData.preBookingMode as "compulsory" | "optional",
          advanceBookingHours: formData.advanceBookingHours,
          defaultSealRequired: formData.defaultSealRequired,
          defaultSealQuantity: formData.defaultSealQuantity,
        },
        systemSettings: {
          fleetNumberEnabled: formData.fleetNumberEnabled,
          fleetNumberLabel: formData.fleetNumberLabel,
          transporterGroupEnabled: formData.transporterGroupEnabled,
          transporterGroupLabel: formData.transporterGroupLabel,
          groupOptions: formData.groupOptions.split(",").map(s => s.trim()).filter(Boolean),
        },
        securityAlerts: {
          primaryContactId: formData.securityPrimaryContactId || formData.mainContactId,
          secondaryContactIds: formData.securitySecondaryContactIds,
          escalationMinutes: formData.escalationMinutes,
          qrMismatchContacts: [],
          documentFailureContacts: [],
          sealDiscrepancyContacts: [],
          requiredResponseMinutes: formData.requiredResponseMinutes,
        },
        isActive: true,
      }

      if (company) {
        await CompanyService.update(company.id, companyData)
      } else {
        await CompanyService.create(companyData)
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error saving company:", error)
      toast.error(`Failed to ${company ? "update" : "create"} company`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto glass-surface">
        <DialogHeader>
          <DialogTitle>{company ? "Edit Company" : "Create New Company"}</DialogTitle>
          <DialogDescription>Configure company details, order settings, and security alerts.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="order">Order Config</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Acme Corporation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyType">Company Type *</Label>
                <select
                  id="companyType"
                  value={formData.companyType}
                  onChange={e => setFormData({ ...formData, companyType: e.target.value as "mine" | "transporter" | "logistics_coordinator" })}
                  className="w-full border rounded-md px-3 py-2 bg-background/60 backdrop-blur-md"
                >
                  <option value="mine">Mine</option>
                  <option value="transporter">Transporter</option>
                  <option value="logistics_coordinator">Logistics Coordinator</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number *</Label>
                  <Input
                    id="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
                    placeholder="2024/001234/07"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vatNumber">VAT Number</Label>
                  <Input
                    id="vatNumber"
                    value={formData.vatNumber}
                    onChange={e => setFormData({ ...formData, vatNumber: e.target.value })}
                    placeholder="4001234567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="physicalAddress">Physical Address *</Label>
                <Input
                  id="physicalAddress"
                  value={formData.physicalAddress}
                  onChange={e => setFormData({ ...formData, physicalAddress: e.target.value })}
                  placeholder="123 Main Street, City, Province, Postal Code"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mainContactId">Main Contact *</Label>
                <select
                  id="mainContactId"
                  value={formData.mainContactId}
                  onChange={e => setFormData({ ...formData, mainContactId: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 bg-background/60 backdrop-blur-md"
                >
                  <option value="">Select main contact...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.displayName || `${u.firstName} ${u.lastName}`} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
            </TabsContent>

            {/* Order Configuration Tab */}
            <TabsContent value="order" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderNumberMode">Order Number Mode</Label>
                  <select
                    id="orderNumberMode"
                    value={formData.orderNumberMode}
                    onChange={e => setFormData({ ...formData, orderNumberMode: e.target.value as "autoOnly" | "manualAllowed" })}
                    className="w-full border rounded-md px-3 py-2 bg-background/60 backdrop-blur-md"
                  >
                    <option value="autoOnly">Auto-Generated Only</option>
                    <option value="manualAllowed">Manual Entry Allowed</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orderNumberPrefix">Order Number Prefix</Label>
                  <Input
                    id="orderNumberPrefix"
                    value={formData.orderNumberPrefix}
                    onChange={e => setFormData({ ...formData, orderNumberPrefix: e.target.value })}
                    placeholder="ORD-"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultDailyTruckLimit">Daily Truck Limit</Label>
                  <Input
                    id="defaultDailyTruckLimit"
                    type="number"
                    value={formData.defaultDailyTruckLimit}
                    onChange={e => setFormData({ ...formData, defaultDailyTruckLimit: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultDailyWeightLimit">Daily Weight Limit (tons)</Label>
                  <Input
                    id="defaultDailyWeightLimit"
                    type="number"
                    value={formData.defaultDailyWeightLimit}
                    onChange={e => setFormData({ ...formData, defaultDailyWeightLimit: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultMonthlyLimit">Monthly Limit (tons)</Label>
                  <Input
                    id="defaultMonthlyLimit"
                    type="number"
                    value={formData.defaultMonthlyLimit}
                    onChange={e => setFormData({ ...formData, defaultMonthlyLimit: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultTripLimit">Trip Limit</Label>
                  <Input
                    id="defaultTripLimit"
                    type="number"
                    value={formData.defaultTripLimit}
                    onChange={e => setFormData({ ...formData, defaultTripLimit: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultWeightPerTruck">Weight Per Truck (tons)</Label>
                  <Input
                    id="defaultWeightPerTruck"
                    type="number"
                    value={formData.defaultWeightPerTruck}
                    onChange={e => setFormData({ ...formData, defaultWeightPerTruck: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preBookingMode">Pre-Booking Mode</Label>
                  <select
                    id="preBookingMode"
                    value={formData.preBookingMode}
                    onChange={e => setFormData({ ...formData, preBookingMode: e.target.value as "compulsory" | "optional" })}
                    className="w-full border rounded-md px-3 py-2 bg-background/60 backdrop-blur-md"
                  >
                    <option value="compulsory">Compulsory</option>
                    <option value="optional">Optional</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="advanceBookingHours">Advance Booking Hours</Label>
                  <Input
                    id="advanceBookingHours"
                    type="number"
                    value={formData.advanceBookingHours}
                    onChange={e => setFormData({ ...formData, advanceBookingHours: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="defaultSealRequired"
                    checked={formData.defaultSealRequired}
                    onCheckedChange={(checked) => setFormData({ ...formData, defaultSealRequired: checked === true })}
                  />
                  <Label htmlFor="defaultSealRequired" className="cursor-pointer">Seal Required by Default</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultSealQuantity">Default Seal Quantity</Label>
                  <Input
                    id="defaultSealQuantity"
                    type="number"
                    value={formData.defaultSealQuantity}
                    onChange={e => setFormData({ ...formData, defaultSealQuantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* System Settings Tab */}
            <TabsContent value="system" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fleetNumberEnabled"
                    checked={formData.fleetNumberEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, fleetNumberEnabled: checked === true })}
                  />
                  <Label htmlFor="fleetNumberEnabled" className="cursor-pointer">Enable Fleet Numbers</Label>
                </div>

                {formData.fleetNumberEnabled && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="fleetNumberLabel">Fleet Number Label</Label>
                    <Input
                      id="fleetNumberLabel"
                      value={formData.fleetNumberLabel}
                      onChange={e => setFormData({ ...formData, fleetNumberLabel: e.target.value })}
                      placeholder="Fleet No."
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="transporterGroupEnabled"
                    checked={formData.transporterGroupEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, transporterGroupEnabled: checked === true })}
                  />
                  <Label htmlFor="transporterGroupEnabled" className="cursor-pointer">Enable Transporter Groups</Label>
                </div>

                {formData.transporterGroupEnabled && (
                  <>
                    <div className="space-y-2 ml-6">
                      <Label htmlFor="transporterGroupLabel">Transporter Group Label</Label>
                      <Input
                        id="transporterGroupLabel"
                        value={formData.transporterGroupLabel}
                        onChange={e => setFormData({ ...formData, transporterGroupLabel: e.target.value })}
                        placeholder="Group"
                      />
                    </div>

                    <div className="space-y-2 ml-6">
                      <Label htmlFor="groupOptions">Group Options (comma-separated)</Label>
                      <Input
                        id="groupOptions"
                        value={formData.groupOptions}
                        onChange={e => setFormData({ ...formData, groupOptions: e.target.value })}
                        placeholder="North, South, East, West"
                      />
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Security Alerts Tab */}
            <TabsContent value="security" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="securityPrimaryContactId">Primary Security Contact</Label>
                <select
                  id="securityPrimaryContactId"
                  value={formData.securityPrimaryContactId}
                  onChange={e => setFormData({ ...formData, securityPrimaryContactId: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 bg-background/60 backdrop-blur-md"
                >
                  <option value="">Use main contact...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.displayName || `${u.firstName} ${u.lastName}`} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="escalationMinutes">Escalation Time (minutes)</Label>
                  <Input
                    id="escalationMinutes"
                    type="number"
                    value={formData.escalationMinutes}
                    onChange={e => setFormData({ ...formData, escalationMinutes: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requiredResponseMinutes">Required Response Time (minutes)</Label>
                  <Input
                    id="requiredResponseMinutes"
                    type="number"
                    value={formData.requiredResponseMinutes}
                    onChange={e => setFormData({ ...formData, requiredResponseMinutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : company ? "Update Company" : "Create Company"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
