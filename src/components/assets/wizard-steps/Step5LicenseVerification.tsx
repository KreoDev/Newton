"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { AssetInductionState } from "@/types/asset-types"
import { ArrowLeft, Barcode, CheckCircle2, XCircle } from "lucide-react"
import { useAlert } from "@/hooks/useAlert"
import onScan from "onscan.js"

interface Step5Props {
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

export function Step5LicenseVerification({ state, updateState, onNext, onPrev, onError }: Step5Props) {
  const alert = useAlert()
  const [barcodeData, setBarcodeData] = useState("")
  const [error, setError] = useState("")
  const [isMatch, setIsMatch] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle scans coming from onscan.js
  const handleScannerScan = useCallback((scannedValue: string) => {
    setBarcodeData(scannedValue)
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
    // Check if barcodes match and auto-advance
    if (barcodeData && state.firstBarcodeData) {
      // Normalize both scans to handle scanner issues (extra spaces, newlines, etc)
      const normalizedScan1 = normalize(state.firstBarcodeData)
      const normalizedScan2 = normalize(barcodeData)

      console.log("Step5: Comparing barcodes")
      console.log("  First (normalized):", normalizedScan1.substring(0, 50) + "...")
      console.log("  Second (normalized):", normalizedScan2.substring(0, 50) + "...")
      console.log("  Match:", normalizedScan1 === normalizedScan2)

      if (normalizedScan1 === normalizedScan2) {
        setIsMatch(true)
        setError("")
        // Auto-advance on match
        updateState({ secondBarcodeData: barcodeData.trim() })
        setTimeout(() => {
          onNext()
        }, 300)
      } else {
        setIsMatch(false)
        setError("Barcode data does not match")
        alert.showError("Barcode Mismatch", "The barcodes do not match. Please scan again.")

        // Clear BOTH scans and go back to Step 4
        setTimeout(() => {
          updateState({
            firstBarcodeData: undefined,
            secondBarcodeData: undefined
          })
          onError() // Return to Step 4
        }, 1500)
      }
    }
  }, [barcodeData, state.firstBarcodeData])

  const handlePrevious = () => {
    // Clear both barcodes when going back
    updateState({
      firstBarcodeData: undefined,
      secondBarcodeData: undefined
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
        <p className="text-muted-foreground mb-4">Scan the same license/disk barcode again to verify. Will auto-advance if match.</p>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium">First Barcode (truncated):</p>
        <p className="text-sm text-muted-foreground font-mono truncate">{state.firstBarcodeData?.substring(0, 50)}...</p>
      </div>

      {/* Hidden input that captures scanner events */}
      <Input
        ref={inputRef}
        id="barcode-verify-input"
        type="text"
        value={barcodeData}
        onKeyDown={handleKeyDown}
        className="sr-only"
        autoComplete="off"
        readOnly
        onPaste={e => e.preventDefault()}
        onDrop={e => e.preventDefault()}
        aria-label="Barcode Verification Input"
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
              <Barcode className="w-16 h-16 text-green-600 dark:text-green-400" />
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

        {/* Show scanned barcode value when captured */}
        {barcodeData && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground font-mono text-center">{barcodeData.substring(0, 50)}...</p>
          </div>
        )}

        <p className="mt-6 text-xs text-center text-muted-foreground">
          {visualState === "waiting" && "Scan the same barcode to verify"}
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
