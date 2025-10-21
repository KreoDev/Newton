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
import { useAlert } from "@/hooks/useAlert"
import { toast } from "sonner"
import { AlertTriangle } from "lucide-react"

interface InactivateAssetModalProps {
  asset: Asset
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  bulkAssets?: Asset[] // Optional array for bulk operations
}

export function InactivateAssetModal({ asset, isOpen, onClose, onSuccess, bulkAssets }: InactivateAssetModalProps) {
  const alert = useAlert()
  const [reason, setReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const isBulkOperation = bulkAssets && bulkAssets.length > 0
  const assetsToInactivate = isBulkOperation ? bulkAssets : [asset]

  useEffect(() => {
    if (isOpen) {
      setReason("")
    }
  }, [isOpen])

  const handleInactivate = async () => {
    if (!reason.trim()) {
      alert.showError("Reason Required", `Please provide a reason for marking ${isBulkOperation ? "these assets" : "this asset"} inactive. This will be displayed on the asset details page.`)
      return
    }

    setIsProcessing(true)

    try {
      // Inactivate all assets with the same reason
      await Promise.all(
        assetsToInactivate.map(a => AssetService.inactivate(a.id, reason.trim()))
      )

      toast.success(
        isBulkOperation
          ? `${assetsToInactivate.length} assets marked as inactive`
          : "Asset marked as inactive"
      )
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error inactivating assets:", error)
      toast.error(`Failed to mark ${isBulkOperation ? "assets" : "asset"} as inactive`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isBulkOperation ? `Mark ${assetsToInactivate.length} Assets as Inactive` : "Mark Asset as Inactive"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBulkOperation
              ? "This will hide these assets from operational dropdowns but preserve all transaction history."
              : "This will hide the asset from operational dropdowns but preserve all transaction history."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            {isBulkOperation ? (
              <>
                <p className="text-sm font-medium">{assetsToInactivate.length} Assets Selected:</p>
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {assetsToInactivate.map((a, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground capitalize">
                      {a.type}: {a.registration || a.licenceNumber || "Unknown"}
                    </p>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">Asset:</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {asset.type}: {asset.registration || asset.licenceNumber || "Unknown"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">QR: {asset.ntCode}</p>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="inactive-reason">
              {isBulkOperation
                ? "Why are you marking these assets inactive? *"
                : "Why are you marking this asset inactive? *"}
            </Label>
            <Textarea
              id="inactive-reason"
              placeholder="e.g., License expired, Vehicle sold, Driver resigned, No longer in service..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {isBulkOperation
                ? "This reason will be applied to all selected assets"
                : "This reason will be displayed on the asset details page"}
            </p>
          </div>

          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-600" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium">Note:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Inactive assets won&apos;t appear in order allocation or weighbridge operations</li>
                  <li>All historical transactions will be preserved</li>
                  <li>You can reactivate {isBulkOperation ? "these assets" : "this asset"} later if needed</li>
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
