"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Asset } from "@/types"
import { AssetService } from "@/services/asset.service"
import { toast } from "sonner"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"

interface AssetOptionalFieldsEditModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  asset: Asset
}

export function AssetOptionalFieldsEditModal({ open, onClose, onSuccess, asset }: AssetOptionalFieldsEditModalProps) {
  useSignals()
  const companies = globalData.companies.value

  const [fleetNumber, setFleetNumber] = useState(asset.fleetNumber || "")
  const [groupId, setGroupId] = useState(asset.groupId || "")
  const [loading, setLoading] = useState(false)

  const company = useMemo(() => {
    return companies.find(c => c.id === asset.companyId)
  }, [companies, asset.companyId])

  // Get available groups (filter out inactive ones)
  const groupOptions = useMemo(() => {
    const allGroups = company?.systemSettings?.groupOptions || []
    const inactiveGroups = company?.systemSettings?.inactiveGroups || []
    return allGroups.filter(group => !inactiveGroups.includes(group))
  }, [company])

  const fleetNumberEnabled = company?.systemSettings?.fleetNumberEnabled ?? false
  const groupEnabled = company?.systemSettings?.transporterGroupEnabled ?? false

  const handleSave = async () => {
    try {
      setLoading(true)

      const updates: Partial<Asset> = {}

      // Update fleet number (empty string means clear it)
      if (fleetNumberEnabled) {
        updates.fleetNumber = fleetNumber.trim() || undefined
      }

      // Update group (empty string means clear it)
      if (groupEnabled) {
        updates.groupId = groupId || undefined
      }

      await AssetService.update(asset.id, updates)
      toast.success("Optional fields updated successfully")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error updating optional fields:", error)
      toast.error("Failed to update optional fields")
    } finally {
      setLoading(false)
    }
  }

  if (!fleetNumberEnabled && !groupEnabled) {
    return null // Nothing to edit
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Optional Fields</DialogTitle>
          <DialogDescription>
            Update fleet number or group assignment for this asset.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {fleetNumberEnabled && (
            <div className="space-y-2">
              <Label htmlFor="fleetNumber">
                {company?.systemSettings?.fleetNumberLabel || "Fleet Number"}
              </Label>
              <Input
                id="fleetNumber"
                value={fleetNumber}
                onChange={e => setFleetNumber(e.target.value)}
                placeholder="Leave empty to remove"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to remove fleet number from this asset
              </p>
            </div>
          )}

          {groupEnabled && (
            <div className="space-y-2">
              <Label htmlFor="group">
                {company?.systemSettings?.transporterGroupLabel || "Group"}
              </Label>
              <Select value={groupId || "none"} onValueChange={val => setGroupId(val === "none" ? "" : val)}>
                <SelectTrigger id="group">
                  <SelectValue placeholder="Select group..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">(None)</SelectItem>
                  {groupOptions.map((groupName, index) => (
                    <SelectItem key={index} value={groupName}>
                      {groupName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select &quot;(None)&quot; to remove group from this asset
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
