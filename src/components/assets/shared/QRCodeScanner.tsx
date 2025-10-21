"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { QrCode, CheckCircle2, Loader2, XCircle } from "lucide-react"
import { useAlert } from "@/hooks/useAlert"
import onScan from "onscan.js"

interface QRCodeScannerProps {
  onScanSuccess: (qrCode: string) => void
  onScanError?: (error: string) => void
  label?: string
  helpText?: string
  validateFn?: (qrCode: string) => { isValid: boolean; error?: string }
  autoAdvance?: boolean
}

export function QRCodeScanner({
  onScanSuccess,
  onScanError,
  label = "QR Code",
  helpText = "Position scanner and scan the Newton QR code",
  validateFn,
  autoAdvance = true,
}: QRCodeScannerProps) {
  const alert = useAlert()
  const [qrCode, setQrCode] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle scans coming from onscan.js
  const handleScannerScan = useCallback((scannedValue: string) => {
    console.log("QRCodeScanner: New QR code scanned")
    setQrCode(scannedValue)
    setError("")
    setIsValidating(false)
  }, [])

  // Attach onScan listener
  useEffect(() => {
    onScan.attachTo(document, {
      onScan: handleScannerScan,
      suffixKeyCodes: [13],
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

  // Auto-validate and advance when QR code is scanned
  useEffect(() => {
    if (qrCode && !isValidating && !error) {
      handleValidate()
    }
  }, [qrCode])

  const handleValidate = async () => {
    if (!qrCode.trim() || isValidating) return

    setIsValidating(true)
    setError("")

    try {
      // Custom validation if provided
      if (validateFn) {
        const validation = validateFn(qrCode.trim())

        if (!validation.isValid) {
          setError(validation.error || "Invalid QR code")
          alert.showError("Invalid QR Code", validation.error || "Invalid QR code", () => {
            // Auto-clear when user clicks OK
            setQrCode("")
            setError("")
            setIsValidating(false)
            setTimeout(() => {
              inputRef.current?.focus()
            }, 100)
          })
          setIsValidating(false)
          if (onScanError) {
            onScanError(validation.error || "Invalid QR code")
          }
          return
        }
      }

      // QR code is valid
      setIsValidating(false)
      if (autoAdvance) {
        setTimeout(() => {
          onScanSuccess(qrCode.trim())
        }, 300)
      } else {
        onScanSuccess(qrCode.trim())
      }
    } catch (error) {
      console.error("QRCodeScanner: Error validating QR code:", error)
      setError("Failed to validate QR code. Please try again.")
      alert.showError("Validation Failed", "Failed to validate QR code. Please try again.", () => {
        setQrCode("")
        setError("")
        setIsValidating(false)
        setTimeout(() => {
          inputRef.current?.focus()
        }, 100)
      })
      setIsValidating(false)
      if (onScanError) {
        onScanError("Validation failed")
      }
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

  // Determine visual state
  const getVisualState = () => {
    if (error) return "error"
    if (isValidating) return "validating"
    if (qrCode && !error && !isValidating) return "success"
    return "waiting"
  }

  const visualState = getVisualState()

  return (
    <div className="space-y-4">
      {/* Hidden input that captures scanner events */}
      <Input
        ref={inputRef}
        type="text"
        value={qrCode}
        className="sr-only"
        autoComplete="off"
        readOnly
        onPaste={e => e.preventDefault()}
        onDrop={e => e.preventDefault()}
        aria-label={label}
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
          {visualState === "waiting" && helpText}
          {visualState === "validating" && "Checking QR code validity..."}
          {visualState === "success" && (autoAdvance ? "Proceeding to next step..." : "QR code validated successfully")}
          {visualState === "error" && "Please scan a valid QR code"}
        </p>
      </div>
    </div>
  )
}
