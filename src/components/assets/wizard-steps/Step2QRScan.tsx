"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AssetInductionState } from "@/types/asset-types"
import { ArrowLeft, AlertCircle, X } from "lucide-react"
import { AssetService } from "@/services/asset.service"
import { toast } from "sonner"
import onScan from "onscan.js"

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
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle scans coming from onscan.js
  const handleScannerScan = useCallback((scannedValue: string) => {
    setQrCode(scannedValue)
    setError("")
  }, [])

  // Attach onScan listener
  useEffect(() => {
    onScan.attachTo(document, {
      onScan: handleScannerScan,
      suffixKeyCodes: [13], // Enter key
      avgTimeByChar: 20, // Scanners are fast
      minLength: 6,
      reactToPaste: false,
    })

    return () => {
      try {
        onScan.detachFrom(document)
      } catch {}
    }
  }, [handleScannerScan])

  useEffect(() => {
    // Auto-focus the input when component mounts
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [])

  // Auto-advance when QR code is scanned
  useEffect(() => {
    if (qrCode && !isValidating && !error) {
      handleValidateAndNext()
    }
  }, [qrCode])

  const handleValidateAndNext = async () => {
    if (!qrCode.trim() || isValidating) return

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

      // QR code is valid and unique, auto-advance
      updateState({ firstQRCode: qrCode.trim() })
      setTimeout(() => {
        onNext()
      }, 300)
    } catch (error) {
      console.error("Error validating QR code:", error)
      setError("Failed to validate QR code. Please try again.")
      toast.error("Validation failed")
      setIsValidating(false)
    }
  }

  const handleClear = () => {
    setQrCode("")
    setError("")
    setIsValidating(false)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Desktop scanner typically sends Enter after scanning
    if (e.key === "Enter") {
      e.preventDefault()
      handleValidateAndNext()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-4">Scan the asset&apos;s Newton QR code. The system will automatically validate and proceed.</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="qr-code-input" className={error ? "text-destructive" : ""}>
            QR Code (First Scan) *
          </Label>
          {qrCode && (
            <Button variant="ghost" size="sm" type="button" className="h-auto p-1 text-xs text-muted-foreground hover:text-destructive" onClick={handleClear}>
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <Input
          ref={inputRef}
          id="qr-code-input"
          type="text"
          placeholder="Scan 1: Scan the QR code"
          value={qrCode}
          onKeyDown={handleKeyDown}
          className={error ? "border-destructive" : ""}
          autoComplete="off"
          readOnly
          onPaste={e => e.preventDefault()}
          onDrop={e => e.preventDefault()}
        />
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Scan with desktop scanner - will auto-advance after validation</p>
      </div>

      {qrCode && !error && !isValidating && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-sm font-medium text-green-700 dark:text-green-300">QR Code Captured:</p>
          <p className="text-sm text-muted-foreground font-mono">{qrCode}</p>
        </div>
      )}

      {isValidating && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Validating QR code...</p>
        </div>
      )}

      <div className="flex justify-start pt-4">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
      </div>
    </div>
  )
}
