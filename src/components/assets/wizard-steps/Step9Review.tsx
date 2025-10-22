"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { AssetInductionState } from "@/types/asset-types"
import { ArrowLeft, Check } from "lucide-react"
import { useSignals } from "@preact/signals-react/runtime"
import { data as globalData } from "@/services/data.service"
import { AssetService } from "@/services/asset.service"
import { AssetFieldMapper } from "@/lib/asset-field-mappings"
import { useAlert } from "@/hooks/useAlert"
import { toast } from "sonner"

interface Step9Props {
  state: Partial<AssetInductionState>
  onComplete: () => void
  onPrev: () => void
}

export function Step9Review({ state, onComplete, onPrev }: Step9Props) {
  useSignals()
  const alert = useAlert()
  const companies = globalData.companies.value

  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedCompany = useMemo(() => {
    return companies.find(c => c.id === state.companyId)
  }, [companies, state.companyId])

  const expiryInfo = useMemo(() => {
    if (!state.parsedData) return null

    const expiryDate =
      state.type === "driver"
        ? state.parsedData.licenceInfo?.expiryDate
        : state.parsedData.vehicleInfo?.expiryDate

    if (!expiryDate) return null

    return AssetFieldMapper.getExpiryInfo(expiryDate)
  }, [state.parsedData, state.type])

  const getExpiryBadge = () => {
    if (!expiryInfo) return null

    const colorMap = {
      green: "bg-green-500/20 text-green-700 dark:text-green-300",
      yellow: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300",
      orange: "bg-orange-500/20 text-orange-700 dark:text-orange-300",
      red: "bg-red-500/20 text-red-700 dark:text-red-300",
    }

    return (
      <Badge variant="outline" className={colorMap[expiryInfo.color]}>
        {expiryInfo.message}
      </Badge>
    )
  }

  const handleSubmit = async () => {
    if (!state.companyId || !state.parsedData || !state.type) {
      alert.showError("Incomplete Data", "Missing required data. Please go back and complete all steps.")
      return
    }

    setIsSubmitting(true)

    try {
      console.log("💾 Creating asset with following data:")
      console.log("  Company ID:", state.companyId)
      console.log("  Parsed Data:", state.parsedData)
      console.log("  Optional Fields:", { fleetNumber: state.fleetNumber, groupId: state.groupId })

      // Create the asset
      await AssetService.create(
        state.parsedData,
        state.companyId,
        {
          fleetNumber: state.fleetNumber,
          groupId: state.groupId,
        }
      )

      // Show success alert to ensure user sees the confirmation
      const assetType = state.type === "truck" ? "Truck" : state.type === "trailer" ? "Trailer" : "Driver"
      const assetIdentifier = state.type === "driver"
        ? `${state.parsedData.personInfo?.name} ${state.parsedData.personInfo?.surname}`
        : state.parsedData.vehicleInfo?.registration

      alert.showSuccess(
        "Asset Inducted Successfully",
        `${assetType} (${assetIdentifier}) has been successfully inducted and added to the system.`,
        () => {
          // Complete the wizard after user acknowledges
          onComplete()
        }
      )

      // TODO: Send notification to users with "asset.added" preference
    } catch (error) {
      console.error("Error creating asset:", error)
      toast.error("Failed to induct asset. Please try again.")
      setIsSubmitting(false)
    }
  }

  const getAssetIcon = (type: string) => {
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
        <p className="text-muted-foreground mb-4">Review all information before submitting. Use the Previous button if you need to make any changes.</p>
      </div>

      {/* Company Info */}
      <div className="p-4 border rounded-lg">
        <div className="mb-2">
          <h3 className="font-semibold">Company</h3>
        </div>
        <p className="text-sm text-muted-foreground">{selectedCompany?.name}</p>
      </div>

      {/* Asset Type */}
      <div className="p-4 border rounded-lg">
        <div className="mb-2">
          <h3 className="font-semibold">Asset Type</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getAssetIcon(state.type || "")}</span>
          <span className="capitalize font-medium">{state.type}</span>
        </div>
      </div>

      {/* QR Code */}
      <div className="p-4 border rounded-lg">
        <div className="mb-2">
          <h3 className="font-semibold">QR Code</h3>
        </div>
        <p className="text-sm font-mono text-muted-foreground">{state.firstQRCode}</p>
      </div>

      {/* Extracted Fields */}
      <div className="p-4 border rounded-lg">
        <div className="mb-2">
          <h3 className="font-semibold">Details</h3>
        </div>
        <div className="space-y-2 text-sm">
          {state.type === "driver" ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">ID Number:</span>
                <span className="font-mono">{state.parsedData?.personInfo?.idNumber}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Name:</span>
                <span>
                  {state.parsedData?.personInfo?.name} {state.parsedData?.personInfo?.surname}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">License Number:</span>
                <span className="font-mono">{state.parsedData?.licenceInfo?.licenceNumber}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Expiry Date:</span>
                <span className="flex items-center gap-2">
                  {state.parsedData?.licenceInfo?.expiryDate}
                  {getExpiryBadge()}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Registration:</span>
                <span className="font-mono">{state.parsedData?.vehicleInfo?.registration}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Make & Model:</span>
                <span>
                  {state.parsedData?.vehicleInfo?.make} {state.parsedData?.vehicleInfo?.model}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Colour:</span>
                <span>{state.parsedData?.vehicleInfo?.colour}</span>
              </div>
              {state.parsedData?.vehicleInfo?.description && (
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Description:</span>
                  <span>{state.parsedData.vehicleInfo.description}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Expiry Date:</span>
                <span className="flex items-center gap-2">
                  {state.parsedData?.vehicleInfo?.expiryDate}
                  {getExpiryBadge()}
                </span>
              </div>
              {state.parsedData?.vehicleInfo?.engineNo && (
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Engine No:</span>
                  <span className="font-mono">{state.parsedData.vehicleInfo.engineNo}</span>
                </div>
              )}
              {state.parsedData?.vehicleInfo?.vin && (
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">VIN:</span>
                  <span className="font-mono">{state.parsedData.vehicleInfo.vin}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Optional Fields */}
      {(state.fleetNumber || state.groupId) && (
        <div className="p-4 border rounded-lg">
          <div className="mb-2">
            <h3 className="font-semibold">Additional Information</h3>
          </div>
          <div className="space-y-2 text-sm">
            {state.fleetNumber && (
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">{selectedCompany?.systemSettings?.fleetNumberLabel || "Fleet Number"}:</span>
                <span>{state.fleetNumber}</span>
              </div>
            )}
            {state.groupId && (
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">{selectedCompany?.systemSettings?.transporterGroupLabel || "Group"}:</span>
                <span>{state.groupId}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
          {isSubmitting ? "Submitting..." : "Submit & Induct Asset"}
          {!isSubmitting && <Check className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
