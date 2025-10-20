"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import type { AssetInductionState, ParsedAssetData } from "@/types/asset-types"
import { ArrowRight, ArrowLeft, CheckCircle } from "lucide-react"
import { AssetFieldMapper } from "@/lib/asset-field-mappings"
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
 */
function determineVehicleType(description: string): "truck" | "trailer" | null {
  if (!description) return null
  const desc = description.toLowerCase()

  // Check for truck indicators
  if (desc.includes("truck tractor") || desc.includes("voorspanmotor")) {
    return "truck"
  }

  // Check for trailer indicators
  if (desc.includes("tipper") || desc.includes("wipbak")) {
    return "trailer"
  }

  return null
}

export function Step6AssetTypeDetection({ state, updateState, onNext, onPrev }: Step6Props) {
  const [detectedType, setDetectedType] = useState<"truck" | "trailer" | "driver" | null>(null)
  const [parsedData, setParsedData] = useState<any>(null)
  const [isAutoDetected, setIsAutoDetected] = useState(false)

  useEffect(() => {
    // Parse the barcode data and automatically detect type
    if (state.firstBarcodeData) {
      // Try vehicle first
      const vehicleResult = AssetFieldMapper.parseVehicleDisk(state.firstBarcodeData)
      if (!("error" in vehicleResult)) {
        // Automatically determine vehicle type from description
        const vehicleType = determineVehicleType(vehicleResult.description || "")

        if (vehicleType) {
          setDetectedType(vehicleType)
          setParsedData({ vehicleInfo: vehicleResult })
          setIsAutoDetected(true)

          // Auto-advance after detection
          const parsedAssetData: ParsedAssetData = {
            type: vehicleType,
            qrCode: state.firstQRCode || "",
            vehicleInfo: vehicleResult,
          }

          updateState({
            type: vehicleType,
            parsedData: parsedAssetData,
          })

          setTimeout(() => {
            onNext()
          }, 800) // Slightly longer delay to show the detection
        } else {
          toast.error("Could not determine vehicle type from license disk. Description: " + vehicleResult.description)
          setDetectedType(null)
        }
        return
      }

      // Try driver
      const driverResult = AssetFieldMapper.parseDriverLicense(state.firstBarcodeData)
      if (!("error" in driverResult)) {
        setDetectedType("driver")
        setParsedData({ personInfo: driverResult.person, licenceInfo: driverResult.licence })
        setIsAutoDetected(true)

        // Auto-advance after detection
        const parsedAssetData: ParsedAssetData = {
          type: "driver",
          qrCode: state.firstQRCode || "",
          personInfo: driverResult.person,
          licenceInfo: driverResult.licence,
        }

        updateState({
          type: "driver",
          parsedData: parsedAssetData,
        })

        setTimeout(() => {
          onNext()
        }, 800) // Slightly longer delay to show the detection
      }
    }
  }, [state.firstBarcodeData])

  const handleNext = () => {
    if (!detectedType) {
      toast.error("Asset type could not be detected")
      return
    }

    const parsedAssetData = {
      assetType: detectedType,
      qrCode: state.firstQRCode || "",
      ...parsedData,
    }

    updateState({
      type: detectedType,
      parsedData: parsedAssetData,
    })

    onNext()
  }

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

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-4">
          Based on the scanned barcode, we&apos;ve automatically detected the asset type.
        </p>
      </div>

      {isAutoDetected && detectedType ? (
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
                The asset type was automatically determined from the barcode data.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="text-yellow-600 dark:text-yellow-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-yellow-700 dark:text-yellow-300">Detecting asset type...</p>
              <p className="text-sm text-muted-foreground">Please wait while we process the barcode data.</p>
            </div>
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
