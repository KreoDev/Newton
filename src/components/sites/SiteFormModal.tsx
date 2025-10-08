"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { Site } from "@/types"
import { useAlert } from "@/hooks/useAlert"
import { useAuth } from "@/contexts/AuthContext"
import { createDocument, updateDocument } from "@/lib/firebase-utils"
import { OperatingHoursEditor, type OperatingHours } from "./OperatingHoursEditor"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"

interface SiteFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  site?: Site // For editing existing site
}

const DEFAULT_OPERATING_HOURS: OperatingHours = {
  monday: { open: "06:00", close: "18:00" },
  tuesday: { open: "06:00", close: "18:00" },
  wednesday: { open: "06:00", close: "18:00" },
  thursday: { open: "06:00", close: "18:00" },
  friday: { open: "06:00", close: "18:00" },
  saturday: { open: "06:00", close: "14:00" },
  sunday: { open: "closed", close: "closed" },
}

export function SiteFormModal({ open, onClose, onSuccess, site }: SiteFormModalProps) {
  useSignals() // Required for reactivity
  const { user } = useAuth()
  const { showSuccess, showError } = useAlert()
  const isEditing = Boolean(site)

  const [name, setName] = useState("")
  const [siteType, setSiteType] = useState<"collection" | "destination">("collection")
  const [physicalAddress, setPhysicalAddress] = useState("")
  const [contactUserId, setContactUserId] = useState<string>("")
  const [groupId, setGroupId] = useState<string>("")
  const [operatingHours, setOperatingHours] = useState<OperatingHours>(DEFAULT_OPERATING_HOURS)
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)

  // Get data from centralized service
  const allUsers = globalData.users.value
  const allGroups = globalData.groups.value
  const allCompanies = globalData.companies.value
  const dataLoading = globalData.loading.value

  // Filter users with phone numbers
  const users = useMemo(() => {
    return allUsers.filter(u => u.isActive && u.phoneNumber && u.phoneNumber.trim() !== "")
  }, [allUsers])

  // Filter active groups
  const groups = useMemo(() => {
    return allGroups.filter(g => g.isActive)
  }, [allGroups])

  // Get current company
  const company = useMemo(() => {
    return allCompanies.find(c => c.id === user?.companyId) || null
  }, [allCompanies, user?.companyId])

  const loadingUsers = dataLoading
  const loadingGroups = dataLoading

  useEffect(() => {
    if (site && open) {
      setName(site.name)
      setSiteType(site.siteType)
      setPhysicalAddress(site.physicalAddress)
      setContactUserId(site.contactUserId || "")
      setGroupId(site.groupId || "")
      setOperatingHours((site.operatingHours as unknown as OperatingHours) || DEFAULT_OPERATING_HOURS)
      setIsActive(site.isActive)
    } else if (!site && open) {
      resetForm()
    }
  }, [site, open])

  const resetForm = () => {
    setName("")
    setSiteType("collection")
    setPhysicalAddress("")
    setContactUserId("")
    setGroupId("")
    setOperatingHours(DEFAULT_OPERATING_HOURS)
    setIsActive(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      showError("Error", "Site name is required")
      return
    }

    if (!physicalAddress.trim()) {
      showError("Error", "Physical address is required")
      return
    }

    // Validate contact person has phone number
    if (contactUserId) {
      const selectedUser = users.find(u => u.id === contactUserId)
      if (!selectedUser || !selectedUser.phoneNumber || selectedUser.phoneNumber.trim() === "") {
        showError("Error", "Selected contact person must have a phone number")
        return
      }
    }

    if (!user?.companyId) {
      showError("Error", "User company not found")
      return
    }

    try {
      setLoading(true)

      const siteData: any = {
        name: name.trim(),
        siteType,
        physicalAddress: physicalAddress.trim(),
        contactUserId: contactUserId || null,
        groupId: groupId || null,
        operatingHours,
        isActive,
        companyId: user.companyId,
      }

      if (isEditing && site) {
        await updateDocument("sites", site.id, siteData)
        showSuccess("Site Updated", `${name} has been updated successfully.`)
      } else {
        await createDocument("sites", siteData)
        showSuccess("Site Created", `${name} has been created successfully.`)
      }

      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error("Error saving site:", error)
      showError(`Failed to ${isEditing ? "Update" : "Create"} Site`, error instanceof Error ? error.message : "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Site" : "Create New Site"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update site information and operating hours" : "Add a new collection or destination site"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Site Name <span className="text-destructive">*</span>
            </Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Main Warehouse" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteType">
              Site Type <span className="text-destructive">*</span>
            </Label>
            <select
              id="siteType"
              value={siteType}
              onChange={e => setSiteType(e.target.value as "collection" | "destination")}
              className="w-full border rounded-md px-3 py-2 bg-background"
              required
            >
              <option value="collection">Collection</option>
              <option value="destination">Destination</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="physicalAddress">
              Physical Address <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="physicalAddress"
              value={physicalAddress}
              onChange={e => setPhysicalAddress(e.target.value)}
              placeholder="Enter full address"
              rows={2}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactUserId">Contact Person</Label>
            {loadingUsers ? (
              <p className="text-sm text-muted-foreground">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users with phone numbers available.</p>
            ) : (
              <select
                id="contactUserId"
                value={contactUserId}
                onChange={e => setContactUserId(e.target.value)}
                className="w-full border rounded-md px-3 py-2 bg-background"
              >
                <option value="">-- No Contact Person --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email}) - {u.phoneNumber}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-muted-foreground">Only users with phone numbers are shown</p>
          </div>

          {/* Group selector - only for mine companies */}
          {company?.companyType === "mine" && (
            <div className="space-y-2">
              <Label htmlFor="groupId">Organizational Group (Optional)</Label>
              {loadingGroups ? (
                <p className="text-sm text-muted-foreground">Loading groups...</p>
              ) : groups.length === 0 ? (
                <p className="text-sm text-muted-foreground">No groups available. Create groups in company settings.</p>
              ) : (
                <select
                  id="groupId"
                  value={groupId}
                  onChange={e => setGroupId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 bg-background"
                >
                  <option value="">-- No Group --</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.path.length > 0 ? '\u00A0\u00A0'.repeat(g.level) : ''}{g.name}
                      {g.description ? ` - ${g.description}` : ''}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-muted-foreground">Assign this site to an organizational group</p>
            </div>
          )}

          <OperatingHoursEditor value={operatingHours} onChange={setOperatingHours} />

          <div className="flex items-center space-x-2">
            <Checkbox id="isActive" checked={isActive} onCheckedChange={checked => setIsActive(checked as boolean)} />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Update Site" : "Create Site"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
