"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { CompanyService } from "@/services/company.service"
import type { Company, User } from "@/types"
import { toast } from "sonner"
import { X } from "lucide-react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface CompanyFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  company?: Company // For editing existing company
}

export function CompanyFormModal({ open, onClose, onSuccess, company }: CompanyFormModalProps) {
  const isEditing = Boolean(company)

  // Basic Info
  const [name, setName] = useState("")
  const [companyType, setCompanyType] = useState<"mine" | "transporter" | "logistics_coordinator">("mine")
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [vatNumber, setVatNumber] = useState("")
  const [physicalAddress, setPhysicalAddress] = useState("")
  const [mainContactId, setMainContactId] = useState("")
  const [secondaryContactIds, setSecondaryContactIds] = useState<string[]>([])
  const [isAlsoLogisticsCoordinator, setIsAlsoLogisticsCoordinator] = useState(false)
  const [isAlsoTransporter, setIsAlsoTransporter] = useState(false)

  // Order Config (Mine only)
  const [orderNumberMode, setOrderNumberMode] = useState<"autoOnly" | "manualAllowed">("autoOnly")
  const [orderNumberPrefix, setOrderNumberPrefix] = useState("")
  const [defaultDailyTruckLimit, setDefaultDailyTruckLimit] = useState(10)
  const [defaultDailyWeightLimit, setDefaultDailyWeightLimit] = useState(100)
  const [defaultMonthlyLimit, setDefaultMonthlyLimit] = useState(1000)
  const [defaultTripLimit, setDefaultTripLimit] = useState(1)
  const [defaultWeightPerTruck, setDefaultWeightPerTruck] = useState(10)
  const [preBookingMode, setPreBookingMode] = useState<"compulsory" | "optional">("compulsory")
  const [advanceBookingHours, setAdvanceBookingHours] = useState(24)
  const [defaultSealRequired, setDefaultSealRequired] = useState(true)
  const [defaultSealQuantity, setDefaultSealQuantity] = useState(2)

  // Fleet (Transporter or dual-role LC)
  const [fleetNumberEnabled, setFleetNumberEnabled] = useState(true)
  const [fleetNumberLabel, setFleetNumberLabel] = useState("Fleet No.")
  const [transporterGroupEnabled, setTransporterGroupEnabled] = useState(false)
  const [transporterGroupLabel, setTransporterGroupLabel] = useState("Group")
  const [groupOptions, setGroupOptions] = useState<string[]>([])
  const [newGroupOption, setNewGroupOption] = useState("")

  // Escalation (Security Alerts)
  const [primaryContactId, setPrimaryContactId] = useState("")
  const [escalationMinutes, setEscalationMinutes] = useState(15)
  const [requiredResponseMinutes, setRequiredResponseMinutes] = useState(30)

  const [loading, setLoading] = useState(false)
  const [selectedSecondaryContact, setSelectedSecondaryContact] = useState("")
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [showErrorAlert, setShowErrorAlert] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const hasMainContact = mainContactId && mainContactId.trim() !== ""

  useEffect(() => {
    if (!open || !isEditing || !company) {
      setUsers([])
      return
    }

    const fetchUsersForCompany = async () => {
      try {
        setLoadingUsers(true)
        const q = query(collection(db, "users"), where("companyId", "==", company.id))
        const snapshot = await getDocs(q)
        const usersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as User[]
        setUsers(usersList)
      } catch (error) {
        console.error("Error fetching users for company:", error)
        toast.error("Failed to load users for this company")
        setUsers([])
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchUsersForCompany()
  }, [open, isEditing, company])

  useEffect(() => {
    if (company && open) {
      setName(company.name)
      setCompanyType(company.companyType)
      setRegistrationNumber(company.registrationNumber || "")
      setVatNumber(company.vatNumber || "")
      setPhysicalAddress(company.physicalAddress)
      setMainContactId(company.mainContactId || "")
      setSecondaryContactIds(company.secondaryContactIds || [])
      setIsAlsoLogisticsCoordinator(company.isAlsoLogisticsCoordinator || false)
      setIsAlsoTransporter(company.isAlsoTransporter || false)

      // Order Config
      if (company.orderConfig) {
        setOrderNumberMode(company.orderConfig.orderNumberMode)
        setOrderNumberPrefix(company.orderConfig.orderNumberPrefix || "")
        setDefaultDailyTruckLimit(company.orderConfig.defaultDailyTruckLimit)
        setDefaultDailyWeightLimit(company.orderConfig.defaultDailyWeightLimit)
        setDefaultMonthlyLimit(company.orderConfig.defaultMonthlyLimit || 1000)
        setDefaultTripLimit(company.orderConfig.defaultTripLimit)
        setDefaultWeightPerTruck(company.orderConfig.defaultWeightPerTruck)
        setPreBookingMode(company.orderConfig.preBookingMode)
        setAdvanceBookingHours(company.orderConfig.advanceBookingHours)
        setDefaultSealRequired(company.orderConfig.defaultSealRequired)
        setDefaultSealQuantity(company.orderConfig.defaultSealQuantity)
      }

      // System Settings
      if (company.systemSettings) {
        setFleetNumberEnabled(company.systemSettings.fleetNumberEnabled)
        setFleetNumberLabel(company.systemSettings.fleetNumberLabel)
        setTransporterGroupEnabled(company.systemSettings.transporterGroupEnabled)
        setTransporterGroupLabel(company.systemSettings.transporterGroupLabel)
        setGroupOptions(company.systemSettings.groupOptions || [])
      }

      // Security Alerts
      if (company.securityAlerts) {
        setPrimaryContactId(company.securityAlerts.primaryContactId)
        setEscalationMinutes(company.securityAlerts.escalationMinutes)
        setRequiredResponseMinutes(company.securityAlerts.requiredResponseMinutes)
      }
    } else if (!company && open) {
      // Reset form for new company
      resetForm()
    }
  }, [company, open])

  const resetForm = () => {
    setName("")
    setCompanyType("mine")
    setRegistrationNumber("")
    setVatNumber("")
    setPhysicalAddress("")
    setMainContactId("")
    setSecondaryContactIds([])
    setIsAlsoLogisticsCoordinator(false)
    setIsAlsoTransporter(false)
    setOrderNumberMode("autoOnly")
    setOrderNumberPrefix("")
    setDefaultDailyTruckLimit(10)
    setDefaultDailyWeightLimit(100)
    setDefaultMonthlyLimit(1000)
    setDefaultTripLimit(1)
    setDefaultWeightPerTruck(10)
    setPreBookingMode("compulsory")
    setAdvanceBookingHours(24)
    setDefaultSealRequired(true)
    setDefaultSealQuantity(2)
    setFleetNumberEnabled(true)
    setFleetNumberLabel("Fleet No.")
    setTransporterGroupEnabled(false)
    setTransporterGroupLabel("Group")
    setGroupOptions([])
    setNewGroupOption("")
    setPrimaryContactId("")
    setEscalationMinutes(15)
    setRequiredResponseMinutes(30)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name) {
      toast.error("Company name is required")
      return
    }

    if (!physicalAddress) {
      toast.error("Physical address is required")
      return
    }

    // Validate transporter group options if enabled (only for transporters or dual-role LC)
    const shouldHaveFleetSettings = companyType === "transporter" || (companyType === "logistics_coordinator" && isAlsoTransporter)
    if (shouldHaveFleetSettings && transporterGroupEnabled && groupOptions.length === 0) {
      setErrorMessage("At least one group option is required when transporter group is enabled.")
      setShowErrorAlert(true)
      return
    }

    try {
      setLoading(true)

      const companyData: any = {
        name,
        companyType,
        physicalAddress,
        secondaryContactIds,
        isActive: true,
      }

      // Add optional fields only if they have values
      if (registrationNumber) companyData.registrationNumber = registrationNumber
      if (vatNumber) companyData.vatNumber = vatNumber
      if (mainContactId) companyData.mainContactId = mainContactId

      // Add dual-role flags only for relevant company types
      if (companyType === "transporter" && isAlsoLogisticsCoordinator) {
        companyData.isAlsoLogisticsCoordinator = isAlsoLogisticsCoordinator
      }
      if (companyType === "logistics_coordinator" && isAlsoTransporter) {
        companyData.isAlsoTransporter = isAlsoTransporter
      }

      // Add Order Config only for mine companies
      if (companyType === "mine") {
        companyData.orderConfig = {
          orderNumberMode,
          defaultDailyTruckLimit,
          defaultDailyWeightLimit,
          defaultMonthlyLimit,
          defaultTripLimit,
          defaultWeightPerTruck,
          preBookingMode,
          advanceBookingHours,
          defaultSealRequired,
          defaultSealQuantity,
        }
        // Add optional orderNumberPrefix only if it has a value
        if (orderNumberPrefix) {
          companyData.orderConfig.orderNumberPrefix = orderNumberPrefix
        }
      }

      // Add Fleet settings for transporters or dual-role logistics coordinators (reuse validation check)
      if (shouldHaveFleetSettings) {
        companyData.systemSettings = {
          fleetNumberEnabled,
          fleetNumberLabel,
          transporterGroupEnabled,
          transporterGroupLabel,
          groupOptions: groupOptions,
        }
      }

      // Add escalation settings
      companyData.securityAlerts = {
        primaryContactId: primaryContactId || "",
        secondaryContactIds: [], // Not used in UI for now
        escalationMinutes,
        qrMismatchContacts: [], // Not used in UI for now
        documentFailureContacts: [], // Not used in UI for now
        sealDiscrepancyContacts: [], // Not used in UI for now
        requiredResponseMinutes,
      }

      if (isEditing && company) {
        await CompanyService.update(company.id, companyData)
        setSuccessMessage(`Company "${name}" has been successfully updated!`)
      } else {
        await CompanyService.create(companyData)
        setSuccessMessage(`Company "${name}" has been successfully created!`)
      }

      // Show success alert instead of closing immediately
      setShowSuccessAlert(true)
    } catch (error) {
      console.error("Error saving company:", error)
      toast.error(`Failed to ${isEditing ? "update" : "create"} company`)
    } finally {
      setLoading(false)
    }
  }

  const addSecondaryContact = () => {
    if (!mainContactId || mainContactId.trim() === "") {
      toast.error("Please select a main contact first")
      return
    }

    if (!selectedSecondaryContact) {
      toast.error("Please select a contact to add")
      return
    }

    if (secondaryContactIds.includes(selectedSecondaryContact)) {
      toast.error("Contact already added")
      return
    }

    if (selectedSecondaryContact === mainContactId) {
      toast.error("Cannot add main contact as secondary contact")
      return
    }

    setSecondaryContactIds([...secondaryContactIds, selectedSecondaryContact])
    setSelectedSecondaryContact("")
    toast.success("Contact added")
  }

  const removeSecondaryContact = (userId: string) => {
    setSecondaryContactIds(secondaryContactIds.filter(id => id !== userId))
  }

  const availableSecondaryContacts = useMemo(
    () => users.filter(user => user.id !== mainContactId && !secondaryContactIds.includes(user.id)),
    [users, mainContactId, secondaryContactIds]
  )

  const addGroupOption = () => {
    const trimmedOption = newGroupOption.trim()

    if (!trimmedOption) {
      toast.error("Please enter a group name")
      return
    }

    if (groupOptions.includes(trimmedOption)) {
      toast.error("This group option already exists")
      return
    }

    setGroupOptions([...groupOptions, trimmedOption])
    setNewGroupOption("")
    toast.success("Group option added")
  }

  const removeGroupOption = (option: string) => {
    setGroupOptions(groupOptions.filter(opt => opt !== option))
  }

  const handleSuccessAlertClose = () => {
    setShowSuccessAlert(false)
    onSuccess()
    onClose()
    resetForm()
  }

  // Determine which tabs to show
  const showOrderConfig = companyType === "mine"
  const showFleet = companyType === "transporter" || (companyType === "logistics_coordinator" && isAlsoTransporter)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-6xl w-[98vw] sm:!max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Company" : "Create New Company"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update company information and settings" : "Create a new company with initial configuration"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${2 + (showOrderConfig ? 1 : 0) + (showFleet ? 1 : 0)}, 1fr)` }}>
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              {showOrderConfig && <TabsTrigger value="order">Order Config</TabsTrigger>}
              {showFleet && <TabsTrigger value="fleet">Fleet</TabsTrigger>}
              <TabsTrigger value="escalation">Escalation</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter company name" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyType">
                    Company Type <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="companyType"
                    value={companyType}
                    onChange={e => setCompanyType(e.target.value as "mine" | "transporter" | "logistics_coordinator")}
                    className="w-full border rounded-md px-3 py-2 bg-background"
                    required>
                    <option value="mine">Mine</option>
                    <option value="transporter">Transporter</option>
                    <option value="logistics_coordinator">Logistics Coordinator</option>
                  </select>
                </div>
              </div>

              {/* Dual-role options */}
              {companyType === "transporter" && (
                <div className="flex items-center space-x-2">
                  <Checkbox id="isAlsoLC" checked={isAlsoLogisticsCoordinator} onCheckedChange={checked => setIsAlsoLogisticsCoordinator(checked as boolean)} />
                  <Label htmlFor="isAlsoLC" className="cursor-pointer">
                    Is also a Logistics Coordinator
                  </Label>
                </div>
              )}

              {companyType === "logistics_coordinator" && (
                <div className="flex items-center space-x-2">
                  <Checkbox id="isAlsoTransporter" checked={isAlsoTransporter} onCheckedChange={checked => setIsAlsoTransporter(checked as boolean)} />
                  <Label htmlFor="isAlsoTransporter" className="cursor-pointer">
                    Is also a Transporter
                  </Label>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input id="registrationNumber" value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} placeholder="Optional" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vatNumber">VAT Number</Label>
                  <Input id="vatNumber" value={vatNumber} onChange={e => setVatNumber(e.target.value)} placeholder="Optional" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="physicalAddress">
                  Physical Address <span className="text-destructive">*</span>
                </Label>
                <Input id="physicalAddress" value={physicalAddress} onChange={e => setPhysicalAddress(e.target.value)} placeholder="Enter address" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mainContactId">Main Contact</Label>
                {!isEditing ? (
                  <div className="border rounded-md p-3 bg-muted/50">
                    <p className="text-sm text-muted-foreground">Main contact can be assigned after the company is created and users have been added to this company.</p>
                  </div>
                ) : loadingUsers ? (
                  <div className="text-sm text-muted-foreground">Loading users...</div>
                ) : (
                  <select
                    id="mainContactId"
                    value={mainContactId}
                    onChange={e => setMainContactId(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 bg-background">
                    <option value="">Select main contact (optional)</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.displayName} ({user.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Secondary Contacts</Label>
                {!isEditing ? (
                  <div className="border rounded-md p-3 bg-muted/50">
                    <p className="text-sm text-muted-foreground">Secondary contacts can be assigned after the company is created and users have been added to this company.</p>
                  </div>
                ) : loadingUsers ? (
                  <div className="text-sm text-muted-foreground">Loading users...</div>
                ) : !hasMainContact ? (
                  <div className="border rounded-md p-3 bg-muted/50">
                    <p className="text-sm text-muted-foreground">Please select a main contact first before adding secondary contacts</p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <select
                        value={selectedSecondaryContact}
                        onChange={e => setSelectedSecondaryContact(e.target.value)}
                        className="flex-1 border rounded-md px-3 py-2 bg-background">
                        <option value="">Select a contact to add...</option>
                        {availableSecondaryContacts.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.displayName} ({user.email})
                          </option>
                        ))}
                      </select>
                      <Button type="button" variant="outline" onClick={addSecondaryContact} disabled={!selectedSecondaryContact}>
                        Add
                      </Button>
                    </div>

                    {/* List of added secondary contacts */}
                    {secondaryContactIds.length > 0 && (
                      <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                        {secondaryContactIds.map(contactId => {
                          const user = users.find(u => u.id === contactId)
                          if (!user) return null
                          return (
                            <div key={contactId} className="flex items-center justify-between p-2 bg-accent/50 rounded-md">
                              <span className="text-sm">
                                {user.displayName} ({user.email})
                              </span>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeSecondaryContact(contactId)} className="h-6 w-6 p-0">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {secondaryContactIds.length === 0 ? "No secondary contacts added yet" : `${secondaryContactIds.length} contact(s) added`}
                    </p>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Order Config Tab (Mine only) */}
            {showOrderConfig && (
              <TabsContent value="order" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orderNumberMode">Order Number Mode</Label>
                    <select
                      id="orderNumberMode"
                      value={orderNumberMode}
                      onChange={e => setOrderNumberMode(e.target.value as "autoOnly" | "manualAllowed")}
                      className="w-full border rounded-md px-3 py-2 bg-background">
                      <option value="autoOnly">Auto-Generated Only</option>
                      <option value="manualAllowed">Manual Entry Allowed</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orderNumberPrefix">Order Number Prefix</Label>
                    <Input id="orderNumberPrefix" value={orderNumberPrefix} onChange={e => setOrderNumberPrefix(e.target.value)} placeholder="e.g., ORD-" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultDailyTruckLimit">Default Daily Truck Limit</Label>
                    <Input
                      id="defaultDailyTruckLimit"
                      type="number"
                      value={defaultDailyTruckLimit}
                      onChange={e => setDefaultDailyTruckLimit(Number(e.target.value))}
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defaultDailyWeightLimit">Default Daily Weight Limit (tons)</Label>
                    <Input
                      id="defaultDailyWeightLimit"
                      type="number"
                      value={defaultDailyWeightLimit}
                      onChange={e => setDefaultDailyWeightLimit(Number(e.target.value))}
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultMonthlyLimit">Default Monthly Limit (tons)</Label>
                    <Input
                      id="defaultMonthlyLimit"
                      type="number"
                      value={defaultMonthlyLimit}
                      onChange={e => setDefaultMonthlyLimit(Number(e.target.value))}
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defaultTripLimit">Default Trip Limit (per day)</Label>
                    <Input id="defaultTripLimit" type="number" value={defaultTripLimit} onChange={e => setDefaultTripLimit(Number(e.target.value))} min="1" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultWeightPerTruck">Default Weight Per Truck (tons)</Label>
                    <Input
                      id="defaultWeightPerTruck"
                      type="number"
                      value={defaultWeightPerTruck}
                      onChange={e => setDefaultWeightPerTruck(Number(e.target.value))}
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preBookingMode">Pre-Booking Mode</Label>
                    <select
                      id="preBookingMode"
                      value={preBookingMode}
                      onChange={e => setPreBookingMode(e.target.value as "compulsory" | "optional")}
                      className="w-full border rounded-md px-3 py-2 bg-background">
                      <option value="compulsory">Compulsory</option>
                      <option value="optional">Optional</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="advanceBookingHours">Advance Booking Hours</Label>
                    <Input
                      id="advanceBookingHours"
                      type="number"
                      value={advanceBookingHours}
                      onChange={e => setAdvanceBookingHours(Number(e.target.value))}
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defaultSealQuantity">Default Seal Quantity</Label>
                    <Input
                      id="defaultSealQuantity"
                      type="number"
                      value={defaultSealQuantity}
                      onChange={e => setDefaultSealQuantity(Number(e.target.value))}
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="defaultSealRequired" checked={defaultSealRequired} onCheckedChange={checked => setDefaultSealRequired(checked as boolean)} />
                  <Label htmlFor="defaultSealRequired" className="cursor-pointer">
                    Seals Required by Default
                  </Label>
                </div>
              </TabsContent>
            )}

            {/* Fleet Tab (Transporter or dual-role LC) */}
            {showFleet && (
              <TabsContent value="fleet" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="fleetNumberEnabled" checked={fleetNumberEnabled} onCheckedChange={checked => setFleetNumberEnabled(checked as boolean)} />
                    <Label htmlFor="fleetNumberEnabled" className="cursor-pointer">
                      Enable Fleet Number
                    </Label>
                  </div>

                  {fleetNumberEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="fleetNumberLabel">Fleet Number Label</Label>
                      <Input id="fleetNumberLabel" value={fleetNumberLabel} onChange={e => setFleetNumberLabel(e.target.value)} placeholder="e.g., Fleet No." />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="transporterGroupEnabled"
                      checked={transporterGroupEnabled}
                      onCheckedChange={checked => setTransporterGroupEnabled(checked as boolean)}
                    />
                    <Label htmlFor="transporterGroupEnabled" className="cursor-pointer">
                      Enable Transporter Group
                    </Label>
                  </div>

                  {transporterGroupEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="transporterGroupLabel">Transporter Group Label</Label>
                        <Input
                          id="transporterGroupLabel"
                          value={transporterGroupLabel}
                          onChange={e => setTransporterGroupLabel(e.target.value)}
                          placeholder="e.g., Group"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Group Options <span className="text-destructive">*</span>
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            value={newGroupOption}
                            onChange={e => setNewGroupOption(e.target.value)}
                            placeholder="Enter group name..."
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                addGroupOption()
                              }
                            }}
                          />
                          <Button type="button" variant="outline" onClick={addGroupOption} disabled={!newGroupOption.trim()}>
                            Add
                          </Button>
                        </div>

                        {/* List of added group options */}
                        {groupOptions.length > 0 && (
                          <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                            {groupOptions.map((option, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-accent/50 rounded-md">
                                <span className="text-sm">{option}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeGroupOption(option)}
                                  className="h-6 w-6 p-0">
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                          {groupOptions.length === 0 ? "No group options added yet" : `${groupOptions.length} group option(s) added`}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            )}

            {/* Escalation Tab */}
            <TabsContent value="escalation" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primaryContactId">Primary Contact</Label>
                {!isEditing ? (
                  <div className="border rounded-md p-3 bg-muted/50">
                    <p className="text-sm text-muted-foreground">Primary contact for escalation can be assigned after the company is created and users have been added to this company.</p>
                  </div>
                ) : loadingUsers ? (
                  <div className="text-sm text-muted-foreground">Loading users...</div>
                ) : (
                  <select
                    id="primaryContactId"
                    value={primaryContactId}
                    onChange={e => setPrimaryContactId(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 bg-background">
                    <option value="">Select primary contact</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.displayName} ({user.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="escalationMinutes">Escalation Time (minutes)</Label>
                  <Input
                    id="escalationMinutes"
                    type="number"
                    value={escalationMinutes}
                    onChange={e => setEscalationMinutes(Number(e.target.value))}
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requiredResponseMinutes">Required Response Time (minutes)</Label>
                  <Input
                    id="requiredResponseMinutes"
                    type="number"
                    value={requiredResponseMinutes}
                    onChange={e => setRequiredResponseMinutes(Number(e.target.value))}
                    min="1"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Update Company" : "Create Company"}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Success Alert Dialog */}
      <AlertDialog open={showSuccessAlert} onOpenChange={setShowSuccessAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Success!</AlertDialogTitle>
            <AlertDialogDescription>{successMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleSuccessAlertClose}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Alert Dialog */}
      <AlertDialog open={showErrorAlert} onOpenChange={setShowErrorAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Info</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowErrorAlert(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
