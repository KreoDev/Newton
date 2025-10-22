"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Barcode, CheckCircle2, Loader2, XCircle } from "lucide-react"
import { AssetFieldMapper } from "@/lib/asset-field-mappings"
import { useAlert } from "@/hooks/useAlert"
import onScan from "onscan.js"

export type ParsedBarcodeData =
  | { type: "vehicle"; data: Awaited<ReturnType<typeof AssetFieldMapper.parseVehicleDisk>> }
  | { type: "driver"; data: Awaited<ReturnType<typeof AssetFieldMapper.parseDriverLicense>> }

interface BarcodeScannerProps {
  onScanSuccess: (barcodeData: string, parsedData: ParsedBarcodeData) => void
  onScanError?: (error: string) => void
  label?: string
  helpText?: string
  validateFn?: (barcodeData: string, parsedData: ParsedBarcodeData) => { isValid: boolean; error?: string }
  autoAdvance?: boolean
}

export function BarcodeScanner({
  onScanSuccess,
  onScanError,
  label = "Barcode",
  helpText = "Scan vehicle license disk or driver's license",
  validateFn,
  autoAdvance = true,
}: BarcodeScannerProps) {
  const alert = useAlert()
  const [barcodeData, setBarcodeData] = useState("")
  const [parsedData, setParsedData] = useState<ParsedBarcodeData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle scans coming from onscan.js
  const handleScannerScan = useCallback((scannedValue: string) => {
    console.log("BarcodeScanner: New barcode scanned, resetting state")
    setBarcodeData(scannedValue)
    setError("")
    setParsedData(null)
    setIsProcessing(false)
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

  // Auto-parse and advance when barcode is scanned
  useEffect(() => {
    if (barcodeData && !isProcessing && !error && !parsedData) {
      handleParse()
    }
  }, [barcodeData])

  const handleParse = async () => {
    if (!barcodeData.trim() || isProcessing) return

    setIsProcessing(true)
    setError("")

    try {
      const trimmedData = barcodeData.trim()

      // Check if this is hex data (driver's license - 720 bytes = 1440 hex chars)
      const isHexData = /^[0-9A-Fa-f]{1000,}$/.test(trimmedData) && trimmedData.length >= 1000

      if (isHexData) {
        console.log("BarcodeScanner: Detected hex data, attempting SADL decryption, length:", trimmedData.length)

        // Import scan service dynamically to access SADL decryption
        const { scan } = await import("@/services/scan.service")
        const sadlResult = await scan.decryptDriverLicense(trimmedData)

        if ("error" in sadlResult || !sadlResult.success) {
          const errorMsg = sadlResult.error || "Failed to decrypt driver's license"
          setError(errorMsg)
          alert.showError("Decryption Failed", errorMsg, () => {
            setBarcodeData("")
            setError("")
            setParsedData(null)
            setIsProcessing(false)
            setTimeout(() => inputRef.current?.focus(), 100)
          })
          setIsProcessing(false)
          if (onScanError) onScanError(errorMsg)
          return
        }

        // Parse the SADL decoded data
        const driverResult = AssetFieldMapper.parseSADLDriverLicense(sadlResult)

        if (!("error" in driverResult)) {
          console.log("BarcodeScanner: SADL driver parsed successfully, ID:", driverResult.person.idNumber)

          const parsed: ParsedBarcodeData = { type: "driver", data: driverResult }
          setParsedData(parsed)

          // Custom validation if provided
          if (validateFn) {
            const validation = validateFn(trimmedData, parsed)
            if (!validation.isValid) {
              setError(validation.error || "Validation failed")
              alert.showError("Validation Failed", validation.error || "Validation failed", () => {
                setBarcodeData("")
                setError("")
                setParsedData(null)
                setIsProcessing(false)
                setTimeout(() => inputRef.current?.focus(), 100)
              })
              setIsProcessing(false)
              if (onScanError) onScanError(validation.error || "Validation failed")
              return
            }
          }

          // Success
          setIsProcessing(false)
          if (autoAdvance) {
            setTimeout(() => onScanSuccess(trimmedData, parsed), 300)
          } else {
            onScanSuccess(trimmedData, parsed)
          }
          return
        } else {
          // SADL parsing failed
          const errorMsg = driverResult.error || "Failed to parse driver's license data"
          setError(errorMsg)
          alert.showError("Parsing Failed", errorMsg, () => {
            setBarcodeData("")
            setError("")
            setParsedData(null)
            setIsProcessing(false)
            setTimeout(() => inputRef.current?.focus(), 100)
          })
          setIsProcessing(false)
          if (onScanError) onScanError(errorMsg)
          return
        }
      }

      // Try to parse as vehicle disk first
      const vehicleResult = await AssetFieldMapper.parseVehicleDisk(trimmedData)

      if (!("error" in vehicleResult)) {
        console.log("BarcodeScanner: Parsed as vehicle, registration:", vehicleResult.registration)

        const parsed: ParsedBarcodeData = { type: "vehicle", data: vehicleResult }
        setParsedData(parsed)

        // Custom validation if provided
        if (validateFn) {
          const validation = validateFn(barcodeData.trim(), parsed)

          if (!validation.isValid) {
            setError(validation.error || "Validation failed")
            alert.showError("Validation Failed", validation.error || "Validation failed", () => {
              // Auto-clear when user clicks OK
              setBarcodeData("")
              setError("")
              setParsedData(null)
              setIsProcessing(false)
              setTimeout(() => {
                inputRef.current?.focus()
              }, 100)
            })
            setIsProcessing(false)
            if (onScanError) {
              onScanError(validation.error || "Validation failed")
            }
            return
          }
        }

        // Barcode is valid
        setIsProcessing(false)
        if (autoAdvance) {
          setTimeout(() => {
            onScanSuccess(barcodeData.trim(), parsed)
          }, 300)
        } else {
          onScanSuccess(barcodeData.trim(), parsed)
        }
        return
      }

      // Try to parse as driver license/ID
      const driverResult = await AssetFieldMapper.parseDriverLicense(barcodeData.trim())

      if (!("error" in driverResult)) {
        console.log("BarcodeScanner: Parsed as driver, ID number:", driverResult.person.idNumber)

        const parsed: ParsedBarcodeData = { type: "driver", data: driverResult }
        setParsedData(parsed)

        // Custom validation if provided
        if (validateFn) {
          const validation = validateFn(barcodeData.trim(), parsed)

          if (!validation.isValid) {
            setError(validation.error || "Validation failed")
            alert.showError("Validation Failed", validation.error || "Validation failed", () => {
              // Auto-clear when user clicks OK
              setBarcodeData("")
              setError("")
              setParsedData(null)
              setIsProcessing(false)
              setTimeout(() => {
                inputRef.current?.focus()
              }, 100)
            })
            setIsProcessing(false)
            if (onScanError) {
              onScanError(validation.error || "Validation failed")
            }
            return
          }
        }

        // Barcode is valid
        setIsProcessing(false)
        if (autoAdvance) {
          setTimeout(() => {
            onScanSuccess(barcodeData.trim(), parsed)
          }, 300)
        } else {
          onScanSuccess(barcodeData.trim(), parsed)
        }
        return
      }

      // Both parsers failed
      setError("Could not parse barcode. Please ensure you're scanning a valid South African vehicle license disk or driver license.")
      alert.showError("Barcode Parsing Failed", "Could not parse barcode. Please ensure you're scanning a valid South African vehicle license disk or driver license.", () => {
        setBarcodeData("")
        setError("")
        setParsedData(null)
        setIsProcessing(false)
        setTimeout(() => {
          inputRef.current?.focus()
        }, 100)
      })
      setParsedData(null)
      setIsProcessing(false)
      if (onScanError) {
        onScanError("Parsing failed")
      }
    } catch (error) {
      console.error("Error parsing/validating barcode:", error)
      setError("Failed to validate barcode. Please try again.")
      alert.showError("Validation Failed", "Failed to validate barcode. Please try again.", () => {
        setBarcodeData("")
        setError("")
        setParsedData(null)
        setIsProcessing(false)
        setTimeout(() => {
          inputRef.current?.focus()
        }, 100)
      })
      setParsedData(null)
      setIsProcessing(false)
      if (onScanError) {
        onScanError("Validation failed")
      }
    }
  }

  const handleClear = () => {
    setBarcodeData("")
    setError("")
    setParsedData(null)
    setIsProcessing(false)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  // Determine visual state
  const getVisualState = () => {
    if (error) return "error"
    if (isProcessing) return "processing"
    if (parsedData) return "success"
    return "waiting"
  }

  const visualState = getVisualState()

  return (
    <div className="space-y-4">
      {/* Hidden input that captures scanner events */}
      <Input
        ref={inputRef}
        type="text"
        value={barcodeData}
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
            ${visualState === "processing" ? "border-blue-500/50 bg-blue-500/10 animate-pulse" : ""}
            ${visualState === "success" ? "border-green-500 bg-green-500/20" : ""}
            ${visualState === "error" ? "border-red-500/50 bg-red-500/10" : ""}
          `}
        >
          {visualState === "waiting" && (
            <>
              <Barcode className="w-16 h-16 text-green-600 dark:text-green-400" />
              <p className="mt-4 text-sm font-medium text-green-700 dark:text-green-300">Ready to Scan</p>
            </>
          )}

          {visualState === "processing" && (
            <>
              <Loader2 className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin" />
              <p className="mt-4 text-sm font-medium text-blue-700 dark:text-blue-300">Parsing...</p>
            </>
          )}

          {visualState === "success" && (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
              <p className="mt-4 text-sm font-medium text-green-700 dark:text-green-300">
                {parsedData?.type === "vehicle" ? "Vehicle Scanned" : "Driver Scanned"}
              </p>
            </>
          )}

          {visualState === "error" && (
            <>
              <XCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
              <p className="mt-4 text-sm font-medium text-red-700 dark:text-red-300">Scan Failed</p>
            </>
          )}
        </div>

        {/* Show parsed data when captured */}
        {parsedData && (
          <div className="mt-4 p-3 bg-muted rounded-lg w-full max-w-md">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {parsedData.type === "vehicle" ? "Vehicle License Disk" : "Driver License"}
            </p>
            <div className="space-y-1 text-xs">
              {parsedData.type === "vehicle" && !("error" in parsedData.data) ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Registration:</span>
                    <span className="font-mono font-medium">{parsedData.data.registration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Make/Model:</span>
                    <span>{parsedData.data.make} {parsedData.data.model}</span>
                  </div>
                  {parsedData.data.expiryDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expiry:</span>
                      <span>{parsedData.data.expiryDate}</span>
                    </div>
                  )}
                </>
              ) : parsedData.type === "driver" && !("error" in parsedData.data) ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID Number:</span>
                    <span className="font-mono font-medium">{parsedData.data.person.idNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span>{parsedData.data.person.name} {parsedData.data.person.surname}</span>
                  </div>
                </>
              ) : null}
            </div>
            <Button variant="ghost" size="sm" type="button" className="h-6 px-2 text-xs mt-2 w-full" onClick={handleClear}>
              Clear & Rescan
            </Button>
          </div>
        )}

        <p className="mt-6 text-xs text-center text-muted-foreground">
          {visualState === "waiting" && helpText}
          {visualState === "processing" && "Parsing barcode data..."}
          {visualState === "success" && (autoAdvance ? "Proceeding to next step..." : "Barcode validated successfully")}
          {visualState === "error" && "Please scan a valid barcode"}
        </p>
      </div>
    </div>
  )
}
