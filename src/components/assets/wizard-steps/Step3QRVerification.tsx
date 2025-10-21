"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { AssetInductionState } from "@/types/asset-types"
import { ArrowLeft, QrCode, CheckCircle2, XCircle } from "lucide-react"
import { useAlert } from "@/hooks/useAlert"
import onScan from "onscan.js"

interface Step3Props {
  state: Partial<AssetInductionState>
  updateState: (updates: Partial<AssetInductionState>) => void
  onNext: () => void
  onPrev: () => void
  onError: () => void
}

/**
 * Normalize barcode/QR code by removing all non-alphanumeric characters except %
 * This handles scanner issues where extra characters might be added
 * Based on NewtonDemo: str.replace(/[^a-zA-Z0-9%]/g, "")
 */
function normalize(str: string): string {
  return str.replace(/[^a-zA-Z0-9%]/g, "")
}

export function Step3QRVerification({ state, updateState, onNext, onPrev, onError }: Step3Props) {
  const alert = useAlert()
  const [qrCode, setQrCode] = useState("")
  const [error, setError] = useState("")
  const [isMatch, setIsMatch] = useState(false)
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
      avgTimeByChar: 20,
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

  useEffect(() => {
    // Check if codes match and auto-advance
    if (qrCode && state.firstQRCode) {
      // Normalize both scans to handle scanner issues (extra spaces, newlines, etc)
      const normalizedScan1 = normalize(state.firstQRCode)
      const normalizedScan2 = normalize(qrCode)

      console.log("Step3: Comparing QR codes")
      console.log("  First (normalized):", normalizedScan1.substring(0, 30) + "...")
      console.log("  Second (normalized):", normalizedScan2.substring(0, 30) + "...")
      console.log("  Match:", normalizedScan1 === normalizedScan2)

      if (normalizedScan1 === normalizedScan2) {
        setIsMatch(true)
        setError("")
        // Auto-advance on match
        updateState({ secondQRCode: qrCode.trim() })
        setTimeout(() => {
          onNext()
        }, 300)
      } else {
        setIsMatch(false)
        setError("QR codes do not match")
        alert.showError("QR Code Mismatch", "The QR codes do not match. Please scan again.")

        // Clear BOTH scans and go back to Step 2
        setTimeout(() => {
          updateState({
            firstQRCode: undefined,
            secondQRCode: undefined
          })
          onError() // Return to Step 2
        }, 1500)
      }
    }
  }, [qrCode, state.firstQRCode])

  const handlePrevious = () => {
    // Clear both QR codes when going back
    updateState({
      firstQRCode: undefined,
      secondQRCode: undefined
    })
    onPrev()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
    }
  }

  // Determine visual state
  const getVisualState = () => {
    if (error) return "error"
    if (isMatch) return "success"
    return "waiting"
  }

  const visualState = getVisualState()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-4">Scan the same QR code again to verify. Will auto-advance if codes match.</p>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium">First QR Code (truncated):</p>
        <p className="text-sm text-muted-foreground font-mono">{state.firstQRCode?.substring(0, 30)}...</p>
      </div>

      {/* Hidden input that captures scanner events */}
      <Input
        ref={inputRef}
        id="qr-verify-input"
        type="text"
        value={qrCode}
        onKeyDown={handleKeyDown}
        className="sr-only"
        autoComplete="off"
        readOnly
        onPaste={e => e.preventDefault()}
        onDrop={e => e.preventDefault()}
        aria-label="QR Code Verification Input"
      />

      {/* Visual placeholder */}
      <div className="flex flex-col items-center justify-center py-8">
        <div
          className={`
            flex flex-col items-center justify-center w-48 h-48 rounded-xl border-2 border-dashed
            transition-all duration-300
            ${visualState === "waiting" ? "border-green-500/50 bg-green-500/10" : ""}
            ${visualState === "success" ? "border-green-500 bg-green-500/20" : ""}
            ${visualState === "error" ? "border-red-500/50 bg-red-500/10" : ""}
          `}
        >
          {visualState === "waiting" && (
            <>
              <QrCode className="w-16 h-16 text-green-600 dark:text-green-400" />
              <p className="mt-4 text-sm font-medium text-green-700 dark:text-green-300">Ready to Verify</p>
            </>
          )}

          {visualState === "success" && (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
              <p className="mt-4 text-sm font-medium text-green-700 dark:text-green-300">Codes Match!</p>
            </>
          )}

          {visualState === "error" && (
            <>
              <XCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
              <p className="mt-4 text-sm font-medium text-red-700 dark:text-red-300">Mismatch Detected</p>
            </>
          )}
        </div>

        {/* Show scanned QR value when captured */}
        {qrCode && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground font-mono text-center">{qrCode.substring(0, 30)}...</p>
          </div>
        )}

        <p className="mt-6 text-xs text-center text-muted-foreground">
          {visualState === "waiting" && "Scan the same QR code to verify"}
          {visualState === "success" && "Verification successful - proceeding..."}
          {visualState === "error" && "Codes don't match - returning to first scan..."}
        </p>
      </div>

      <div className="flex justify-start pt-4">
        <Button variant="outline" onClick={handlePrevious}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
      </div>
    </div>
  )
}
