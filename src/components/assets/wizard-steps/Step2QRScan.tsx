"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { AssetInductionState } from "@/types/asset-types"
import { ArrowLeft, QrCode, CheckCircle2, Loader2, XCircle } from "lucide-react"
import { AssetService } from "@/services/asset.service"
import { useAlert } from "@/hooks/useAlert"
import onScan from "onscan.js"

interface Step2Props {
  state: Partial<AssetInductionState>
  updateState: (updates: Partial<AssetInductionState>) => void
  onNext: () => void
  onPrev: () => void
}

export function Step2QRScan({ state, updateState, onNext, onPrev }: Step2Props) {
  const alert = useAlert()
  const [qrCode, setQrCode] = useState(state.firstQRCode || "")
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle scans coming from onscan.js
  const handleScannerScan = useCallback((scannedValue: string) => {
    console.log("Step2: New QR code scanned, resetting state")
    setQrCode(scannedValue)
    setError("")
    setIsValidating(false) // Reset validating state for new scan
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
      // Validate NT code format and uniqueness within the company (checks in-memory assets)
      console.log("Step2: Validating NT code:", qrCode.trim())
      const validation = AssetService.validateNTCode(qrCode.trim())
      console.log("Step2: Validation result:", validation)

      if (!validation.isValid) {
        console.log("Step2: Duplicate or invalid NT code detected, showing error")
        setError(validation.error || "Invalid QR code")
        alert.showError("Invalid QR Code", validation.error || "Invalid QR code", () => {
          // Auto-clear when user clicks OK on the alert
          console.log("Step2: User acknowledged error, clearing QR code for new scan")
          setQrCode("")
          setError("")
          setIsValidating(false)
          setTimeout(() => {
            inputRef.current?.focus()
          }, 100)
        })
        setIsValidating(false)
        return
      }

      // QR code is valid and unique, auto-advance
      console.log("Step2: NT code is valid and unique, proceeding")
      updateState({ firstQRCode: qrCode.trim() })
      setTimeout(() => {
        onNext()
      }, 300)
    } catch (error) {
      console.error("Step2: Error validating QR code:", error)
      setError("Failed to validate QR code. Please try again.")
      alert.showError("Validation Failed", "Failed to validate QR code. Please try again.", () => {
        // Auto-clear when user clicks OK on the alert
        console.log("Step2: User acknowledged error, clearing QR code for new scan")
        setQrCode("")
        setError("")
        setIsValidating(false)
        setTimeout(() => {
          inputRef.current?.focus()
        }, 100)
      })
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

  // Determine visual state
  const getVisualState = () => {
    if (error) return "error"
    if (isValidating) return "validating"
    if (qrCode && !error && !isValidating) return "success"
    return "waiting"
  }

  const visualState = getVisualState()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-4">Scan the asset&apos;s Newton QR code. The system will automatically validate and proceed.</p>
      </div>

      {/* Hidden input that captures scanner events */}
      <Input
        ref={inputRef}
        id="qr-code-input"
        type="text"
        value={qrCode}
        onKeyDown={handleKeyDown}
        className="sr-only"
        autoComplete="off"
        readOnly
        onPaste={e => e.preventDefault()}
        onDrop={e => e.preventDefault()}
        aria-label="QR Code Scanner Input"
      />

      {/* Visual placeholder */}
      <div className="flex flex-col items-center justify-center py-8">
        <div
          className={`
            flex flex-col items-center justify-center w-48 h-48 rounded-xl border-2 border-dashed
            transition-all duration-300
            ${visualState === "waiting" ? "border-green-500/50 bg-green-500/10" : ""}
            ${visualState === "validating" ? "border-blue-500/50 bg-blue-500/10 animate-pulse" : ""}
            ${visualState === "success" ? "border-green-500 bg-green-500/20" : ""}
            ${visualState === "error" ? "border-red-500/50 bg-red-500/10" : ""}
          `}
        >
          {visualState === "waiting" && (
            <>
              <QrCode className="w-16 h-16 text-green-600 dark:text-green-400" />
              <p className="mt-4 text-sm font-medium text-green-700 dark:text-green-300">Ready to Scan</p>
            </>
          )}

          {visualState === "validating" && (
            <>
              <Loader2 className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin" />
              <p className="mt-4 text-sm font-medium text-blue-700 dark:text-blue-300">Validating...</p>
            </>
          )}

          {visualState === "success" && (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
              <p className="mt-4 text-sm font-medium text-green-700 dark:text-green-300">QR Code Captured</p>
            </>
          )}

          {visualState === "error" && (
            <>
              <XCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
              <p className="mt-4 text-sm font-medium text-red-700 dark:text-red-300">Scan Failed</p>
            </>
          )}
        </div>

        {/* Show QR code value when captured */}
        {qrCode && (
          <div className="mt-4 flex items-center gap-2">
            <p className="text-xs text-muted-foreground font-mono">{qrCode}</p>
            <Button variant="ghost" size="sm" type="button" className="h-6 px-2 text-xs" onClick={handleClear}>
              Clear
            </Button>
          </div>
        )}

        <p className="mt-6 text-xs text-center text-muted-foreground">
          {visualState === "waiting" && "Position scanner and scan the Newton QR code"}
          {visualState === "validating" && "Checking QR code validity..."}
          {visualState === "success" && "Proceeding to next step..."}
          {visualState === "error" && "Please scan a valid QR code"}
        </p>
      </div>

      <div className="flex justify-start pt-4">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
      </div>
    </div>
  )
}
