"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Asset } from "@/types"
import { QrCode, Barcode, ArrowLeft } from "lucide-react"
import { QRCodeScanner } from "@/components/assets/shared/QRCodeScanner"
import { BarcodeScanner, type ParsedBarcodeData } from "@/components/assets/shared/BarcodeScanner"
import { AssetService } from "@/services/asset.service"
import { useAlert } from "@/hooks/useAlert"
import { toast } from "sonner"

interface AssetEditModalProps {
  asset: Asset
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type UpdateType = "qr" | "barcode" | null
type Step = "select-type" | "verify-barcode" | "scan-new-qr" | "verify-qr" | "scan-new-barcode"

export function AssetEditModal({ asset, isOpen, onClose, onSuccess }: AssetEditModalProps) {
  const alert = useAlert()
  const [updateType, setUpdateType] = useState<UpdateType>(null)
  const [step, setStep] = useState<Step>("select-type")
  const [scannedBarcode, setScannedBarcode] = useState("")
  const [scannedQR, setScannedQR] = useState("")
  const [newQR, setNewQR] = useState("")
  const [newBarcode, setNewBarcode] = useState("")
  const [newBarcodeData, setNewBarcodeData] = useState<ParsedBarcodeData | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setUpdateType(null)
      setStep("select-type")
      setScannedBarcode("")
      setScannedQR("")
      setNewQR("")
      setNewBarcode("")
      setNewBarcodeData(null)
    }
  }, [isOpen])

  const handleSelectUpdateType = (type: UpdateType) => {
    setUpdateType(type)
    if (type === "qr") {
      setStep("verify-barcode")
    } else if (type === "barcode") {
      setStep("verify-qr")
    }
  }

  const handleBarcodeVerified = (barcodeData: string, parsed: ParsedBarcodeData) => {
    console.log("EditAssetModal: Barcode verified for QR update")
    // Verify it matches the asset's barcode data
    if (parsed.type === "vehicle" && !("error" in parsed.data)) {
      if (asset.registration && parsed.data.registration !== asset.registration) {
        alert.showError("Wrong Asset", "This barcode does not match the asset you are editing. Please scan the correct vehicle license disk.")
        return
      }
    } else if (parsed.type === "driver" && !("error" in parsed.data)) {
      if (asset.idNumber && parsed.data.person.idNumber !== asset.idNumber) {
        alert.showError("Wrong Asset", "This barcode does not match the asset you are editing. Please scan the correct driver's license.")
        return
      }
    }

    setScannedBarcode(barcodeData)
    setStep("scan-new-qr")
  }

  const handleQRVerified = (qrCode: string) => {
    console.log("EditAssetModal: QR verified for barcode update")
    // Verify it matches the asset's QR code
    if (asset.ntCode !== qrCode) {
      alert.showError("Wrong Asset", "This QR code does not match the asset you are editing. Please scan the correct Newton QR code.")
      return
    }

    setScannedQR(qrCode)
    setStep("scan-new-barcode")
  }

  const handleNewQRScanned = (qrCode: string) => {
    console.log("EditAssetModal: New QR code scanned:", qrCode)

    // Check if it's the same as current
    if (qrCode === asset.ntCode) {
      alert.showWarning(
        "No Change Detected",
        "The scanned QR code is the same as the current one. No update is needed.",
        () => {
          // Reset to scan again
          setNewQR("")
        }
      )
      return
    }

    setNewQR(qrCode)
    // Proceed to save
    handleSaveQRUpdate(qrCode)
  }

  const handleNewBarcodeScanned = (barcodeData: string, parsed: ParsedBarcodeData) => {
    console.log("EditAssetModal: New barcode scanned")

    // Validate based on asset type
    if (asset.type === "driver") {
      if (parsed.type !== "driver") {
        alert.showError("Wrong Barcode Type", "This asset is a driver. Please scan a driver's license barcode.")
        return
      }

      if ("error" in parsed.data) {
        alert.showError("Parsing Error", "Failed to parse driver's license barcode.")
        return
      }

      // Check if ID number matches
      if (parsed.data.person.idNumber !== asset.idNumber) {
        alert.showError(
          "ID Number Mismatch",
          `The ID number on the scanned license (${parsed.data.person.idNumber}) does not match the asset's ID number (${asset.idNumber}). Please scan the correct driver's license.`
        )
        return
      }

      // Check if expiry date has changed
      const currentExpiry = asset.expiryDate
      const newExpiry = parsed.data.licence?.expiryDate || parsed.data.person.birthDate

      if (currentExpiry && newExpiry && currentExpiry === newExpiry) {
        alert.showInfo(
          "No Change Detected",
          "The scanned driver's license has the same expiry date as the current one. No update is needed.",
          () => {
            setNewBarcode("")
            setNewBarcodeData(null)
          }
        )
        return
      }

      // Check if new license is expired
      if (newExpiry) {
        const expiryParts = newExpiry.split("/")
        if (expiryParts.length === 3) {
          const expiryDate = new Date(
            parseInt(expiryParts[2], 10),
            parseInt(expiryParts[1], 10) - 1,
            parseInt(expiryParts[0], 10)
          )
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          if (expiryDate < today) {
            alert.showWarning(
              "Expired License",
              "Warning: The scanned driver's license is expired. Are you sure you want to update to an expired license?",
              () => {
                // User confirmed, proceed to save
                setNewBarcode(barcodeData)
                setNewBarcodeData(parsed)
                handleSaveBarcodeUpdate(barcodeData, parsed)
              }
            )
            return
          }
        }
      }

      // Check if new expiry is newer than current
      if (currentExpiry && newExpiry) {
        const currentParts = currentExpiry.split("/")
        const newParts = newExpiry.split("/")

        if (currentParts.length === 3 && newParts.length === 3) {
          const currentDate = new Date(
            parseInt(currentParts[2], 10),
            parseInt(currentParts[1], 10) - 1,
            parseInt(currentParts[0], 10)
          )
          const newDate = new Date(
            parseInt(newParts[2], 10),
            parseInt(newParts[1], 10) - 1,
            parseInt(newParts[0], 10)
          )

          if (newDate <= currentDate) {
            alert.showWarning(
              "Older License",
              `The scanned license expires on ${newExpiry}, which is not newer than the current expiry (${currentExpiry}). Are you sure you want to proceed?`,
              () => {
                // User confirmed, proceed to save
                setNewBarcode(barcodeData)
                setNewBarcodeData(parsed)
                handleSaveBarcodeUpdate(barcodeData, parsed)
              }
            )
            return
          }
        }
      }
    } else {
      // Vehicle (truck/trailer)
      if (parsed.type !== "vehicle") {
        alert.showError("Wrong Barcode Type", "This asset is a vehicle. Please scan a vehicle license disk barcode.")
        return
      }

      if ("error" in parsed.data) {
        alert.showError("Parsing Error", "Failed to parse vehicle license disk barcode.")
        return
      }

      // Check if registration matches
      if (parsed.data.registration !== asset.registration) {
        alert.showError(
          "Registration Mismatch",
          `The registration on the scanned disk (${parsed.data.registration}) does not match the asset's registration (${asset.registration}). Please scan the correct vehicle license disk.`
        )
        return
      }

      // Check if expiry date has changed
      const currentExpiry = asset.expiryDate
      const newExpiry = parsed.data.expiryDate

      if (currentExpiry && newExpiry && currentExpiry === newExpiry) {
        alert.showInfo(
          "No Change Detected",
          "The scanned vehicle license disk has the same expiry date as the current one. No update is needed.",
          () => {
            setNewBarcode("")
            setNewBarcodeData(null)
          }
        )
        return
      }

      // Check if new disk is expired
      if (newExpiry) {
        const expiryParts = newExpiry.split("/")
        if (expiryParts.length === 3) {
          const expiryDate = new Date(
            parseInt(expiryParts[2], 10),
            parseInt(expiryParts[1], 10) - 1,
            parseInt(expiryParts[0], 10)
          )
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          if (expiryDate < today) {
            alert.showWarning(
              "Expired License Disk",
              "Warning: The scanned vehicle license disk is expired. Are you sure you want to update to an expired disk?",
              () => {
                // User confirmed, proceed to save
                setNewBarcode(barcodeData)
                setNewBarcodeData(parsed)
                handleSaveBarcodeUpdate(barcodeData, parsed)
              }
            )
            return
          }
        }
      }

      // Check if new expiry is newer than current
      if (currentExpiry && newExpiry) {
        const currentParts = currentExpiry.split("/")
        const newParts = newExpiry.split("/")

        if (currentParts.length === 3 && newParts.length === 3) {
          const currentDate = new Date(
            parseInt(currentParts[2], 10),
            parseInt(currentParts[1], 10) - 1,
            parseInt(currentParts[0], 10)
          )
          const newDate = new Date(
            parseInt(newParts[2], 10),
            parseInt(newParts[1], 10) - 1,
            parseInt(newParts[0], 10)
          )

          if (newDate <= currentDate) {
            alert.showWarning(
              "Older License Disk",
              `The scanned disk expires on ${newExpiry}, which is not newer than the current expiry (${currentExpiry}). Are you sure you want to proceed?`,
              () => {
                // User confirmed, proceed to save
                setNewBarcode(barcodeData)
                setNewBarcodeData(parsed)
                handleSaveBarcodeUpdate(barcodeData, parsed)
              }
            )
            return
          }
        }
      }
    }

    // All validations passed
    setNewBarcode(barcodeData)
    setNewBarcodeData(parsed)
    handleSaveBarcodeUpdate(barcodeData, parsed)
  }

  const handleSaveQRUpdate = async (qrCode: string) => {
    setIsSaving(true)
    try {
      await AssetService.update(asset.id, {
        ntCode: qrCode,
      })

      toast.success("QR code updated successfully")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error updating QR code:", error)
      toast.error("Failed to update QR code")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveBarcodeUpdate = async (barcodeData: string, parsed: ParsedBarcodeData) => {
    setIsSaving(true)
    try {
      const updates: Partial<Asset> = {}

      if (parsed.type === "vehicle" && !("error" in parsed.data)) {
        updates.expiryDate = parsed.data.expiryDate
        updates.make = parsed.data.make
        updates.model = parsed.data.model
        updates.colour = parsed.data.colour
        updates.licenceDiskNo = parsed.data.vehicleDiskNo
        updates.engineNo = parsed.data.engineNo
        updates.vin = parsed.data.vin
      } else if (parsed.type === "driver" && !("error" in parsed.data)) {
        updates.expiryDate = parsed.data.licence?.expiryDate || parsed.data.person.birthDate
        updates.name = parsed.data.person.name
        updates.surname = parsed.data.person.surname
        updates.initials = parsed.data.person.initials
        updates.gender = parsed.data.person.gender
        updates.birthDate = parsed.data.person.birthDate
        updates.nationality = parsed.data.person.nationality
        updates.licenceNumber = parsed.data.licence?.licenceNumber
        updates.licenceType = parsed.data.licence?.licenceType
      }

      await AssetService.update(asset.id, updates)

      toast.success("Barcode data updated successfully")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error updating barcode:", error)
      toast.error("Failed to update barcode data")
    } finally {
      setIsSaving(false)
    }
  }

  const handleBack = () => {
    if (step === "verify-barcode" || step === "verify-qr") {
      setStep("select-type")
      setUpdateType(null)
    } else if (step === "scan-new-qr") {
      setStep("verify-barcode")
      setScannedBarcode("")
    } else if (step === "scan-new-barcode") {
      setStep("verify-qr")
      setScannedQR("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === "select-type" && "Edit Asset"}
            {step === "verify-barcode" && "Verify Asset - Scan Barcode"}
            {step === "scan-new-qr" && "Scan New QR Code"}
            {step === "verify-qr" && "Verify Asset - Scan QR Code"}
            {step === "scan-new-barcode" && "Scan New Barcode"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Select Update Type */}
          {step === "select-type" && (
            <div className="space-y-4">
              <p className="text-muted-foreground">What would you like to update?</p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleSelectUpdateType("qr")}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-green-500 hover:bg-green-500/10 transition-all"
                >
                  <QrCode className="w-12 h-12 text-green-600 dark:text-green-400 mb-3" />
                  <p className="font-medium">Update QR Code</p>
                  <p className="text-xs text-muted-foreground text-center mt-1">QR code damaged or replaced</p>
                </button>

                <button
                  onClick={() => handleSelectUpdateType("barcode")}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-500/10 transition-all"
                >
                  <Barcode className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-3" />
                  <p className="font-medium">Update Barcode</p>
                  <p className="text-xs text-muted-foreground text-center mt-1">License/disk expired or renewed</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 2a: Verify Barcode (for QR update) */}
          {step === "verify-barcode" && (
            <div className="space-y-4">
              <p className="text-muted-foreground">Scan the existing barcode to verify this is the correct asset.</p>

              {/* Show asset details to help identify correct barcode */}
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Looking for:</p>
                {asset.type === "driver" ? (
                  <p className="text-sm text-muted-foreground">
                    Driver's License: <span className="font-semibold">{asset.name} {asset.surname}</span>
                    {asset.idNumber && <span className="block text-xs">ID: {asset.idNumber}</span>}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Vehicle License Disk: <span className="font-semibold">{asset.registration}</span>
                    {asset.make && asset.model && <span className="block text-xs">{asset.make} {asset.model}</span>}
                  </p>
                )}
              </div>

              <BarcodeScanner
                onScanSuccess={handleBarcodeVerified}
                label="Existing Barcode"
                helpText={
                  asset.type === "driver"
                    ? `Scan driver's license for ${asset.name} ${asset.surname}`
                    : `Scan vehicle disk for ${asset.registration}`
                }
              />
            </div>
          )}

          {/* Step 3a: Scan New QR Code */}
          {step === "scan-new-qr" && (
            <div className="space-y-4">
              <p className="text-muted-foreground">Scan the new Newton QR code to replace the old one.</p>
              <QRCodeScanner
                onScanSuccess={handleNewQRScanned}
                label="New QR Code"
                helpText="Scan the new Newton QR code"
              />
            </div>
          )}

          {/* Step 2b: Verify QR Code (for barcode update) */}
          {step === "verify-qr" && (
            <div className="space-y-4">
              <p className="text-muted-foreground">Scan the existing QR code to verify this is the correct asset.</p>

              {/* Show asset details to help identify correct QR */}
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Looking for:</p>
                {asset.type === "driver" ? (
                  <p className="text-sm text-muted-foreground">
                    Driver: <span className="font-semibold">{asset.name} {asset.surname}</span>
                    {asset.idNumber && <span className="block text-xs">ID: {asset.idNumber}</span>}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Vehicle: <span className="font-semibold">{asset.registration}</span>
                    {asset.make && asset.model && <span className="block text-xs">{asset.make} {asset.model}</span>}
                  </p>
                )}
                {asset.ntCode && <p className="text-xs text-muted-foreground mt-1">QR Code: {asset.ntCode.substring(0, 20)}...</p>}
              </div>

              <QRCodeScanner
                onScanSuccess={handleQRVerified}
                label="Existing QR Code"
                helpText={
                  asset.type === "driver"
                    ? `Scan QR code for ${asset.name} ${asset.surname}`
                    : `Scan QR code for ${asset.registration}`
                }
              />
            </div>
          )}

          {/* Step 3b: Scan New Barcode */}
          {step === "scan-new-barcode" && (
            <div className="space-y-4">
              <p className="text-muted-foreground">Scan the new {asset.type === "driver" ? "driver's license" : "vehicle license disk"} barcode.</p>

              {/* Show asset details for reference */}
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">
                  {asset.type === "driver" ? "Driver must match:" : "Vehicle must match:"}
                </p>
                {asset.type === "driver" ? (
                  <p className="text-sm text-muted-foreground">
                    Name: <span className="font-semibold">{asset.name} {asset.surname}</span>
                    <span className="block text-xs">ID Number: {asset.idNumber}</span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Registration: <span className="font-semibold">{asset.registration}</span>
                  </p>
                )}
              </div>

              <BarcodeScanner
                onScanSuccess={handleNewBarcodeScanned}
                label="New Barcode"
                helpText={
                  asset.type === "driver"
                    ? `Scan new license for ${asset.name} ${asset.surname}`
                    : `Scan new disk for ${asset.registration}`
                }
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={step === "select-type" ? onClose : handleBack}
              disabled={isSaving}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {step === "select-type" ? "Cancel" : "Back"}
            </Button>

            {isSaving && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Saving...
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
