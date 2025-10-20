"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AssetInductionState } from "@/types/asset-types"
import { ArrowRight, ArrowLeft, AlertCircle } from "lucide-react"
import { AssetService } from "@/services/asset.service"
import { toast } from "sonner"

interface Step2Props {
  state: Partial<AssetInductionState>
  updateState: (updates: Partial<AssetInductionState>) => void
  onNext: () => void
  onPrev: () => void
}

export function Step2QRScan({ state, updateState, onNext, onPrev }: Step2Props) {
  const [qrCode, setQrCode] = useState(state.firstQRCode || "")
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    // Auto-focus the input when component mounts
    const input = document.getElementById("qr-code-input")
    if (input) {
      input.focus()
    }
  }, [])

  const handleValidateAndNext = async () => {
    if (!qrCode.trim()) {
      setError("QR code is required")
      return
    }

    setIsValidating(true)
    setError("")

    try {
      // Validate NT code format and uniqueness
      const validation = await AssetService.validateNTCode(qrCode.trim())

      if (!validation.isValid) {
        setError(validation.error || "Invalid QR code")
        toast.error(validation.error || "Invalid QR code")
        setIsValidating(false)
        return
      }

      // QR code is valid and unique, proceed
      updateState({ firstQRCode: qrCode.trim() })
      onNext()
    } catch (error) {
      console.error("Error validating QR code:", error)
      setError("Failed to validate QR code. Please try again.")
      toast.error("Validation failed")
    } finally {
      setIsValidating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Desktop scanner typically sends Enter after scanning
    if (e.key === "Enter") {
      e.preventDefault()
      handleValidateAndNext()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-4">Use your desktop scanner to scan the asset&apos;s QR code. The scanner will automatically paste the code into the field below.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="qr-code-input">QR Code *</Label>
        <Input
          id="qr-code-input"
          type="text"
          placeholder="Scan QR code or type manually..."
          value={qrCode}
          onChange={e => {
            setQrCode(e.target.value)
            setError("")
          }}
          onKeyPress={handleKeyPress}
          className={error ? "border-red-500" : ""}
          autoComplete="off"
        />
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Tip: Click the field and scan with your desktop scanner. Press Enter or click Next when done.</p>
      </div>

      {qrCode && !error && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-sm font-medium text-green-700 dark:text-green-300">QR Code Captured:</p>
          <p className="text-sm text-muted-foreground font-mono">{qrCode}</p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={handleValidateAndNext} disabled={!qrCode.trim() || isValidating}>
          {isValidating ? "Validating..." : "Next"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
