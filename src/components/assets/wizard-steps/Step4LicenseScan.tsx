"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AssetInductionState } from "@/types/asset-types"
import { ArrowRight, ArrowLeft, AlertCircle } from "lucide-react"
import { AssetFieldMapper } from "@/lib/asset-field-mappings"
import { toast } from "sonner"

interface Step4Props {
  state: Partial<AssetInductionState>
  updateState: (updates: Partial<AssetInductionState>) => void
  onNext: () => void
  onPrev: () => void
}

export function Step4LicenseScan({ state, updateState, onNext, onPrev }: Step4Props) {
  const [barcodeData, setBarcodeData] = useState(state.firstBarcodeData || "")
  const [error, setError] = useState("")
  const [parsedData, setParsedData] = useState<any>(null)

  useEffect(() => {
    // Auto-focus the input when component mounts
    const input = document.getElementById("barcode-input")
    if (input) {
      input.focus()
    }
  }, [])

  const handleParse = () => {
    if (!barcodeData.trim()) {
      setError("Barcode data is required")
      return
    }

    setError("")

    // Try to parse as vehicle disk first
    const vehicleResult = AssetFieldMapper.parseVehicleDisk(barcodeData.trim())

    if (!("error" in vehicleResult)) {
      // Successfully parsed as vehicle
      setParsedData({ type: "vehicle", data: vehicleResult })
      return
    }

    // Try to parse as driver license/ID
    const driverResult = AssetFieldMapper.parseDriverLicense(barcodeData.trim())

    if (!("error" in driverResult)) {
      // Successfully parsed as driver
      setParsedData({ type: "driver", data: driverResult })
      return
    }

    // Both parsers failed
    setError("Could not parse barcode. Please ensure you're scanning a valid South African vehicle license disk or driver license.")
    toast.error("Barcode parsing failed")
    setParsedData(null)
  }

  const handleNext = () => {
    if (!parsedData) {
      setError("Please scan and parse a valid barcode first")
      return
    }

    updateState({ firstBarcodeData: barcodeData.trim() })
    onNext()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleParse()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-4">Use your desktop scanner to scan the vehicle license disk barcode OR driver license barcode.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="barcode-input">License/Disk Barcode *</Label>
        <div className="flex gap-2">
          <Input
            id="barcode-input"
            type="text"
            placeholder="Scan barcode or type manually..."
            value={barcodeData}
            onChange={e => {
              setBarcodeData(e.target.value)
              setError("")
              setParsedData(null)
            }}
            onKeyPress={handleKeyPress}
            className={error ? "border-red-500" : parsedData ? "border-green-500" : ""}
            autoComplete="off"
          />
          <Button onClick={handleParse} variant="secondary">
            Parse
          </Button>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Scan with desktop scanner and click Parse, or press Enter after scanning</p>
      </div>

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
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Colour:</span>
                  <span>{parsedData.data.colour}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Expiry Date:</span>
                  <span>{parsedData.data.expiryDate}</span>
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
                {parsedData.data.licence && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">License Number:</span>
                      <span className="font-mono">{parsedData.data.licence.licenceNumber}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Expiry Date:</span>
                      <span>{parsedData.data.licence.expiryDate}</span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={handleNext} disabled={!parsedData}>
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
