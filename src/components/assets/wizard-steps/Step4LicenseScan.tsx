"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AssetInductionState } from "@/types/asset-types"
import { ArrowLeft, AlertCircle, X } from "lucide-react"
import { AssetFieldMapper } from "@/lib/asset-field-mappings"
import { AssetService } from "@/services/asset.service"
import { useAlert } from "@/hooks/useAlert"
import onScan from "onscan.js"

interface Step4Props {
  state: Partial<AssetInductionState>
  updateState: (updates: Partial<AssetInductionState>) => void
  onNext: () => void
  onPrev: () => void
}

export function Step4LicenseScan({ state, updateState, onNext, onPrev }: Step4Props) {
  const alert = useAlert()
  const [barcodeData, setBarcodeData] = useState(state.firstBarcodeData || "")
  const [error, setError] = useState("")
  const [parsedData, setParsedData] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle scans coming from onscan.js
  const handleScannerScan = useCallback((scannedValue: string) => {
    console.log("Step4: New barcode scanned, resetting state")
    setBarcodeData(scannedValue)
    setError("")
    setParsedData(null)
    setIsProcessing(false) // Reset processing state for new scan
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
      // Try to parse as vehicle disk first
      const vehicleResult = AssetFieldMapper.parseVehicleDisk(barcodeData.trim())

      if (!("error" in vehicleResult)) {
        // Successfully parsed as vehicle - now validate it's a truck or trailer
        console.log("Step4: Parsed as vehicle, registration:", vehicleResult.registration, "description:", vehicleResult.description)

        // Check if vehicle type is acceptable (truck or trailer)
        const vehicleType = (vehicleResult.description || "").toLowerCase()
        const acceptedTypes = [
          "truck",
          "trailer",
          "semi-trailer",
          "semi trailer",
          "heavy vehicle",
          "goods vehicle",
          "ldv", // Light Delivery Vehicle
          "mdv", // Medium Delivery Vehicle
          "hdv", // Heavy Delivery Vehicle
          "light delivery vehicle",
          "medium delivery vehicle",
          "heavy delivery vehicle",
        ]

        const isAcceptedType = acceptedTypes.some(type => vehicleType.includes(type))

        if (!isAcceptedType) {
          console.log("Step4: Invalid vehicle type detected:", vehicleResult.description)
          setError(`Invalid vehicle type: ${vehicleResult.description}`)
          alert.showError(
            "Invalid Vehicle Type",
            `This barcode is for a ${vehicleResult.description || "passenger vehicle"}. Please scan a barcode for a truck, trailer, or driver's license only.`
          )
          setParsedData(null)
          setIsProcessing(false)
          return
        }

        // Check for duplicates (checks in-memory assets)
        console.log("Step4: Valid vehicle type, checking for duplicates")
        const validation = AssetService.validateRegistration(vehicleResult.registration)
        console.log("Step4: Validation result:", validation)

        if (!validation.isValid) {
          console.log("Step4: Duplicate vehicle detected, showing error")
          setError(validation.error || "Duplicate vehicle registration")
          alert.showError("Duplicate Vehicle", validation.error || "This vehicle registration is already registered in the system.")
          setParsedData(null)
          setIsProcessing(false)
          return
        }

        // Registration is valid and unique
        console.log("Step4: Vehicle is unique, proceeding")
        setParsedData({ type: "vehicle", data: vehicleResult })
        updateState({ firstBarcodeData: barcodeData.trim() })

        // Auto-advance after successful parse and validation
        setTimeout(() => {
          onNext()
        }, 300)
        return
      }

      // Try to parse as driver license/ID
      const driverResult = AssetFieldMapper.parseDriverLicense(barcodeData.trim())

      if (!("error" in driverResult)) {
        // Successfully parsed as driver - now check for duplicates (checks in-memory assets)
        console.log("Step4: Parsed as driver, ID number:", driverResult.person.idNumber)
        const validation = AssetService.validateIDNumber(driverResult.person.idNumber)
        console.log("Step4: Validation result:", validation)

        if (!validation.isValid) {
          console.log("Step4: Duplicate driver detected, showing error")
          setError(validation.error || "Duplicate driver ID number")
          alert.showError("Duplicate Driver", validation.error || "This driver ID number is already registered in the system.")
          setParsedData(null)
          setIsProcessing(false)
          return
        }

        // ID number is valid and unique
        console.log("Step4: Driver is unique, proceeding")
        setParsedData({ type: "driver", data: driverResult })
        updateState({ firstBarcodeData: barcodeData.trim() })

        // Auto-advance after successful parse and validation
        setTimeout(() => {
          onNext()
        }, 300)
        return
      }

      // Both parsers failed
      setError("Could not parse barcode. Please ensure you're scanning a valid South African vehicle license disk or driver license.")
      alert.showError("Barcode Parsing Failed", "Could not parse barcode. Please ensure you're scanning a valid South African vehicle license disk or driver license.")
      setParsedData(null)
      setIsProcessing(false)
    } catch (error) {
      console.error("Error parsing/validating barcode:", error)
      setError("Failed to validate barcode. Please try again.")
      alert.showError("Validation Failed", "Failed to validate barcode. Please try again.")
      setParsedData(null)
      setIsProcessing(false)
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (!parsedData && barcodeData) {
        handleParse()
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-4">Scan the vehicle license disk OR driver license barcode. Will auto-advance after parsing.</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="barcode-input" className={error ? "text-destructive" : ""}>
            License/Disk Barcode (First Scan) *
          </Label>
          {barcodeData && (
            <Button variant="ghost" size="sm" type="button" className="h-auto p-1 text-xs text-muted-foreground hover:text-destructive" onClick={handleClear}>
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <Input
          ref={inputRef}
          id="barcode-input"
          type="text"
          placeholder="Scan 1: Scan the barcode"
          value={barcodeData}
          onKeyDown={handleKeyDown}
          className={error ? "border-destructive" : parsedData ? "border-green-500" : ""}
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
        <p className="text-xs text-muted-foreground">Scan with desktop scanner - will auto-advance after parsing</p>
      </div>

      {isProcessing && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Parsing barcode data...</p>
        </div>
      )}

      {parsedData && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">Successfully Parsed {parsedData.type === "vehicle" ? "Vehicle License Disk" : "Driver License"}:</p>
          <div className="space-y-1 text-sm">
            {parsedData.type === "vehicle" ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Registration:</span>
                  <span className="font-mono">{parsedData.data.registration}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Make:</span>
                  <span>{parsedData.data.make}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Model:</span>
                  <span>{parsedData.data.model}</span>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">ID Number:</span>
                  <span className="font-mono">{parsedData.data.person.idNumber}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
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

      <div className="flex justify-start pt-4">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
      </div>
    </div>
  )
}
