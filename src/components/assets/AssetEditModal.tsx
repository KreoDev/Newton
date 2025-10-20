"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Asset } from "@/types"
import { AssetService } from "@/services/asset.service"
import { useSignals } from "@preact/signals-react/runtime"
import { data as globalData } from "@/services/data.service"
import { toast } from "sonner"
import { AlertCircle } from "lucide-react"

interface AssetEditModalProps {
  asset: Asset
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AssetEditModal({ asset, isOpen, onClose, onSuccess }: AssetEditModalProps) {
  useSignals()
  const companies = globalData.companies.value
  const groups = globalData.groups.value

  const [fleetNumber, setFleetNumber] = useState(asset.fleetNumber || "")
  const [groupId, setGroupId] = useState(asset.groupId || "")
  const [isSaving, setIsSaving] = useState(false)

  const company = useMemo(() => {
    return companies.find(c => c.id === asset.companyId)
  }, [companies, asset.companyId])

  const companyGroups = useMemo(() => {
    return groups.filter(g => g.companyId === asset.companyId && g.isActive)
  }, [groups, asset.companyId])

  const fleetNumberEnabled = company?.systemSettings?.fleetNumberEnabled ?? false
  const groupEnabled = company?.systemSettings?.transporterGroupEnabled ?? false

  useEffect(() => {
    if (isOpen) {
      setFleetNumber(asset.fleetNumber || "")
      setGroupId(asset.groupId || "")
    }
  }, [isOpen, asset])

  const handleSave = async () => {
    setIsSaving(true)

    try {
      await AssetService.update(asset.id, {
        fleetNumber: fleetNumber.trim() || undefined,
        groupId: groupId || undefined,
      })

      toast.success("Asset updated successfully")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error updating asset:", error)
      toast.error("Failed to update asset")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Asset</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Note about read-only fields */}
          <div className="p-4 bg-muted rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">Barcode fields cannot be edited</p>
              <p>To change registration, license, or QR code data, you must delete this asset and induct it again.</p>
            </div>
          </div>

          {/* Editable Fields */}
          {fleetNumberEnabled && (
            <div className="space-y-2">
              <Label htmlFor="fleetNumber">{company?.systemSettings?.fleetNumberLabel || "Fleet Number"}</Label>
              <Input
                id="fleetNumber"
                type="text"
                placeholder={`Enter ${company?.systemSettings?.fleetNumberLabel?.toLowerCase() || "fleet number"}...`}
                value={fleetNumber}
                onChange={e => setFleetNumber(e.target.value)}
              />
            </div>
          )}

          {groupEnabled && (
            <div className="space-y-2">
              <Label htmlFor="group">{company?.systemSettings?.transporterGroupLabel || "Transporter Group"}</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger id="group">
                  <SelectValue placeholder="Select a group (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {companyGroups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!fleetNumberEnabled && !groupEnabled && (
            <p className="text-sm text-muted-foreground text-center py-4">No editable fields are configured for this company.</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
