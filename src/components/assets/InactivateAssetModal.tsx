"use client"

import { useState, useEffect } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Asset } from "@/types"
import { AssetService } from "@/services/asset.service"
import { toast } from "sonner"
import { AlertTriangle } from "lucide-react"

interface InactivateAssetModalProps {
  asset: Asset
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function InactivateAssetModal({ asset, isOpen, onClose, onSuccess }: InactivateAssetModalProps) {
  const [reason, setReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setReason("")
    }
  }, [isOpen])

  const handleInactivate = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for marking this asset inactive")
      return
    }

    setIsProcessing(true)

    try {
      await AssetService.inactivate(asset.id, reason.trim())
      toast.success("Asset marked as inactive")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error inactivating asset:", error)
      toast.error("Failed to mark asset as inactive")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark Asset as Inactive</AlertDialogTitle>
          <AlertDialogDescription>
            This will hide the asset from operational dropdowns but preserve all transaction history.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">Asset:</p>
            <p className="text-sm text-muted-foreground capitalize">
              {asset.type}: {asset.registration || asset.registrationNumber || asset.licenseNumber || asset.licenceNumber}
            </p>
            <p className="text-xs text-muted-foreground mt-1">QR: {asset.ntCode}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inactive-reason">Why are you marking this asset inactive? *</Label>
            <Textarea
              id="inactive-reason"
              placeholder="e.g., License expired, Vehicle sold, Driver resigned, No longer in service..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">This reason will be displayed on the asset details page</p>
          </div>

          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-600" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium">Note:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Inactive assets won&apos;t appear in order allocation or weighbridge operations</li>
                  <li>All historical transactions will be preserved</li>
                  <li>You can reactivate this asset later if needed</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="default" className="bg-yellow-600 hover:bg-yellow-700" onClick={handleInactivate} disabled={!reason.trim() || isProcessing}>
              {isProcessing ? "Processing..." : "Mark as Inactive"}
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
