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
import onScan from "onscan.js"

interface Step2Props {
  state: Partial<AssetInductionState>
  updateState: (updates: Partial<AssetInductionState>) => void
  onNext: () => void
  onPrev: () => void
  testDriverHex?: string // Optional test driver hex string for testing
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
 * Normalize barcode/QR code by removing all non-alphanumeric characters except %
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

export function Step2LicenseScan({ state, updateState, onNext, onPrev, testDriverHex }: Step2Props) {
  const alert = useAlert()
  const [phase, setPhase] = useState<ScanPhase>("first-scan-waiting")
  const [firstBarcodeData, setFirstBarcodeData] = useState(state.firstBarcodeData || "")
  const [secondBarcodeData, setSecondBarcodeData] = useState("")
  const [parsedData, setParsedData] = useState<any>(null)
  const [detectedType, setDetectedType] = useState<"truck" | "trailer" | "driver" | null>(null)
  const [fields, setFields] = useState<any>({})
  const [expiryInfo, setExpiryInfo] = useState<any>(null)
  const [isExpired, setIsExpired] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const hasAutoAdvanced = useRef(false)

  // Handle scans coming from onscan.js
  const handleScannerScan = useCallback(
    (scannedValue: string) => {
      console.log("Step2: Barcode scanned:", scannedValue.substring(0, 50))

      if (phase === "first-scan-waiting" || phase === "error") {
        // First scan
        console.log("Step2: Processing first scan")
        setFirstBarcodeData(scannedValue)
        setSecondBarcodeData("")
        setParsedData(null)
        setError("")
        setPhase("first-scan-processing")
      } else if (phase === "second-scan-waiting") {
        // Second scan (verification)
        console.log("Step2: Processing second scan for verification")
        setSecondBarcodeData(scannedValue)
        setError("")
        setPhase("second-scan-verifying")
      }
    },
    [phase]
  )

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
    console.log("Step2: Processing first scan - parsing and validating")

    try {
      // Try to parse as vehicle disk first
      const vehicleResult = await AssetFieldMapper.parseVehicleDisk(firstBarcodeData.trim())

      if (!("error" in vehicleResult)) {
        console.log(
          "Step2: Parsed as vehicle, registration:",
          vehicleResult.registration,
          "description:",
          vehicleResult.description
        )

        // Check if vehicle type is acceptable
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
          console.log("Step2: Invalid vehicle type detected:", vehicleResult.description)
          setError(`Invalid vehicle type: ${vehicleResult.description}`)
          setPhase("error")
          alert.showError(
            "Invalid Vehicle Type",
            `This barcode is for a ${vehicleResult.description || "passenger vehicle"}. Please scan a barcode for a truck, trailer, or driver's license only.`,
            () => {
              handleClear()
            }
          )
          return
        }

        // Check for duplicates
        console.log("Step2: Valid vehicle type, checking for duplicates")
        const validation = AssetService.validateRegistration(vehicleResult.registration)

        if (!validation.isValid) {
          console.log("Step2: Duplicate vehicle detected")
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
        console.log("Step2: First scan valid, proceeding to verification")
        setParsedData({ type: "vehicle", data: vehicleResult })
        setPhase("first-scan-success")
        setTimeout(() => {
          setPhase("second-scan-waiting")
        }, 300)
        return
      }

      // Try to parse as driver license/ID
      const driverResult = await AssetFieldMapper.parseDriverLicense(firstBarcodeData.trim())

      if (!("error" in driverResult)) {
        console.log("Step2: Parsed as driver, ID number:", driverResult.person.idNumber)

        // Check for duplicates
        const validation = AssetService.validateIDNumber(driverResult.person.idNumber)

        if (!validation.isValid) {
          console.log("Step2: Duplicate driver detected")
          setError(validation.error || "Duplicate driver ID number")
          setPhase("error")
          alert.showError(
            "Duplicate Driver",
            validation.error || "This driver ID number is already registered in the system.",
            () => {
              handleClear()
            }
          )
          return
        }

        // Success - move to second scan
        console.log("Step2: First scan valid, proceeding to verification")
        setParsedData({ type: "driver", data: driverResult })
        setPhase("first-scan-success")
        setTimeout(() => {
          setPhase("second-scan-waiting")
        }, 300)
        return
      }

      // Both parsers failed
      setError("Could not parse barcode")
      setPhase("error")
      alert.showError(
        "Barcode Parsing Failed",
        "Could not parse barcode. Please ensure you're scanning a valid South African vehicle license disk or driver license.",
        () => {
          handleClear()
        }
      )
    } catch (error) {
      console.error("Error parsing/validating barcode:", error)
      setError("Failed to validate barcode")
      setPhase("error")
      alert.showError("Validation Failed", "Failed to validate barcode. Please try again.", () => {
        handleClear()
      })
    }
  }

  const verifySecondScan = () => {
    console.log("Step2: Verifying second scan matches first")

    const normalizedScan1 = normalize(firstBarcodeData)
    const normalizedScan2 = normalize(secondBarcodeData)

    console.log("  First (normalized):", normalizedScan1.substring(0, 50) + "...")
    console.log("  Second (normalized):", normalizedScan2.substring(0, 50) + "...")
    console.log("  Match:", normalizedScan1 === normalizedScan2)

    if (normalizedScan1 === normalizedScan2) {
      console.log("Step2: Verification successful, proceeding to type detection")
      updateState({
        firstBarcodeData: firstBarcodeData.trim(),
        secondBarcodeData: secondBarcodeData.trim(),
      })
      setPhase("type-detection")
    } else {
      console.log("Step2: Verification failed - barcodes don't match")
      setError("Barcode data does not match")
      setPhase("error")
      alert.showError("Barcode Mismatch", "The barcodes do not match. Please scan again.", () => {
        handleClear()
      })
    }
  }

  const detectAssetType = () => {
    console.log("Step2: Detecting asset type from parsed data")

    if (parsedData.type === "vehicle") {
      const vehicleType = determineVehicleType(parsedData.data.description || "")

      if (vehicleType) {
        console.log("Step2: Detected vehicle type:", vehicleType)
        setDetectedType(vehicleType)

        // Populate fields for validation
        const vehicleFields = {
          registration: parsedData.data.registration || "",
          make: parsedData.data.make || "",
          model: parsedData.data.model || "",
          colour: parsedData.data.colour || "",
          vehicleDiskNo: parsedData.data.vehicleDiskNo || "",
          expiryDate: parsedData.data.expiryDate || "",
          engineNo: parsedData.data.engineNo || "",
          vin: parsedData.data.vin || "",
          description: parsedData.data.description || "",
        }
        setFields(vehicleFields)
        setPhase("field-validation")
      } else {
        const errorMsg = `Could not determine vehicle type. Description: "${parsedData.data.description}"`
        console.error("Step2:", errorMsg)
        setError(errorMsg)
        setPhase("error")
        alert.showError(
          "Invalid Vehicle Type",
          "Could not determine if this is a truck or trailer. Please scan a valid Truck Tractor or Tipper license disk.",
          () => {
            handleClear()
          }
        )
      }
    } else {
      // Driver
      console.log("Step2: Detected as driver")
      setDetectedType("driver")

      // Populate fields for validation
      const driverFields = {
        idNumber: parsedData.data.person?.idNumber || "",
        name: parsedData.data.person?.name || "",
        surname: parsedData.data.person?.surname || "",
        initials: parsedData.data.person?.initials || "",
        gender: parsedData.data.person?.gender || "",
        birthDate: parsedData.data.person?.birthDate || "",
        licenceNumber: parsedData.data.licence?.licenceNumber || "",
        licenceType: parsedData.data.licence?.licenceType || "",
        expiryDate: parsedData.data.licence?.expiryDate || "",
        issueDate: parsedData.data.licence?.issueDate || "",
        driverRestrictions: parsedData.data.licence?.driverRestrictions || "",
        ntCode: parsedData.data.licence?.ntCode || "",
      }
      setFields(driverFields)
      setPhase("field-validation")
    }
  }

  const validateFields = () => {
    console.log("Step2: Validating fields and checking expiry")

    if (!hasAutoAdvanced.current) {
      // Check expiry
      if (fields.expiryDate) {
        const info = AssetFieldMapper.getExpiryInfo(fields.expiryDate)
        setExpiryInfo(info)
        setIsExpired(info.status === "expired")

        if (info.status === "expired") {
          console.log("Step2: License/disk is expired, blocking advancement")
          setError("Expired license/disk")
          setPhase("error")
          return
        }
      }

      // All validation passed - auto-advance
      console.log("Step2: All validation passed, auto-advancing to next step")
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
      ...(detectedType === "driver"
        ? {
            personInfo: {
              idNumber: fields.idNumber,
              name: fields.name,
              surname: fields.surname,
              initials: fields.initials,
              gender: fields.gender,
              birthDate: fields.birthDate,
            },
            licenceInfo: {
              licenceNumber: fields.licenceNumber,
              licenceType: fields.licenceType,
              expiryDate: fields.expiryDate,
              issueDate: fields.issueDate,
              driverRestrictions: fields.driverRestrictions,
              ntCode: fields.ntCode,
            },
          }
        : {
            vehicleInfo: {
              registration: fields.registration,
              make: fields.make,
              model: fields.model,
              colour: fields.colour,
              vehicleDiskNo: fields.vehicleDiskNo,
              expiryDate: fields.expiryDate,
              engineNo: fields.engineNo,
              vin: fields.vin,
              description: fields.description,
            },
          }),
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
    console.log("Step2: Clearing all data for new scan")
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
        return "Scan vehicle license disk or driver's license"
      case "first-scan-processing":
        return "Parsing and validating barcode..."
      case "first-scan-success":
        return "First scan successful - preparing verification..."
      case "second-scan-waiting":
        return "Scan the same barcode again to verify"
      case "second-scan-verifying":
        return "Verifying barcode match..."
      case "type-detection":
        return "Detecting asset type..."
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

  // Test button handler - simulates scanning testDriver hex
  const handleTestDriverScan = () => {
    if (!testDriverHex) {
      alert.showError("Test Data Missing", "No test driver hex data provided")
      return
    }

    console.log("Step2: Test driver button clicked - simulating hex scan")

    if (phase === "first-scan-waiting" || phase === "error") {
      // Simulate first scan
      setFirstBarcodeData(testDriverHex)
      setSecondBarcodeData("")
      setParsedData(null)
      setError("")
      setPhase("first-scan-processing")
    } else if (phase === "second-scan-waiting") {
      // Simulate second scan (verification)
      setSecondBarcodeData(testDriverHex)
      setError("")
      setPhase("second-scan-verifying")
    }
  }

  const visualState = getVisualState()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-4">
          {phase === "first-scan-waiting" || phase === "error"
            ? "Scan the vehicle license disk OR driver license barcode."
            : phase === "second-scan-waiting"
              ? "Scan the same license/disk barcode again to verify."
              : "Processing barcode data..."}
        </p>

        {/* Test button - only show when testDriverHex is provided and waiting for scan */}
        {testDriverHex && (phase === "first-scan-waiting" || phase === "second-scan-waiting" || phase === "error") && (
          <Button type="button" variant="outline" size="sm" onClick={handleTestDriverScan} className="mt-2">
            Test with Sample Driver License
          </Button>
        )}
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
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {parsedData.type === "vehicle" ? "Vehicle License Disk" : "Driver License"}
            </p>
            <div className="space-y-1 text-xs">
              {parsedData.type === "vehicle" ? (
                <>
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
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID Number:</span>
                    <span className="font-mono font-medium">{parsedData.data.person.idNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span>
                      {parsedData.data.person.name} {parsedData.data.person.surname}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Show detected type */}
        {detectedType && (phase === "type-detection" || phase === "field-validation" || phase === "complete") && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg w-full max-w-md">
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {detectedType === "truck" ? "🚚" : detectedType === "trailer" ? "🚛" : "👤"}
              </span>
              <div className="flex-1">
                <p className="text-xs font-medium text-green-700 dark:text-green-300">Asset Type Detected</p>
                <p className="text-sm font-semibold capitalize">
                  {detectedType === "truck"
                    ? "Truck (Truck Tractor)"
                    : detectedType === "trailer"
                      ? "Trailer (Tipper)"
                      : "Driver"}
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
                  This license/disk has expired. Cannot proceed with induction.
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
