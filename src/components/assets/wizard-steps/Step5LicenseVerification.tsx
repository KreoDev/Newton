"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AssetInductionState } from "@/types/asset-types"
import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react"
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

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-4">Scan the same license/disk barcode again to verify. Will auto-advance if match.</p>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium">First Barcode (truncated):</p>
        <p className="text-sm text-muted-foreground font-mono truncate">{state.firstBarcodeData?.substring(0, 50)}...</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="barcode-verify-input">License/Disk Barcode (Second Scan) *</Label>
        <Input
          ref={inputRef}
          id="barcode-verify-input"
          type="text"
          placeholder="Scan 2: Scan the same barcode again"
          value={barcodeData}
          onKeyDown={handleKeyDown}
          className={error ? "border-destructive" : isMatch ? "border-green-500" : ""}
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
        {isMatch && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Barcodes match!</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Scan with desktop scanner - will auto-advance if match</p>
      </div>

      {isMatch && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">Verification Successful</p>
              <p className="text-xs text-muted-foreground">Barcodes match perfectly - advancing...</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-start pt-4">
        <Button variant="outline" onClick={handlePrevious}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
      </div>
    </div>
  )
}
