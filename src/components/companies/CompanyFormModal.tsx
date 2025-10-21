"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { CompanyService } from "@/services/company.service"
import { AssetService } from "@/services/asset.service"
import type { Company, User, Group, Asset } from "@/types"
import { useAlert } from "@/hooks/useAlert"
import { useAuth } from "@/contexts/AuthContext"
import { X } from "lucide-react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { GroupsTreeManager } from "@/components/groups/GroupsTreeManager"
import { LocalGroupsManager, type PendingGroup } from "@/components/groups/LocalGroupsManager"
import { AssetListModal } from "@/components/assets/AssetListModal"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"
import { toast } from "sonner"

interface CompanyFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  company?: Company // For editing existing company
  viewOnly?: boolean // For read-only viewing
}

export function CompanyFormModal({ open, onClose, onSuccess, company, viewOnly = false }: CompanyFormModalProps) {
  useSignals() // Required for reactivity
  const { user } = useAuth()
  const { showSuccess, showError } = useAlert()
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
  const [inactiveGroups, setInactiveGroups] = useState<string[]>([]) // Groups marked as inactive
  const [newGroupOption, setNewGroupOption] = useState("")

  // Escalation (Security Alerts)
  const [primaryContactId, setPrimaryContactId] = useState("")
  const [escalationMinutes, setEscalationMinutes] = useState(15)
  const [requiredResponseMinutes, setRequiredResponseMinutes] = useState(30)

  const [loading, setLoading] = useState(false)
  const [selectedSecondaryContact, setSelectedSecondaryContact] = useState("")

  const [localUsers, setLocalUsers] = useState<User[]>([])
  const [loadingLocalUsers, setLoadingLocalUsers] = useState(false)

  const [localGroups, setLocalGroups] = useState<Group[]>([])
  const [loadingLocalGroups, setLoadingLocalGroups] = useState(false)

  // Pending groups (saved when company form is submitted)
  const [pendingGroups, setPendingGroups] = useState<PendingGroup[]>([])

  // AssetListModal state
  const [assetListModalOpen, setAssetListModalOpen] = useState(false)
  const [affectedAssets, setAffectedAssets] = useState<Asset[]>([])
  const [modalField, setModalField] = useState<"fleetNumber" | "group">("fleetNumber")
  const [modalFieldLabel, setModalFieldLabel] = useState("")

  const hasMainContact = mainContactId && mainContactId.trim() !== ""

  // Create a map from tempId to actual group ID (for checking site usage)
  const existingGroupIdMap = useMemo(() => {
    if (!isEditing || !company?.id) return undefined
    const map = new Map<string, string>()
    // When editing, tempId IS the actual group ID
    pendingGroups.forEach(g => {
      map.set(g.tempId, g.tempId)
    })
    return map
  }, [isEditing, company?.id, pendingGroups])

  // Determine if editing current user's company (can use centralized data)
  const editingCurrentCompany = company?.id === user?.companyId

  // Get assets for validation (from globalData for current company, will need to fetch for others)
  const assets = globalData.assets.value

  // Check if fleet numbers are in use by active assets
  const assetsWithFleetNumbers = useMemo(() => {
    if (!isEditing || !company) return []
    return assets.filter(
      asset =>
        asset.companyId === company.id &&
        asset.isActive &&
        asset.fleetNumber &&
        asset.fleetNumber.trim() !== ""
    )
  }, [assets, isEditing, company])

  // Get list of assets using groups
  const assetsWithGroups = useMemo(() => {
    if (!isEditing || !company) return []
    return assets.filter(
      asset =>
        asset.companyId === company.id &&
        asset.isActive &&
        asset.groupId &&
        asset.groupId.trim() !== ""
    )
  }, [assets, isEditing, company])

  // Check if a specific group name is in use by active assets
  const isGroupNameInUse = (groupName: string) => {
    if (!isEditing || !company) return false
    return assets.some(
      asset =>
        asset.companyId === company.id &&
        asset.isActive &&
        asset.groupId === groupName
    )
  }

  // Use centralized data when editing current company, otherwise fetch locally
  useEffect(() => {
    if (!open || !isEditing || !company || editingCurrentCompany) {
      setLocalUsers([])
      return
    }

    // Only fetch when editing a different company
    const fetchUsersForCompany = async () => {
      try {
        setLoadingLocalUsers(true)
        const q = query(collection(db, "users"), where("companyId", "==", company.id))
        const snapshot = await getDocs(q)
        const usersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as User[]
        setLocalUsers(usersList)
      } catch (error) {
        console.error("Error fetching users for company:", error)
        showError("Error", "Failed to load users for this company")
        setLocalUsers([])
      } finally{
        setLoadingLocalUsers(false)
      }
    }

    fetchUsersForCompany()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEditing, company?.id, editingCurrentCompany])

  // Fetch groups when editing a different company
  useEffect(() => {
    if (!open || !isEditing || !company || editingCurrentCompany) {
      setLocalGroups([])
      return
    }

    // Only fetch when editing a different company
    const fetchGroupsForCompany = async () => {
      try {
        setLoadingLocalGroups(true)
        const q = query(collection(db, "groups"), where("companyId", "==", company.id))
        const snapshot = await getDocs(q)
        const groupsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Group[]
        setLocalGroups(groupsList)
      } catch (error) {
        console.error("Error fetching groups for company:", error)
        showError("Error", "Failed to load groups for this company")
        setLocalGroups([])
      } finally {
        setLoadingLocalGroups(false)
      }
    }

    fetchGroupsForCompany()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEditing, company?.id, editingCurrentCompany])

  // Select data source: centralized for current company, local for others
  const users = editingCurrentCompany ? globalData.users.value : localUsers
  const loadingUsers = editingCurrentCompany ? globalData.loading.value : loadingLocalUsers

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
        setInactiveGroups(company.systemSettings.inactiveGroups || [])
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

  // Load existing groups when editing a company
  useEffect(() => {
    if (!open || !company?.id) {
      setPendingGroups([])
      return
    }

    // Use appropriate data source based on which company is being edited
    const existingGroups = editingCurrentCompany
      ? globalData.groups.value.filter(g => g.companyId === company.id)
      : localGroups

    // Convert existing groups to pending groups
    const pending: PendingGroup[] = existingGroups.map(g => ({
      tempId: g.id, // Use existing ID as tempId
      name: g.name,
      description: g.description,
      parentTempId: g.parentGroupId,
      level: g.level,
      path: g.path,
    }))
    setPendingGroups(pending)
  }, [open, company?.id, editingCurrentCompany, localGroups])

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
    setPendingGroups([])
  }

  const saveGroups = async (companyId: string) => {
    const { createDocument, updateDocument } = await import("@/lib/firebase-utils")
    const { doc, deleteDoc } = await import("firebase/firestore")
    const { db } = await import("@/lib/firebase")

    try {
      // Get existing groups for this company
      const existingGroups = globalData.groups.value.filter(g => g.companyId === companyId)
      const existingIds = new Set(existingGroups.map(g => g.id))
      const pendingIds = new Set(pendingGroups.map(g => g.tempId))

      // Delete groups that were removed
      const toDelete = existingGroups.filter(g => !pendingIds.has(g.id))
      for (const group of toDelete) {
        await deleteDoc(doc(db, "groups", group.id))
      }

      // Create a map from tempId to real ID for new groups
      const tempIdToRealId = new Map<string, string>()

      // First, update existing groups and create new ones (in order of level to maintain hierarchy)
      const sortedPending = [...pendingGroups].sort((a, b) => a.level - b.level)

      for (const pending of sortedPending) {
        const isExisting = existingIds.has(pending.tempId)

        // Map parent tempId to real ID if needed
        const parentGroupId = pending.parentTempId
          ? tempIdToRealId.get(pending.parentTempId) || pending.parentTempId
          : undefined

        const groupData: any = {
          name: pending.name,
          level: pending.level,
          path: pending.path.map(tempId => tempIdToRealId.get(tempId) || tempId),
          isActive: true,
          companyId,
          createdAt: isExisting ? existingGroups.find(g => g.id === pending.tempId)?.createdAt || Date.now() : Date.now(),
          updatedAt: Date.now(),
          dbCreatedAt: null as any,
          dbUpdatedAt: null as any,
        }

        if (pending.description) {
          groupData.description = pending.description
        }
        if (parentGroupId) {
          groupData.parentGroupId = parentGroupId
        }

        if (isExisting) {
          // Update existing group
          await updateDocument("groups", pending.tempId, groupData)
          tempIdToRealId.set(pending.tempId, pending.tempId)
        } else {
          // Create new group
          const newId = await createDocument("groups", groupData)
          tempIdToRealId.set(pending.tempId, newId)
        }
      }
    } catch (error) {
      console.error("Error saving groups:", error)
      showError("Failed to Save Groups", error instanceof Error ? error.message : "An unexpected error occurred.")
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name) {
      showError("Error", "Company name is required")
      return
    }

    if (!physicalAddress) {
      showError("Error", "Physical address is required")
      return
    }

    // Validate transporter group options if enabled (only for transporters or dual-role LC)
    const shouldHaveFleetSettings = companyType === "transporter" || (companyType === "logistics_coordinator" && isAlsoTransporter)
    if (shouldHaveFleetSettings && transporterGroupEnabled && groupOptions.length === 0) {
      showError("Error", "At least one group option is required when transporter group is enabled.")
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
          inactiveGroups: inactiveGroups,
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

      let companyId: string

      if (isEditing && company) {
        await CompanyService.update(company.id, companyData)
        companyId = company.id
        showSuccess("Company Updated", `${name} has been successfully updated!`)
      } else {
        companyId = await CompanyService.create(companyData)
        showSuccess("Company Created", `${name} has been successfully created!`)
      }

      // Save groups if this is a mine company
      if (companyType === "mine" && pendingGroups.length > 0) {
        await saveGroups(companyId)
      }

      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error("Error saving company:", error)
      showError(`Failed to ${isEditing ? "Update" : "Create"} Company`, error instanceof Error ? error.message : "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const addSecondaryContact = () => {
    if (!mainContactId || mainContactId.trim() === "") {
      showError("Error", "Please select a main contact first")
      return
    }

    if (!selectedSecondaryContact) {
      showError("Error", "Please select a contact to add")
      return
    }

    if (secondaryContactIds.includes(selectedSecondaryContact)) {
      showError("Error", "Contact already added")
      return
    }

    if (selectedSecondaryContact === mainContactId) {
      showError("Error", "Cannot add main contact as secondary contact")
      return
    }

    setSecondaryContactIds([...secondaryContactIds, selectedSecondaryContact])
    setSelectedSecondaryContact("")
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
      showError("Error", "Please enter a group name")
      return
    }

    if (groupOptions.includes(trimmedOption)) {
      showError("Error", "This group option already exists")
      return
    }

    setGroupOptions([...groupOptions, trimmedOption])
    setNewGroupOption("")
  }

  const removeGroupOption = (option: string) => {
    // Check if this group is in use by active assets
    if (isGroupNameInUse(option)) {
      showError(
        "Cannot Delete Group",
        `The group "${option}" is currently assigned to active assets. Please mark it as inactive instead of deleting it.`
      )
      return
    }

    // Not in use - safe to delete
    setGroupOptions(groupOptions.filter(opt => opt !== option))
  }

  const toggleGroupInactive = (groupName: string) => {
    if (inactiveGroups.includes(groupName)) {
      // Mark as active (remove from inactive list)
      setInactiveGroups(inactiveGroups.filter(g => g !== groupName))
    } else {
      // Mark as inactive (add to inactive list)
      setInactiveGroups([...inactiveGroups, groupName])
    }
  }

  const handleFleetNumberEnabledChange = (checked: boolean) => {
    // If trying to disable and fleet numbers are in use, show modal
    if (!checked && assetsWithFleetNumbers.length > 0) {
      setAffectedAssets(assetsWithFleetNumbers)
      setModalField("fleetNumber")
      setModalFieldLabel(fleetNumberLabel || "Fleet Number")
      setAssetListModalOpen(true)
      return
    }

    setFleetNumberEnabled(checked)
  }

  const handleTransporterGroupEnabledChange = (checked: boolean) => {
    // If trying to disable and groups are in use, show modal
    if (!checked && assetsWithGroups.length > 0) {
      setAffectedAssets(assetsWithGroups)
      setModalField("group")
      setModalFieldLabel(transporterGroupLabel || "Group")
      setAssetListModalOpen(true)
      return
    }

    setTransporterGroupEnabled(checked)
  }

  // Bulk removal function for fleet numbers
  const handleBulkRemoveFleetNumbers = async () => {
    try {
      // Update all affected assets to remove fleet number
      const promises = assetsWithFleetNumbers.map(asset =>
        AssetService.update(asset.id, { fleetNumber: null })
      )

      await Promise.all(promises)

      toast.success(`Removed fleet numbers from ${assetsWithFleetNumbers.length} asset${assetsWithFleetNumbers.length !== 1 ? "s" : ""}`)

      // Now disable the feature
      setFleetNumberEnabled(false)
    } catch (error) {
      console.error("Error removing fleet numbers:", error)
      toast.error("Failed to remove fleet numbers from some assets")
      throw error // Re-throw to let modal handle it
    }
  }

  // Bulk removal function for groups
  const handleBulkRemoveGroups = async () => {
    try {
      // Update all affected assets to remove group
      const promises = assetsWithGroups.map(asset =>
        AssetService.update(asset.id, { groupId: null })
      )

      await Promise.all(promises)

      toast.success(`Removed groups from ${assetsWithGroups.length} asset${assetsWithGroups.length !== 1 ? "s" : ""}`)

      // Now disable the feature
      setTransporterGroupEnabled(false)
    } catch (error) {
      console.error("Error removing groups:", error)
      toast.error("Failed to remove groups from some assets")
      throw error // Re-throw to let modal handle it
    }
  }

  // Determine which tabs to show
  const showOrderConfig = companyType === "mine"
  const showFleet = companyType === "transporter" || (companyType === "logistics_coordinator" && isAlsoTransporter)
  const showGroups = companyType === "mine" // Show groups tab for all mine companies (with appropriate message for new companies)

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-6xl w-[98vw] sm:!max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{viewOnly ? "View Company" : isEditing ? "Edit Company" : "Create New Company"}</DialogTitle>
          <DialogDescription>
            {viewOnly ? "View company information and settings" : isEditing ? "Update company information and settings" : "Create a new company with initial configuration"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${2 + (showOrderConfig ? 1 : 0) + (showFleet ? 1 : 0) + (showGroups ? 1 : 0)}, 1fr)` }}>
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              {showOrderConfig && <TabsTrigger value="order">Order Config</TabsTrigger>}
              {showFleet && <TabsTrigger value="fleet">Fleet</TabsTrigger>}
              {showGroups && <TabsTrigger value="groups">Groups</TabsTrigger>}
              <TabsTrigger value="escalation">Escalation</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
              <fieldset disabled={viewOnly} className="space-y-4">
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
              </fieldset>
            </TabsContent>

            {/* Order Config Tab (Mine only) */}
            {showOrderConfig && (
              <TabsContent value="order" className="space-y-4">
                <fieldset disabled={viewOnly} className="space-y-4">
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
                </fieldset>
              </TabsContent>
            )}

            {/* Fleet Tab (Transporter or dual-role LC) */}
            {showFleet && (
              <TabsContent value="fleet" className="space-y-4">
                <fieldset disabled={viewOnly} className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fleetNumberEnabled"
                      checked={fleetNumberEnabled}
                      onCheckedChange={checked => handleFleetNumberEnabledChange(checked as boolean)}
                    />
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
                      onCheckedChange={checked => handleTransporterGroupEnabledChange(checked as boolean)}
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
                            {groupOptions.map((option, index) => {
                              const isInactive = inactiveGroups.includes(option)
                              const isInUse = isGroupNameInUse(option)

                              return (
                                <div
                                  key={index}
                                  className={`flex items-center justify-between p-2 rounded-md ${
                                    isInactive ? "bg-muted opacity-60" : "bg-accent/50"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{option}</span>
                                    {isInactive && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted-foreground/20 text-muted-foreground">
                                        Inactive
                                      </span>
                                    )}
                                    {isInUse && !isInactive && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300">
                                        In Use
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    {isInUse ? (
                                      // If in use, show inactive toggle instead of delete
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleGroupInactive(option)}
                                        className="h-6 px-2 text-xs"
                                      >
                                        {isInactive ? "Activate" : "Deactivate"}
                                      </Button>
                                    ) : (
                                      // Not in use - can delete
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeGroupOption(option)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                          {groupOptions.length === 0 ? "No group options added yet" : `${groupOptions.length} group option(s) added`}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                </fieldset>
              </TabsContent>
            )}

            {/* Groups Tab (Mine only) */}
            {showGroups && (
              <TabsContent value="groups" className="space-y-4">
                <fieldset disabled={viewOnly} className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Organizational Groups</h3>
                  <p className="text-sm text-muted-foreground">
                    Create and manage hierarchical groups for your organization. Groups can be assigned to sites for better organization.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Note: Groups will be saved when you submit the company form.
                  </p>
                </div>
                <LocalGroupsManager
                  groups={pendingGroups}
                  onChange={setPendingGroups}
                  companyId={company?.id}
                  existingGroupIdMap={existingGroupIdMap}
                />
                </fieldset>
              </TabsContent>
            )}

            {/* Escalation Tab */}
            <TabsContent value="escalation" className="space-y-4">
              <fieldset disabled={viewOnly} className="space-y-4">
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
              </fieldset>
            </TabsContent>
          </Tabs>

          {viewOnly ? (
            <div className="flex justify-end pt-4 border-t">
              <Button type="button" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : isEditing ? "Update Company" : "Create Company"}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>

      {/* AssetListModal for bulk removal */}
      <AssetListModal
        open={assetListModalOpen}
        onClose={() => setAssetListModalOpen(false)}
        assets={affectedAssets}
        field={modalField}
        fieldLabel={modalFieldLabel}
        onBulkRemove={modalField === "fleetNumber" ? handleBulkRemoveFleetNumbers : handleBulkRemoveGroups}
      />
    </>
  )
}
