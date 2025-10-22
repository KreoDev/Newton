"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { AssetInductionState, ParsedAssetData } from "@/types/asset-types"
import {
  ArrowLeft,
  Barcode,
  CheckCircle2,
  Loader2,
  XCircle,
  AlertCircle,
  AlertTriangle,
} from "lucide-react"
import { AssetFieldMapper } from "@/lib/asset-field-mappings"
import { AssetService } from "@/services/asset.service"
import { useAlert } from "@/hooks/useAlert"

interface Step2Props {
  state: Partial<AssetInductionState>
  updateState: (updates: Partial<AssetInductionState>) => void
  onNext: () => void
  onPrev: () => void
}

type ScanPhase =
  | "first-scan-waiting"
  | "first-scan-processing"
  | "first-scan-success"
  | "second-scan-waiting"
  | "second-scan-verifying"
  | "type-detection"
  | "field-validation"
  | "complete"
  | "error"

/**
 * Normalize barcode by removing all non-alphanumeric characters except %
 * This handles scanner issues where extra characters might be added
 */
function normalize(str: string): string {
  return str.replace(/[^a-zA-Z0-9%]/g, "")
}

/**
 * Determine vehicle type from description
 */
function determineVehicleType(description: string): "truck" | "trailer" | null {
  if (!description) return null
  const desc = description.toLowerCase().replace(/\s+/g, "")

  if (desc.includes("trucktractor") || desc.includes("voorspanmotor")) {
    return "truck"
  }

  if (desc.includes("tipper") || desc.includes("wipbak")) {
    return "trailer"
  }

  return null
}

export function Step2LicenseScan({ state, updateState, onNext, onPrev }: Step2Props) {
  const alert = useAlert()
  const [phase, setPhase] = useState<ScanPhase>("first-scan-waiting")
  const [firstBarcodeData, setFirstBarcodeData] = useState(state.firstBarcodeData || "")
  const [secondBarcodeData, setSecondBarcodeData] = useState("")
  const [parsedData, setParsedData] = useState<any>(null)
  const [detectedType, setDetectedType] = useState<"truck" | "trailer" | null>(null)
  const [fields, setFields] = useState<any>({})
  const [expiryInfo, setExpiryInfo] = useState<any>(null)
  const [isExpired, setIsExpired] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const hasAutoAdvanced = useRef(false)

  // Handle scans coming from onscan.js
  const handleScannerScan = useCallback(
    (scannedValue: string) => {

      if (phase === "first-scan-waiting" || phase === "error") {
        // First scan
        setFirstBarcodeData(scannedValue)
        setSecondBarcodeData("")
        setParsedData(null)
        setError("")
        setPhase("first-scan-processing")
      } else if (phase === "second-scan-waiting") {
        // Second scan (verification)
        setSecondBarcodeData(scannedValue)
        setError("")
        setPhase("second-scan-verifying")
      }
    },
    [phase]
  )

  // Custom scanner handler - captures ALL keyboard input including spaces and slashes
  useEffect(() => {
    let scanBuffer = ""
    let scanTimeout: NodeJS.Timeout | null = null
    let lastKeyTime = 0

    const handleKeyDown = (event: KeyboardEvent) => {
      const currentTime = Date.now()
      const timeDiff = currentTime - lastKeyTime

      // Enter key = end of scan
      if (event.key === "Enter") {
        if (scanBuffer.length >= 6) {
          handleScannerScan(scanBuffer)
          scanBuffer = ""
        }
        if (scanTimeout) clearTimeout(scanTimeout)
        event.preventDefault()
        return
      }

      // Reset buffer if too much time passed (not part of a scan)
      if (timeDiff > 100 && scanBuffer.length > 0) {
        scanBuffer = ""
      }

      // Add character to buffer (capture EVERYTHING except control keys)
      if (event.key.length === 1) {
        scanBuffer += event.key
        lastKeyTime = currentTime

        // Set timeout to auto-complete scan if no Enter key
        if (scanTimeout) clearTimeout(scanTimeout)
        scanTimeout = setTimeout(() => {
          if (scanBuffer.length >= 6) {
            handleScannerScan(scanBuffer)
          }
          scanBuffer = ""
        }, 100)
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      if (scanTimeout) clearTimeout(scanTimeout)
    }
  }, [handleScannerScan])

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [])

  // Process first scan
  useEffect(() => {
    if (phase === "first-scan-processing" && firstBarcodeData) {
      processFirstScan()
    }
  }, [phase, firstBarcodeData])

  // Process second scan (verification)
  useEffect(() => {
    if (phase === "second-scan-verifying" && secondBarcodeData && firstBarcodeData) {
      verifySecondScan()
    }
  }, [phase, secondBarcodeData, firstBarcodeData])

  // Process type detection
  useEffect(() => {
    if (phase === "type-detection" && parsedData) {
      detectAssetType()
    }
  }, [phase, parsedData])

  // Process field validation
  useEffect(() => {
    if (phase === "field-validation" && detectedType && fields) {
      validateFields()
    }
  }, [phase, detectedType, fields])

  const processFirstScan = async () => {

    try {
      // Parse as vehicle disk
      const vehicleResult = await AssetFieldMapper.parseVehicleDisk(firstBarcodeData.trim())

      if ("error" in vehicleResult) {
        setError("Invalid vehicle license disk")
        setPhase("error")
        alert.showError(
          "Barcode Parsing Failed",
          "Could not parse barcode. Please ensure you're scanning a valid South African vehicle license disk for a truck or trailer.",
          () => {
            handleClear()
          }
        )
        return
      }

      // Check if vehicle type is acceptable (truck or trailer only)
      const vehicleType = (vehicleResult.description || "").toLowerCase()
      const acceptedTypes = [
        "truck",
        "trailer",
        "tipper",
        "wipbak",
        "truck tractor",
        "trucktractor",
        "voorspanmotor",
        "semi-trailer",
        "semi trailer",
        "heavy vehicle",
        "goods vehicle",
        "ldv",
        "mdv",
        "hdv",
        "light delivery vehicle",
        "medium delivery vehicle",
        "heavy delivery vehicle",
      ]

      const isAcceptedType = acceptedTypes.some((type) => vehicleType.includes(type))

      if (!isAcceptedType) {
        setError(`Invalid vehicle type: ${vehicleResult.description}`)
        setPhase("error")
        alert.showError(
          "Invalid Vehicle Type",
          `This barcode is for a ${vehicleResult.description || "passenger vehicle"}. Please scan a barcode for a truck or trailer only.`,
          () => {
            handleClear()
          }
        )
        return
      }

      // Check for duplicates
      const validation = AssetService.validateRegistration(vehicleResult.registration)

      if (!validation.isValid) {
        setError(validation.error || "Duplicate vehicle registration")
        setPhase("error")
        alert.showError(
          "Duplicate Vehicle",
          validation.error || "This vehicle registration is already registered in the system.",
          () => {
            handleClear()
          }
        )
        return
      }

      // Success - move to second scan
      setParsedData({ type: "vehicle", data: vehicleResult })
      setPhase("first-scan-success")
      setTimeout(() => {
        setPhase("second-scan-waiting")
      }, 300)
    } catch (error) {
      setError("Failed to validate barcode")
      setPhase("error")
      alert.showError("Validation Failed", "Failed to validate barcode. Please try again.", () => {
        handleClear()
      })
    }
  }

  const verifySecondScan = () => {

    const normalizedScan1 = normalize(firstBarcodeData)
    const normalizedScan2 = normalize(secondBarcodeData)


    if (normalizedScan1 === normalizedScan2) {
      updateState({
        firstBarcodeData: firstBarcodeData.trim(),
        secondBarcodeData: secondBarcodeData.trim(),
      })
      setPhase("type-detection")
    } else {
      setError("Barcode data does not match")
      setPhase("error")
      alert.showError("Barcode Mismatch", "The barcodes do not match. Please scan again.", () => {
        handleClear()
      })
    }
  }

  const detectAssetType = () => {

    const vehicleType = determineVehicleType(parsedData.data.description || "")

    if (!vehicleType) {
      const errorMsg = `Could not determine vehicle type. Description: "${parsedData.data.description}"`
      setError(errorMsg)
      setPhase("error")
      alert.showError(
        "Invalid Vehicle Type",
        "Could not determine if this is a truck or trailer. Please scan a valid Truck Tractor or Tipper license disk.",
        () => {
          handleClear()
        }
      )
      return
    }

    setDetectedType(vehicleType)

    // Populate fields for validation
    const vehicleFields = {
      registration: parsedData.data.registration || "",
      make: parsedData.data.make || "",
      model: parsedData.data.model || "",
      colour: parsedData.data.colour || "",
      licenceNo: parsedData.data.licenceNo || "",
      vehicleDiskNo: parsedData.data.vehicleDiskNo || "",
      expiryDate: parsedData.data.expiryDate || "",
      engineNo: parsedData.data.engineNo || "",
      vin: parsedData.data.vin || "",
      description: parsedData.data.description || "",
    }
    setFields(vehicleFields)
    setPhase("field-validation")
  }

  const validateFields = () => {

    if (!hasAutoAdvanced.current) {
      // Check expiry
      if (fields.expiryDate) {
        const info = AssetFieldMapper.getExpiryInfo(fields.expiryDate)
        setExpiryInfo(info)
        setIsExpired(info.status === "expired")

        if (info.status === "expired") {
          setError("Expired license disk")
          setPhase("error")
          return
        }
      }

      // All validation passed - auto-advance
      hasAutoAdvanced.current = true
      setPhase("complete")
      autoAdvance()
    }
  }

  const autoAdvance = () => {
    // Build final parsed data
    const updatedParsedData: ParsedAssetData = {
      type: detectedType!,
      ntCode: state.firstQRCode || "",
      vehicleInfo: {
        registration: fields.registration,
        make: fields.make,
        model: fields.model,
        colour: fields.colour,
        licenceNo: fields.licenceNo,
        vehicleDiskNo: fields.vehicleDiskNo,
        expiryDate: fields.expiryDate,
        engineNo: fields.engineNo,
        vin: fields.vin,
        description: fields.description,
      },
    }

    updateState({
      type: detectedType!,
      parsedData: updatedParsedData,
    })

    setTimeout(() => {
      onNext()
    }, 800)
  }

  const handleClear = () => {
    setFirstBarcodeData("")
    setSecondBarcodeData("")
    setParsedData(null)
    setDetectedType(null)
    setFields({})
    setExpiryInfo(null)
    setIsExpired(false)
    setError("")
    setPhase("first-scan-waiting")
    hasAutoAdvanced.current = false
    updateState({
      firstBarcodeData: undefined,
      secondBarcodeData: undefined,
      type: undefined,
      parsedData: undefined,
    })
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  // Render helpers
  const getVisualState = () => {
    switch (phase) {
      case "first-scan-waiting":
      case "second-scan-waiting":
        return "waiting"
      case "first-scan-processing":
      case "second-scan-verifying":
      case "type-detection":
      case "field-validation":
        return "processing"
      case "first-scan-success":
      case "complete":
        return "success"
      case "error":
        return "error"
      default:
        return "waiting"
    }
  }

  const getStatusMessage = () => {
    switch (phase) {
      case "first-scan-waiting":
        return "Scan vehicle license disk (truck or trailer)"
      case "first-scan-processing":
        return "Parsing and validating barcode..."
      case "first-scan-success":
        return "First scan successful - preparing verification..."
      case "second-scan-waiting":
        return "Scan the same barcode again to verify"
      case "second-scan-verifying":
        return "Verifying barcode match..."
      case "type-detection":
        return "Detecting vehicle type..."
      case "field-validation":
        return "Validating fields and expiry..."
      case "complete":
        return "Processing complete - proceeding to next step..."
      case "error":
        return error || "Error occurred - please scan again"
      default:
        return ""
    }
  }

  const visualState = getVisualState()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-4">
          {phase === "first-scan-waiting" || phase === "error"
            ? "Scan the vehicle license disk barcode (truck or trailer)."
            : phase === "second-scan-waiting"
              ? "Scan the same license disk barcode again to verify."
              : "Processing barcode data..."}
        </p>
      </div>

      {/* Hidden input that captures scanner events */}
      <Input
        ref={inputRef}
        id="barcode-input"
        type="text"
        value={phase.includes("second") ? secondBarcodeData : firstBarcodeData}
        className="sr-only"
        autoComplete="off"
        readOnly
        onPaste={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
        aria-label="Barcode Scanner Input"
      />

      {/* Show first barcode when waiting for second */}
      {phase === "second-scan-waiting" && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium">First Barcode (truncated):</p>
          <p className="text-sm text-muted-foreground font-mono truncate">
            {firstBarcodeData?.substring(0, 50)}...
          </p>
        </div>
      )}

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
              <p className="mt-4 text-sm font-medium text-green-700 dark:text-green-300">
                {phase === "first-scan-waiting" ? "Ready to Scan" : "Ready to Verify"}
              </p>
            </>
          )}

          {visualState === "processing" && (
            <>
              <Loader2 className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin" />
              <p className="mt-4 text-sm font-medium text-blue-700 dark:text-blue-300">
                {phase === "first-scan-processing"
                  ? "Parsing..."
                  : phase === "second-scan-verifying"
                    ? "Verifying..."
                    : phase === "type-detection"
                      ? "Detecting..."
                      : "Validating..."}
              </p>
            </>
          )}

          {visualState === "success" && (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
              <p className="mt-4 text-sm font-medium text-green-700 dark:text-green-300">
                {phase === "first-scan-success" ? "Scan Verified" : "Complete!"}
              </p>
            </>
          )}

          {visualState === "error" && (
            <>
              <XCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
              <p className="mt-4 text-sm font-medium text-red-700 dark:text-red-300">
                {isExpired ? "Expired" : "Scan Failed"}
              </p>
            </>
          )}
        </div>

        {/* Show parsed data preview */}
        {parsedData && phase === "first-scan-success" && (
          <div className="mt-4 p-3 bg-muted rounded-lg w-full max-w-md">
            <p className="text-xs font-medium text-muted-foreground mb-2">Vehicle License Disk</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registration:</span>
                <span className="font-mono font-medium">{parsedData.data.registration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Make/Model:</span>
                <span>
                  {parsedData.data.make} {parsedData.data.model}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Show detected type */}
        {detectedType && (phase === "type-detection" || phase === "field-validation" || phase === "complete") && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg w-full max-w-md">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{detectedType === "truck" ? "🚚" : "🚛"}</span>
              <div className="flex-1">
                <p className="text-xs font-medium text-green-700 dark:text-green-300">Vehicle Type Detected</p>
                <p className="text-sm font-semibold capitalize">
                  {detectedType === "truck" ? "Truck (Truck Tractor)" : "Trailer (Tipper)"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Show expiry warning if exists but not expired */}
        {expiryInfo && !isExpired && (expiryInfo.status === "expiring-critical" || expiryInfo.status === "expiring-soon") && (
          <div
            className={`mt-4 p-3 rounded-lg w-full max-w-md ${
              expiryInfo.status === "expiring-critical"
                ? "bg-orange-500/10 border border-orange-500/30"
                : "bg-yellow-500/10 border border-yellow-500/30"
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle
                className={`h-4 w-4 ${expiryInfo.status === "expiring-critical" ? "text-orange-600" : "text-yellow-600"}`}
              />
              <p className="text-xs font-medium">
                {expiryInfo.status === "expiring-critical" ? "Warning" : "Notice"}: Expires in {expiryInfo.daysUntilExpiry}{" "}
                days
              </p>
            </div>
          </div>
        )}

        {/* Show expired error */}
        {isExpired && (
          <div className="mt-4 p-4 bg-red-500/10 border-2 border-red-500 rounded-lg w-full max-w-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700 dark:text-red-300">EXPIRED - Process Blocked</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This license disk has expired. Cannot proceed with induction.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Notification will be sent to security personnel.
                </p>
                <Button variant="destructive" size="sm" className="mt-3" onClick={handleClear}>
                  Clear & Rescan
                </Button>
              </div>
            </div>
          </div>
        )}

        <p className="mt-6 text-xs text-center text-muted-foreground">{getStatusMessage()}</p>

        {/* Clear button for errors or waiting states */}
        {(phase === "error" || phase === "first-scan-waiting" || phase === "second-scan-waiting") &&
          (firstBarcodeData || secondBarcodeData) && (
            <Button variant="ghost" size="sm" type="button" className="mt-2" onClick={handleClear}>
              Clear & Rescan
            </Button>
          )}
      </div>

      <div className="flex justify-start pt-4">
        <Button variant="outline" onClick={onPrev} disabled={phase === "complete"}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
      </div>
    </div>
  )
}
