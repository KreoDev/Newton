"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { AssetInductionState } from "@/types/asset-types"
import { ArrowRight, ArrowLeft } from "lucide-react"
import { AssetFieldMapper } from "@/lib/asset-field-mappings"
import { toast } from "sonner"

interface Step6Props {
  state: Partial<AssetInductionState>
  updateState: (updates: Partial<AssetInductionState>) => void
  onNext: () => void
  onPrev: () => void
}

export function Step6AssetTypeDetection({ state, updateState, onNext, onPrev }: Step6Props) {
  const [detectedType, setDetectedType] = useState<"truck" | "trailer" | "driver" | null>(null)
  const [selectedType, setSelectedType] = useState<"truck" | "trailer" | "driver" | null>(null)
  const [parsedData, setParsedData] = useState<any>(null)

  useEffect(() => {
    // Parse the barcode data and detect type
    if (state.firstBarcodeData) {
      // Try vehicle first
      const vehicleResult = AssetFieldMapper.parseVehicleDisk(state.firstBarcodeData)
      if (!("error" in vehicleResult)) {
        // It's a vehicle - default to truck, but allow user to select trailer
        setDetectedType("truck")
        setSelectedType(state.type || "truck")
        setParsedData({ vehicleInfo: vehicleResult })
        return
      }

      // Try driver
      const driverResult = AssetFieldMapper.parseDriverLicense(state.firstBarcodeData)
      if (!("error" in driverResult)) {
        setDetectedType("driver")
        setSelectedType("driver")
        setParsedData({ personInfo: driverResult.person, licenceInfo: driverResult.licence })
      }
    }
  }, [state.firstBarcodeData, state.type])

  const handleNext = () => {
    if (!selectedType) {
      toast.error("Please select an asset type")
      return
    }

    const parsedAssetData = {
      assetType: selectedType,
      qrCode: state.firstQRCode || "",
      ...parsedData,
    }

    updateState({
      type: selectedType,
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

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-4">Based on the scanned barcode, we&apos;ve detected the asset type. Please confirm or select the correct type.</p>
      </div>

      {detectedType && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Detected Type:</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl">{getTypeIcon(detectedType)}</span>
            <span className="text-lg font-semibold capitalize">{detectedType}</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <Label>Select Asset Type *</Label>

        {detectedType === "driver" ? (
          // Driver can only be driver
          <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{getTypeIcon("driver")}</span>
              <div>
                <p className="font-semibold text-lg">Driver</p>
                <p className="text-sm text-muted-foreground">Person with driver license</p>
              </div>
            </div>
          </div>
        ) : (
          // Vehicle can be truck or trailer
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSelectedType("truck")}
              className={`p-4 border-2 rounded-lg transition-all ${
                selectedType === "truck" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}>
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl">{getTypeIcon("truck")}</span>
                <p className="font-semibold">Truck</p>
                <p className="text-xs text-muted-foreground">Truck tractor / Prime mover</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedType("trailer")}
              className={`p-4 border-2 rounded-lg transition-all ${
                selectedType === "trailer" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}>
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl">{getTypeIcon("trailer")}</span>
                <p className="font-semibold">Trailer</p>
                <p className="text-xs text-muted-foreground">Semi-trailer / Interlink</p>
              </div>
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={handleNext} disabled={!selectedType}>
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
