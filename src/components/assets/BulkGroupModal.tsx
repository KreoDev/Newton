"use client"

import { useState } from "react"
import type { Asset } from "@/types"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { updateDocument } from "@/lib/firebase-utils"
import { useAlert } from "@/hooks/useAlert"
import { useCompany } from "@/contexts/CompanyContext"
import { useSignals } from "@preact/signals-react/runtime"

interface BulkGroupModalProps {
  selectedAssets: Asset[]
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function BulkGroupModal({
  selectedAssets,
  isOpen,
  onClose,
  onSuccess,
}: BulkGroupModalProps) {
  useSignals()
  const { company } = useCompany()
  const { showSuccess, showError, showConfirm } = useAlert()
  const [loading, setLoading] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState("")
  const [clearGroup, setClearGroup] = useState(false)

  // Get active groups from company settings
  const activeGroups = company?.systemSettings?.groupOptions?.filter(
    group => !company.systemSettings?.inactiveGroups?.includes(group)
  ) || []

  const handleSubmit = async () => {
    // Validation
    if (!clearGroup && !selectedGroup) {
      showError("Invalid Selection", "Please select a group or check 'Clear group'")
      return
    }

    const confirmed = await showConfirm(
      clearGroup ? "Clear Groups" : "Update Groups",
      `Are you sure you want to ${clearGroup ? "clear" : "update"} the group for ${selectedAssets.length} asset${selectedAssets.length > 1 ? "s" : ""}?`,
      clearGroup ? "Clear" : "Update"
    )
    if (!confirmed) return

    setLoading(true)
    try {
      // Update each asset
      await Promise.all(
        selectedAssets.map(asset =>
          updateDocument("assets", asset.id, {
            groupId: clearGroup ? null : selectedGroup,
          })
        )
      )

      showSuccess(
        clearGroup ? "Groups Cleared" : "Groups Updated",
        `${selectedAssets.length} asset${selectedAssets.length > 1 ? "s have" : " has"} been updated.`
      )
      onSuccess()
      onClose()
      // Reset form
      setSelectedGroup("")
      setClearGroup(false)
    } catch (error) {
      showError(
        "Failed to Update",
        error instanceof Error ? error.message : "An error occurred"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update {company?.systemSettings?.transporterGroupLabel || "Group"}</DialogTitle>
          <DialogDescription>
            Update the {company?.systemSettings?.transporterGroupLabel?.toLowerCase() || "group"} for {selectedAssets.length} selected asset
            {selectedAssets.length > 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="group">{company?.systemSettings?.transporterGroupLabel || "Group"}</Label>
            <select
              id="group"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              disabled={clearGroup || loading}
              className="w-full px-4 py-2 rounded-md border bg-background"
            >
              <option value="">Select {company?.systemSettings?.transporterGroupLabel?.toLowerCase() || "group"}...</option>
              {activeGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="clearGroup"
              checked={clearGroup}
              onCheckedChange={(checked) => setClearGroup(checked === true)}
              disabled={loading}
            />
            <Label
              htmlFor="clearGroup"
              className="text-sm font-normal cursor-pointer"
            >
              Clear {company?.systemSettings?.transporterGroupLabel?.toLowerCase() || "group"} (remove from all selected assets)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Updating..." : clearGroup ? "Clear" : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
