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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Asset } from "@/types"
import { AssetService } from "@/services/asset.service"
import { toast } from "sonner"
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react"

interface DeleteAssetModalProps {
  asset: Asset
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onSwitchToInactivate?: () => void
}

export function DeleteAssetModal({ asset, isOpen, onClose, onSuccess, onSwitchToInactivate }: DeleteAssetModalProps) {
  const [step, setStep] = useState<"qr-verify" | "check-transactions" | "has-transactions" | "reason-input">("qr-verify")
  const [qrCode, setQrCode] = useState("")
  const [reason, setReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [transactionCount, setTransactionCount] = useState(0)

  useEffect(() => {
    if (isOpen) {
      setStep("qr-verify")
      setQrCode("")
      setReason("")
      setTransactionCount(0)
    }
  }, [isOpen])

  useEffect(() => {
    // Auto-focus QR input
    if (step === "qr-verify" && isOpen) {
      const input = document.getElementById("delete-qr-input")
      if (input) {
        setTimeout(() => input.focus(), 100)
      }
    }
  }, [step, isOpen])

  const handleQRVerify = async () => {
    if (!qrCode.trim()) {
      toast.error("Please scan the QR code")
      return
    }

    if (qrCode.trim() !== asset.ntCode) {
      toast.error("QR code does not match. Please try again.")
      setQrCode("")
      return
    }

    // QR verified, check transactions
    setStep("check-transactions")
    setIsProcessing(true)

    try {
      const { hasTransactions, count } = await AssetService.checkHasTransactions(asset.id)
      setTransactionCount(count)

      if (hasTransactions) {
        setStep("has-transactions")
      } else {
        setStep("reason-input")
      }
    } catch (error) {
      console.error("Error checking transactions:", error)
      toast.error("Failed to check transactions")
      onClose()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for deletion")
      return
    }

    setIsProcessing(true)

    try {
      await AssetService.delete(asset.id, reason.trim())
      toast.success("Asset deleted successfully")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error deleting asset:", error)
      toast.error("Failed to delete asset")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMarkInactive = () => {
    onClose()
    // Trigger parent to open InactivateAssetModal
    if (onSwitchToInactivate) {
      onSwitchToInactivate()
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {step === "qr-verify" && "Verify QR Code"}
            {step === "check-transactions" && "Checking Transactions..."}
            {step === "has-transactions" && "Cannot Delete - Asset Has Transactions"}
            {step === "reason-input" && "Confirm Deletion"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {step === "qr-verify" && "Scan the asset's QR code to confirm deletion"}
            {step === "check-transactions" && "Please wait while we check for transactions..."}
            {step === "has-transactions" && `This asset has ${transactionCount} transaction(s) and cannot be deleted.`}
            {step === "reason-input" && "This action cannot be undone. Please provide a reason for deleting this asset."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {step === "qr-verify" && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Asset to Delete:</p>
              <p className="text-sm text-muted-foreground capitalize">
                {asset.type}: {asset.registration || asset.registrationNumber || asset.licenseNumber || asset.licenceNumber}
              </p>
              <p className="text-xs text-muted-foreground mt-1">QR: {asset.ntCode}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-qr-input">Scan QR Code to Confirm *</Label>
              <Input
                id="delete-qr-input"
                type="text"
                placeholder="Scan QR code..."
                value={qrCode}
                onChange={e => setQrCode(e.target.value)}
                onKeyPress={e => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleQRVerify()
                  }
                }}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">Use your desktop scanner or type manually</p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleQRVerify} disabled={!qrCode.trim()}>
                Verify & Continue
              </Button>
            </div>
          </div>
        )}

        {step === "check-transactions" && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-muted-foreground">Checking for transactions...</p>
            </div>
          </div>
        )}

        {step === "has-transactions" && (
          <div className="space-y-4">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">Cannot Delete Asset</p>
                  <p className="text-xs text-muted-foreground">This asset has {transactionCount} transaction(s) and cannot be deleted.</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">Instead of deleting, you can mark this asset as inactive. This will hide it from operational dropdowns while preserving all transaction history.</p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="default" onClick={handleMarkInactive}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Mark as Inactive Instead
              </Button>
            </div>
          </div>
        )}

        {step === "reason-input" && (
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">No Transactions Found</p>
                  <p className="text-xs text-muted-foreground">This asset can be safely deleted</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-reason">Why are you deleting this asset? *</Label>
              <Textarea
                id="delete-reason"
                placeholder="e.g., Duplicate entry, Inducted by mistake, Sold vehicle..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">This reason will be logged in the audit trail</p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={!reason.trim() || isProcessing}>
                {isProcessing ? "Deleting..." : "Delete Asset"}
              </Button>
            </div>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
