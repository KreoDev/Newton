"use client"

import { useState } from "react"
import type { Asset } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"

interface BulkFleetNumberModalProps {
  selectedAssets: Asset[]
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function BulkFleetNumberModal({
  selectedAssets,
  isOpen,
  onClose,
  onSuccess,
}: BulkFleetNumberModalProps) {
  useSignals()
  const { showSuccess, showError, showConfirm } = useAlert()
  const [loading, setLoading] = useState(false)
  const [fleetNumber, setFleetNumber] = useState("")
  const [clearFleetNumber, setClearFleetNumber] = useState(false)

  const allAssets = globalData.assets.value

  const handleSubmit = async () => {
    // Validation
    if (!clearFleetNumber && !fleetNumber.trim()) {
      showError("Invalid Input", "Please enter a fleet number or check 'Clear fleet number'")
      return
    }

    // Check for duplicate fleet number if not clearing
    if (!clearFleetNumber && fleetNumber.trim()) {
      const duplicateAsset = allAssets.find(
        a =>
          a.fleetNumber === fleetNumber.trim() &&
          !selectedAssets.some(sa => sa.id === a.id) // Exclude selected assets
      )

      if (duplicateAsset) {
        showError(
          "Duplicate Fleet Number",
          `Fleet number "${fleetNumber.trim()}" is already assigned to ${duplicateAsset.registration || "another asset"}`
        )
        return
      }
    }

    const confirmed = await showConfirm(
      clearFleetNumber ? "Clear Fleet Numbers" : "Update Fleet Numbers",
      `Are you sure you want to ${clearFleetNumber ? "clear" : "update"} the fleet number for ${selectedAssets.length} asset${selectedAssets.length > 1 ? "s" : ""}?`,
      clearFleetNumber ? "Clear" : "Update"
    )
    if (!confirmed) return

    setLoading(true)
    try {
      // Update each asset
      await Promise.all(
        selectedAssets.map(asset =>
          updateDocument("assets", asset.id, {
            fleetNumber: clearFleetNumber ? null : fleetNumber.trim(),
          })
        )
      )

      showSuccess(
        clearFleetNumber ? "Fleet Numbers Cleared" : "Fleet Numbers Updated",
        `${selectedAssets.length} asset${selectedAssets.length > 1 ? "s have" : " has"} been updated.`
      )
      onSuccess()
      onClose()
      // Reset form
      setFleetNumber("")
      setClearFleetNumber(false)
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
          <DialogTitle>Update Fleet Numbers</DialogTitle>
          <DialogDescription>
            Update the fleet number for {selectedAssets.length} selected asset
            {selectedAssets.length > 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fleetNumber">Fleet Number</Label>
            <Input
              id="fleetNumber"
              value={fleetNumber}
              onChange={(e) => setFleetNumber(e.target.value)}
              disabled={clearFleetNumber || loading}
              placeholder="Enter fleet number"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="clearFleetNumber"
              checked={clearFleetNumber}
              onCheckedChange={(checked) => setClearFleetNumber(checked === true)}
              disabled={loading}
            />
            <Label
              htmlFor="clearFleetNumber"
              className="text-sm font-normal cursor-pointer"
            >
              Clear fleet number (remove from all selected assets)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Updating..." : clearFleetNumber ? "Clear" : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
