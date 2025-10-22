"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AssetInductionState } from "@/types/asset-types"
import { ArrowRight, ArrowLeft, AlertCircle, AlertTriangle } from "lucide-react"
import { AssetFieldMapper } from "@/lib/asset-field-mappings"
import { useAlert } from "@/hooks/useAlert"

interface Step7Props {
  state: Partial<AssetInductionState>
  updateState: (updates: Partial<AssetInductionState>) => void
  onNext: () => void
  onPrev: () => void
  onError: () => void
}

export function Step7FieldConfirmation({ state, updateState, onNext, onPrev, onError }: Step7Props) {
  const alert = useAlert()
  const [fields, setFields] = useState<any>({})
  const [expiryInfo, setExpiryInfo] = useState<any>(null)
  const [isExpired, setIsExpired] = useState(false)
  const hasAutoAdvanced = useRef(false) // Track if we've already auto-advanced to prevent infinite loop

  useEffect(() => {
    // Extract and populate fields from parsed data
    if (state.parsedData && !hasAutoAdvanced.current) {
      const data = state.parsedData

      if (state.type === "driver") {
        const driverFields = {
          idNumber: data.personInfo?.idNumber || "",
          name: data.personInfo?.name || "",
          surname: data.personInfo?.surname || "",
          initials: data.personInfo?.initials || "",
          gender: data.personInfo?.gender || "",
          birthDate: data.personInfo?.birthDate || "",
          licenceNumber: data.licenceInfo?.licenceNumber || "",
          licenceType: data.licenceInfo?.licenceType || "",
          expiryDate: data.licenceInfo?.expiryDate || "",
          issueDate: data.licenceInfo?.issueDate || "",
          driverRestrictions: data.licenceInfo?.driverRestrictions || "",
          ntCode: data.licenceInfo?.ntCode || "",
        }
        setFields(driverFields)

        // Check expiry for driver
        if (data.licenceInfo?.expiryDate) {
          const info = AssetFieldMapper.getExpiryInfo(data.licenceInfo.expiryDate)
          setExpiryInfo(info)
          setIsExpired(info.status === "expired")

          // Auto-advance if not expired
          if (info.status !== "expired") {
            hasAutoAdvanced.current = true // Mark that we're auto-advancing
            autoAdvance(driverFields)
          }
        }
      } else {
        // Truck or Trailer
        const vehicleFields = {
          registration: data.vehicleInfo?.registration || "",
          make: data.vehicleInfo?.make || "",
          model: data.vehicleInfo?.model || "",
          colour: data.vehicleInfo?.colour || "",
          vehicleDiskNo: data.vehicleInfo?.vehicleDiskNo || "",
          expiryDate: data.vehicleInfo?.expiryDate || "",
          engineNo: data.vehicleInfo?.engineNo || "",
          vin: data.vehicleInfo?.vin || "",
          description: data.vehicleInfo?.description || "", // Preserve vehicle type description
        }
        setFields(vehicleFields)

        // Check expiry for vehicle
        if (data.vehicleInfo?.expiryDate) {
          const info = AssetFieldMapper.getExpiryInfo(data.vehicleInfo.expiryDate)
          setExpiryInfo(info)
          setIsExpired(info.status === "expired")

          // Auto-advance if not expired
          if (info.status !== "expired") {
            hasAutoAdvanced.current = true // Mark that we're auto-advancing
            autoAdvance(vehicleFields)
          }
        }
      }
    }
  }, [state.parsedData, state.type])

  const autoAdvance = (currentFields: any) => {
    // Update parsed data and auto-advance after validation
    const updatedParsedData: any = {
      ...state.parsedData,
      type: state.type!,
      ntCode: state.firstQRCode || "", // Android app field name
      ...(state.type === "driver"
        ? {
            personInfo: {
              idNumber: currentFields.idNumber,
              name: currentFields.name,
              surname: currentFields.surname,
              initials: currentFields.initials,
              gender: currentFields.gender,
              birthDate: currentFields.birthDate,
            },
            licenceInfo: {
              licenceNumber: currentFields.licenceNumber,
              licenceType: currentFields.licenceType,
              expiryDate: currentFields.expiryDate,
              issueDate: currentFields.issueDate,
              driverRestrictions: currentFields.driverRestrictions,
              ntCode: currentFields.ntCode,
            },
          }
        : {
            vehicleInfo: {
              registration: currentFields.registration,
              make: currentFields.make,
              model: currentFields.model,
              colour: currentFields.colour,
              vehicleDiskNo: currentFields.vehicleDiskNo,
              expiryDate: currentFields.expiryDate,
              engineNo: currentFields.engineNo,
              vin: currentFields.vin,
              description: currentFields.description, // Preserve vehicle type description
            },
          }),
    }

    updateState({ parsedData: updatedParsedData })

    // Auto-advance after short delay to show fields
    setTimeout(() => {
      onNext()
    }, 800)
  }

  const handleNext = () => {
    if (isExpired) {
      alert.showError("Expired License/Disk", "Cannot proceed with expired license or disk. Please scan a valid, non-expired document.")
      return
    }

    // Update parsed data with any edited fields
    const updatedParsedData: any = {
      ...state.parsedData,
      type: state.type!,
      ntCode: state.firstQRCode || "", // Android app field name
      ...(state.type === "driver"
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
              description: fields.description, // Preserve vehicle type description
            },
          }),
    }

    updateState({ parsedData: updatedParsedData })
    onNext()
  }

  const handleFieldChange = (key: string, value: string) => {
    setFields((prev: any) => ({ ...prev, [key]: value }))

    // Re-validate expiry if expiry date changed
    if (key === "expiryDate" && value) {
      const info = AssetFieldMapper.getExpiryInfo(value)
      setExpiryInfo(info)
      setIsExpired(info.status === "expired")
    }
  }

  const getExpiryBanner = () => {
    if (!expiryInfo) return null

    if (expiryInfo.status === "expired") {
      return (
        <div className="p-4 bg-red-500/10 border-2 border-red-500 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-bold text-red-700 dark:text-red-300">EXPIRED - Process Blocked</p>
              <p className="text-xs text-muted-foreground">This license/disk has expired. Cannot proceed with induction.</p>
              <p className="text-xs text-muted-foreground mt-2">Notification will be sent to security personnel.</p>
            </div>
          </div>
          <Button variant="destructive" className="mt-4" onClick={() => onError()}>
            Return to Start
          </Button>
        </div>
      )
    }

    if (expiryInfo.status === "expiring-critical") {
      return (
        <div className="p-4 bg-orange-500/10 border-2 border-orange-500 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm font-bold text-orange-700 dark:text-orange-300">Warning: Expires in {expiryInfo.daysUntilExpiry} days</p>
              <p className="text-xs text-muted-foreground">This license/disk will expire very soon. Consider renewal.</p>
            </div>
          </div>
        </div>
      )
    }

    if (expiryInfo.status === "expiring-soon") {
      return (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Notice: Expires in {expiryInfo.daysUntilExpiry} days</p>
              <p className="text-xs text-muted-foreground">This license/disk will expire within 30 days.</p>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-4">Review and confirm the extracted field data. You can edit any field if needed.</p>
      </div>

      {getExpiryBanner()}

      <div className="grid grid-cols-2 gap-4">
        {state.type === "driver" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="idNumber">ID Number *</Label>
              <Input id="idNumber" value={fields.idNumber || ""} onChange={e => handleFieldChange("idNumber", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={fields.name || ""} onChange={e => handleFieldChange("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surname">Surname *</Label>
              <Input id="surname" value={fields.surname || ""} onChange={e => handleFieldChange("surname", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initials">Initials</Label>
              <Input id="initials" value={fields.initials || ""} onChange={e => handleFieldChange("initials", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Input id="gender" value={fields.gender || ""} onChange={e => handleFieldChange("gender", e.target.value)} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Birth Date</Label>
              <Input id="birthDate" value={fields.birthDate || ""} onChange={e => handleFieldChange("birthDate", e.target.value)} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenceNumber">License Number *</Label>
              <Input id="licenceNumber" value={fields.licenceNumber || ""} onChange={e => handleFieldChange("licenceNumber", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenceType">License Type</Label>
              <Input id="licenceType" value={fields.licenceType || ""} onChange={e => handleFieldChange("licenceType", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input id="expiryDate" value={fields.expiryDate || ""} onChange={e => handleFieldChange("expiryDate", e.target.value)} className={isExpired ? "border-red-500" : ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date</Label>
              <Input id="issueDate" value={fields.issueDate || ""} onChange={e => handleFieldChange("issueDate", e.target.value)} disabled />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="driverRestrictions">Driver Restrictions</Label>
              <Input id="driverRestrictions" value={fields.driverRestrictions || ""} onChange={e => handleFieldChange("driverRestrictions", e.target.value)} />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="registration">Registration Number *</Label>
              <Input id="registration" value={fields.registration || ""} onChange={e => handleFieldChange("registration", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="make">Make *</Label>
              <Input id="make" value={fields.make || ""} onChange={e => handleFieldChange("make", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input id="model" value={fields.model || ""} onChange={e => handleFieldChange("model", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="colour">Colour</Label>
              <Input id="colour" value={fields.colour || ""} onChange={e => handleFieldChange("colour", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleDiskNo">License Disk Number</Label>
              <Input id="vehicleDiskNo" value={fields.vehicleDiskNo || ""} onChange={e => handleFieldChange("vehicleDiskNo", e.target.value)} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input id="expiryDate" value={fields.expiryDate || ""} onChange={e => handleFieldChange("expiryDate", e.target.value)} className={isExpired ? "border-red-500" : ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="engineNo">Engine Number</Label>
              <Input id="engineNo" value={fields.engineNo || ""} onChange={e => handleFieldChange("engineNo", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vin">VIN</Label>
              <Input id="vin" value={fields.vin || ""} onChange={e => handleFieldChange("vin", e.target.value)} />
            </div>
          </>
        )}
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
