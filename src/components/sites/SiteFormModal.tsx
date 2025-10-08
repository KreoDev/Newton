"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { X } from "lucide-react"
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
  viewOnly?: boolean // For read-only viewing
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

export function SiteFormModal({ open, onClose, onSuccess, site, viewOnly = false }: SiteFormModalProps) {
  useSignals() // Required for reactivity
  const { user } = useAuth()
  const { showSuccess, showError } = useAlert()
  const isEditing = Boolean(site)

  const [name, setName] = useState("")
  const [siteType, setSiteType] = useState<"collection" | "destination">("collection")
  const [physicalAddress, setPhysicalAddress] = useState("")
  const [mainContactId, setMainContactId] = useState<string>("")
  const [secondaryContactIds, setSecondaryContactIds] = useState<string[]>([])
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
      setMainContactId(site.mainContactId || "")
      setSecondaryContactIds(site.secondaryContactIds || [])
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
    setMainContactId("")
    setSecondaryContactIds([])
    setGroupId("")
    setOperatingHours(DEFAULT_OPERATING_HOURS)
    setIsActive(true)
  }

  // Helper functions for secondary contacts
  const addSecondaryContact = (userId: string) => {
    if (userId && !secondaryContactIds.includes(userId) && userId !== mainContactId) {
      setSecondaryContactIds([...secondaryContactIds, userId])
    }
  }

  const removeSecondaryContact = (userId: string) => {
    setSecondaryContactIds(secondaryContactIds.filter(id => id !== userId))
  }

  // Get available users for secondary contacts (excluding primary contact)
  const availableSecondaryContacts = useMemo(() => {
    return users.filter(u => u.id !== mainContactId && !secondaryContactIds.includes(u.id))
  }, [users, mainContactId, secondaryContactIds])

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

    // Validate main contact has phone number
    if (!mainContactId) {
      showError("Error", "Primary contact is required")
      return
    }

    const mainContact = users.find(u => u.id === mainContactId)
    if (!mainContact || !mainContact.phoneNumber || mainContact.phoneNumber.trim() === "") {
      showError("Error", "Primary contact must have a phone number")
      return
    }

    // Validate secondary contacts have phone numbers
    for (const secondaryId of secondaryContactIds) {
      const secondaryContact = users.find(u => u.id === secondaryId)
      if (!secondaryContact || !secondaryContact.phoneNumber || secondaryContact.phoneNumber.trim() === "") {
        showError("Error", "All secondary contacts must have phone numbers")
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
        mainContactId,
        secondaryContactIds,
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
      <DialogContent className="max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] w-auto h-auto overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{viewOnly ? "View Site" : isEditing ? "Edit Site" : "Create New Site"}</DialogTitle>
          <DialogDescription>
            {viewOnly ? "View site information and operating hours" : isEditing ? "Update site information and operating hours" : "Add a new collection or destination site"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Site Name <span className="text-destructive">*</span>
            </Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Main Warehouse" required disabled={viewOnly} />
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
              disabled={viewOnly}
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
              disabled={viewOnly}
            />
          </div>

          {/* Primary Contact */}
          <div className="space-y-2">
            <Label htmlFor="mainContactId">
              Primary Contact <span className="text-destructive">*</span>
            </Label>
            {loadingUsers ? (
              <p className="text-sm text-muted-foreground">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users with phone numbers available.</p>
            ) : (
              <select
                id="mainContactId"
                value={mainContactId}
                onChange={e => setMainContactId(e.target.value)}
                className="w-full border rounded-md px-3 py-2 bg-background"
                required
                disabled={viewOnly}
              >
                <option value="">-- Select Primary Contact --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email}) - {u.phoneNumber}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-muted-foreground">Main site contact person (required)</p>
          </div>

          {/* Secondary Contacts */}
          <div className="space-y-2">
            <Label>Secondary Contacts (Optional)</Label>

            {/* List of selected secondary contacts */}
            {secondaryContactIds.length > 0 && (
              <div className="space-y-2 mb-2">
                {secondaryContactIds.map(userId => {
                  const contactUser = users.find(u => u.id === userId)
                  if (!contactUser) return null
                  return (
                    <div key={userId} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                      <span className="text-sm">
                        {contactUser.firstName} {contactUser.lastName} ({contactUser.email}) - {contactUser.phoneNumber}
                      </span>
                      {!viewOnly && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSecondaryContact(userId)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Add secondary contact dropdown */}
            {!viewOnly && availableSecondaryContacts.length > 0 && (
              <select
                onChange={e => {
                  if (e.target.value) {
                    addSecondaryContact(e.target.value)
                    e.target.value = ""
                  }
                }}
                className="w-full border rounded-md px-3 py-2 bg-background"
              >
                <option value="">-- Add Secondary Contact --</option>
                {availableSecondaryContacts.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email}) - {u.phoneNumber}
                  </option>
                ))}
              </select>
            )}

            <p className="text-xs text-muted-foreground">
              {secondaryContactIds.length} secondary contact(s) selected. Only users with phone numbers are shown.
            </p>
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
                  disabled={viewOnly}
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

          <OperatingHoursEditor value={operatingHours} onChange={setOperatingHours} disabled={viewOnly} />

          <div className="flex items-center space-x-2">
            <Checkbox id="isActive" checked={isActive} onCheckedChange={checked => setIsActive(checked as boolean)} disabled={viewOnly} />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active
            </Label>
          </div>

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
                {loading ? "Saving..." : isEditing ? "Update Site" : "Create Site"}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
