"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import type { AssetInductionState, ParsedAssetData } from "@/types/asset-types"
import { ArrowLeft, CheckCircle } from "lucide-react"
import { AssetFieldMapper } from "@/lib/asset-field-mappings"
import { useAlert } from "@/hooks/useAlert"
import { toast } from "sonner"

interface Step6Props {
  state: Partial<AssetInductionState>
  updateState: (updates: Partial<AssetInductionState>) => void
  onNext: () => void
  onPrev: () => void
}

/**
 * Determine vehicle type from description
 * Based on Android app logic (scan.service.ts:422-428)
 * Enhanced to handle variations: "Trucktractor", "Truck tractor", "truck tractor", etc.
 */
function determineVehicleType(description: string): "truck" | "trailer" | null {
  if (!description) return null
  const desc = description.toLowerCase().replace(/\s+/g, "") // Remove all spaces for flexible matching

  // Check for truck indicators (handle with/without spaces)
  if (desc.includes("trucktractor") || desc.includes("voorspanmotor")) {
    return "truck"
  }

  // Check for trailer indicators
  if (desc.includes("tipper") || desc.includes("wipbak")) {
    return "trailer"
  }

  return null
}

export function Step6AssetTypeDetection({ state, updateState, onNext, onPrev }: Step6Props) {
  const alert = useAlert()
  const [detectedType, setDetectedType] = useState<"truck" | "trailer" | "driver" | null>(null)
  const [parsedData, setParsedData] = useState<any>(null)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const detectAndValidate = async () => {
      // Only run detection once when component mounts
      if (!state.firstBarcodeData) {
        setError("No barcode data found")
        return
      }

      console.log("Step6: Detecting asset type from barcode:", state.firstBarcodeData?.substring(0, 50))

      // Try vehicle first
      const vehicleResult = AssetFieldMapper.parseVehicleDisk(state.firstBarcodeData)

      if (!("error" in vehicleResult)) {
        console.log("Step6: Parsed as vehicle, description:", vehicleResult.description)

        // Automatically determine vehicle type from description
        const vehicleType = determineVehicleType(vehicleResult.description || "")

        if (vehicleType) {
          console.log("Step6: Detected vehicle type:", vehicleType)

          // Duplicate checking is done in Step4, so just detect and proceed
          setDetectedType(vehicleType)
          setParsedData({ vehicleInfo: vehicleResult })

          // Auto-advance after detection
          const parsedAssetData: ParsedAssetData = {
            type: vehicleType,
            ntCode: state.firstQRCode || "", // Android app field name
            vehicleInfo: vehicleResult,
          }

          updateState({
            type: vehicleType,
            parsedData: parsedAssetData,
          })

          // Auto-advance with slight delay
          setTimeout(() => {
            console.log("Step6: Auto-advancing to next step")
            onNext()
          }, 500)
        } else {
          const errorMsg = `Could not determine vehicle type. Description: "${vehicleResult.description}". Please ensure you are scanning a Truck Tractor or Tipper license disk.`
          console.error("Step6:", errorMsg)
          setError(errorMsg)
          alert.showError("Invalid Vehicle Type", "Could not determine if this is a truck or trailer. Please scan a valid Truck Tractor or Tipper license disk.")
        }
        return
      }

      // Try driver
      console.log("Step6: Not a vehicle, trying driver license...")
      const driverResult = AssetFieldMapper.parseDriverLicense(state.firstBarcodeData)

      if (!("error" in driverResult)) {
        console.log("Step6: Detected as driver")

        // Duplicate checking is done in Step4, so just detect and proceed
        setDetectedType("driver")
        setParsedData({ personInfo: driverResult.person, licenceInfo: driverResult.licence })

        // Auto-advance after detection
        const parsedAssetData: ParsedAssetData = {
          type: "driver",
          ntCode: state.firstQRCode || "", // Android app field name
          personInfo: driverResult.person,
          licenceInfo: driverResult.licence,
        }

        updateState({
          type: "driver",
          parsedData: parsedAssetData,
        })

        // Auto-advance with slight delay
        setTimeout(() => {
          console.log("Step6: Auto-advancing to next step")
          onNext()
        }, 500)
        return
      }

      // Both failed
      const errorMsg = "Could not parse barcode as vehicle or driver license"
      console.error("Step6:", errorMsg, driverResult)
      setError(errorMsg)
      alert.showError("Invalid Barcode", "Could not parse the barcode as a vehicle license disk or driver license. Please ensure you are scanning a valid South African license.")
    }

    detectAndValidate()
  }, []) // Run once on mount

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "truck":
        return "🚚"
      case "trailer":
        return "🚛"
      case "driver":
        return "👤"
      default:
        return "📦"
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "truck":
        return "Truck (Truck Tractor / Prime Mover)"
      case "trailer":
        return "Trailer (Tipper / Interlink)"
      case "driver":
        return "Driver (Person with Driver License)"
      default:
        return "Unknown"
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-muted-foreground mb-4">
            There was an error detecting the asset type.
          </p>
        </div>

        <div className="p-6 bg-red-500/10 border-2 border-red-500/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="text-red-600 dark:text-red-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-red-700 dark:text-red-300">Detection Failed</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-start pt-4">
          <Button variant="outline" onClick={onPrev}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous (Re-scan)
          </Button>
        </div>
      </div>
    )
  }

  if (!detectedType) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-muted-foreground mb-4">
            Based on the scanned barcode, we&apos;re automatically detecting the asset type.
          </p>
        </div>

        <div className="p-6 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="text-yellow-600 dark:text-yellow-400">
              <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div>
              <p className="font-medium text-yellow-700 dark:text-yellow-300">Detecting asset type...</p>
              <p className="text-sm text-muted-foreground">Please wait while we process the barcode data.</p>
            </div>
          </div>
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

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-4">
          Based on the scanned barcode, we&apos;ve automatically detected the asset type.
        </p>
      </div>

      <div className="p-6 bg-green-500/10 border-2 border-green-500/30 rounded-lg">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-4xl">{getTypeIcon(detectedType)}</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">Asset Type Detected</h3>
            </div>
            <p className="text-lg font-medium mb-1 capitalize">{getTypeLabel(detectedType)}</p>
            <p className="text-sm text-muted-foreground">
              The asset type was automatically determined from the barcode data. Advancing...
            </p>
          </div>
        </div>
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
