"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { AssetInductionState } from "@/types/asset-types"
import { ArrowLeft, QrCode, CheckCircle2, Loader2, XCircle } from "lucide-react"
import { AssetService } from "@/services/asset.service"
import { useAlert } from "@/hooks/useAlert"
import onScan from "onscan.js"

interface Step1Props {
  state: Partial<AssetInductionState>
  updateState: (updates: Partial<AssetInductionState>) => void
  onNext: () => void
  onPrev: () => void
}

/**
 * Normalize barcode/QR code by removing all non-alphanumeric characters except %
 * This handles scanner issues where extra characters might be added
 */
function normalize(str: string): string {
  return str.replace(/[^a-zA-Z0-9%]/g, "")
}

export function Step1QRScan({ state, updateState, onNext, onPrev }: Step1Props) {
  const alert = useAlert()
  const [firstScan, setFirstScan] = useState(state.firstQRCode || "")
  const [secondScan, setSecondScan] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState("")
  const [phase, setPhase] = useState<"first" | "second">(state.firstQRCode ? "second" : "first")
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle scans coming from onscan.js
  const handleScannerScan = useCallback((scannedValue: string) => {
    console.log(`Step1: Scan received in ${phase} phase`)
    if (phase === "first") {
      setFirstScan(scannedValue)
      setError("")
      setIsValidating(false)
    } else {
      setSecondScan(scannedValue)
      setError("")
    }
  }, [phase])

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

  // Auto-focus input
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [phase])

  // Handle first scan validation
  useEffect(() => {
    if (phase === "first" && firstScan && !isValidating && !error) {
      validateFirstScan()
    }
  }, [firstScan, phase])

  // Handle second scan verification
  useEffect(() => {
    if (phase === "second" && secondScan && firstScan) {
      verifySecondScan()
    }
  }, [secondScan, phase, firstScan])

  const validateFirstScan = async () => {
    if (!firstScan.trim() || isValidating) return

    setIsValidating(true)
    setError("")

    try {
      console.log("Step1: Validating first QR code:", firstScan.trim())
      const validation = AssetService.validateNTCode(firstScan.trim())
      console.log("Step1: Validation result:", validation)

      if (!validation.isValid) {
        console.log("Step1: Invalid NT code")
        setError(validation.error || "Invalid QR code")
        alert.showError("Invalid QR Code", validation.error || "Invalid QR code", () => {
          setFirstScan("")
          setError("")
          setIsValidating(false)
          setTimeout(() => inputRef.current?.focus(), 100)
        })
        setIsValidating(false)
        return
      }

      // First scan valid - move to second scan
      console.log("Step1: First scan valid, moving to verification phase")
      updateState({ firstQRCode: firstScan.trim() })
      setPhase("second")
      setIsValidating(false)
    } catch (error) {
      console.error("Step1: Error validating QR code:", error)
      setError("Failed to validate QR code")
      alert.showError("Validation Failed", "Failed to validate QR code. Please try again.", () => {
        setFirstScan("")
        setError("")
        setIsValidating(false)
        setTimeout(() => inputRef.current?.focus(), 100)
      })
      setIsValidating(false)
    }
  }

  const verifySecondScan = () => {
    setIsVerifying(true)

    // Normalize both scans
    const normalizedFirst = normalize(firstScan)
    const normalizedSecond = normalize(secondScan)

    console.log("Step1: Verifying QR codes")
    console.log("  First (normalized):", normalizedFirst.substring(0, 30) + "...")
    console.log("  Second (normalized):", normalizedSecond.substring(0, 30) + "...")
    console.log("  Match:", normalizedFirst === normalizedSecond)

    if (normalizedFirst === normalizedSecond) {
      // Match - proceed to next step
      console.log("Step1: QR codes match, advancing")
      updateState({ secondQRCode: secondScan.trim() })
      setTimeout(() => {
        onNext()
      }, 300)
    } else {
      // Mismatch - reset and start over
      console.log("Step1: QR codes mismatch")
      setError("QR codes do not match")
      alert.showError("QR Code Mismatch", "The QR codes do not match. Please scan again.")

      setTimeout(() => {
        updateState({
          firstQRCode: undefined,
          secondQRCode: undefined
        })
        setFirstScan("")
        setSecondScan("")
        setPhase("first")
        setIsVerifying(false)
        setError("")
        setTimeout(() => inputRef.current?.focus(), 100)
      }, 1500)
    }
  }

  const handleClear = () => {
    setFirstScan("")
    setSecondScan("")
    setPhase("first")
    setError("")
    setIsValidating(false)
    setIsVerifying(false)
    updateState({
      firstQRCode: undefined,
      secondQRCode: undefined
    })
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // Determine visual state
  const getVisualState = () => {
    if (error) return "error"
    if (isValidating) return "validating"
    if (isVerifying) return "verifying"
    if (phase === "second" && !secondScan) return "waiting-verify"
    if (phase === "first" && firstScan) return "success-first"
    return "waiting"
  }

  const visualState = getVisualState()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-4">
          {phase === "first"
            ? "Scan the asset's Newton QR code. The system will automatically validate and proceed."
            : "Scan the same QR code again to verify."
          }
        </p>
      </div>

      {/* Show first scan value when in second phase */}
      {phase === "second" && firstScan && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium">First QR Code (truncated):</p>
          <p className="text-sm text-muted-foreground font-mono">{firstScan.substring(0, 30)}...</p>
        </div>
      )}

      {/* Hidden input that captures scanner events */}
      <Input
        ref={inputRef}
        id="qr-code-input"
        type="text"
        value={phase === "first" ? firstScan : secondScan}
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
            ${visualState === "success-first" ? "border-green-500 bg-green-500/20" : ""}
            ${visualState === "waiting-verify" ? "border-green-500/50 bg-green-500/10" : ""}
            ${visualState === "verifying" ? "border-green-500 bg-green-500/20" : ""}
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

          {visualState === "success-first" && (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
              <p className="mt-4 text-sm font-medium text-green-700 dark:text-green-300">First Scan Complete</p>
            </>
          )}

          {visualState === "waiting-verify" && (
            <>
              <QrCode className="w-16 h-16 text-green-600 dark:text-green-400" />
              <p className="mt-4 text-sm font-medium text-green-700 dark:text-green-300">Ready to Verify</p>
            </>
          )}

          {visualState === "verifying" && (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
              <p className="mt-4 text-sm font-medium text-green-700 dark:text-green-300">Codes Match!</p>
            </>
          )}

          {visualState === "error" && (
            <>
              <XCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
              <p className="mt-4 text-sm font-medium text-red-700 dark:text-red-300">Scan Failed</p>
            </>
          )}
        </div>

        {/* Show current scan value */}
        {((phase === "first" && firstScan) || (phase === "second" && secondScan)) && (
          <div className="mt-4 flex items-center gap-2">
            <p className="text-xs text-muted-foreground font-mono">
              {phase === "first" ? firstScan.substring(0, 30) : secondScan.substring(0, 30)}...
            </p>
            <Button variant="ghost" size="sm" type="button" className="h-6 px-2 text-xs" onClick={handleClear}>
              Clear
            </Button>
          </div>
        )}

        <p className="mt-6 text-xs text-center text-muted-foreground">
          {visualState === "waiting" && "Position scanner and scan the Newton QR code"}
          {visualState === "validating" && "Checking QR code validity..."}
          {visualState === "success-first" && "Moving to verification..."}
          {visualState === "waiting-verify" && "Scan the same QR code to verify"}
          {visualState === "verifying" && "Verification successful - proceeding..."}
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
