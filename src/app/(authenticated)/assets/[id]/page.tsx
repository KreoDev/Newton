"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { AssetService } from "@/services/asset.service"
import { AssetFieldMapper } from "@/lib/asset-field-mappings"
import type { Asset } from "@/types"
import { useSignals } from "@preact/signals-react/runtime"
import { data as globalData } from "@/services/data.service"
import { AssetEditModal } from "@/components/assets/AssetEditModal"
import { AssetOptionalFieldsEditModal } from "@/components/assets/AssetOptionalFieldsEditModal"
import { DeleteAssetModal } from "@/components/assets/DeleteAssetModal"
import { InactivateAssetModal } from "@/components/assets/InactivateAssetModal"

export default function AssetDetailsPage() {
  useSignals()
  const params = useParams()
  const router = useRouter()
  const assetId = params.id as string

  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(true)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [optionalFieldsModalOpen, setOptionalFieldsModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [inactivateModalOpen, setInactivateModalOpen] = useState(false)

  const companies = globalData.companies.value
  const groups = globalData.groups.value

  useEffect(() => {
    fetchAsset()
  }, [assetId])

  const fetchAsset = async () => {
    try {
      setLoading(true)
      const data = await AssetService.getById(assetId)
      setAsset(data)
    } catch (error) {
      console.error("Error fetching asset:", error)
    } finally {
      setLoading(false)
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

  const getExpiryBadge = (expiryDate?: string) => {
    if (!expiryDate) return null

    const expiryInfo = AssetFieldMapper.getExpiryInfo(expiryDate)

    const colorMap = {
      green: "bg-green-500/20 text-green-700 dark:text-green-300",
      yellow: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300",
      orange: "bg-orange-500/20 text-orange-700 dark:text-orange-300",
      red: "bg-red-500/20 text-red-700 dark:text-red-300",
    }

    return (
      <Badge variant="outline" className={colorMap[expiryInfo.color]}>
        {expiryInfo.status === "expired" ? "Expired" : expiryInfo.message}
      </Badge>
    )
  }

  const getAssetIdentifier = (asset: Asset) => {
    if (asset.type === "driver") {
      // For drivers: show "Initials Surname (License #)" or just name fields
      const driverName = asset.name && asset.surname ? `${asset.initials || asset.name} ${asset.surname}` : asset.surname || asset.name || ""
      const license = asset.licenceNumber || "" // Android app field name (British spelling)

      if (driverName && license) {
        return `${driverName} (${license})`
      } else if (driverName) {
        return driverName
      } else if (license) {
        return license
      }
      return "No License"
    }
    // For vehicles: show registration number (Android app field name)
    return asset.registration || "No Registration"
  }

  const company = companies.find(c => c.id === asset?.companyId)

  // For mine companies, groupId is a UUID (look up in Groups collection)
  // For transporter/logistics companies, groupId is the group name itself (from groupOptions string array)
  const group = groups.find(g => g.id === asset?.groupId)
  const groupDisplay = group?.name || asset?.groupId || "Unknown"

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading asset...</p>
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/assets">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Asset Not Found</h1>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">The asset you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Parse stored JSON data
  let parsedVehicleData: any = null
  let parsedDriverData: any = null

  try {
    if (asset.vehicleDiskData) {
      parsedVehicleData = JSON.parse(asset.vehicleDiskData)
    }
    if (asset.driverLicenseData) {
      parsedDriverData = JSON.parse(asset.driverLicenseData)
    }
  } catch (error) {
    console.error("Error parsing asset data:", error)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/assets">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">{getAssetIcon(asset.type)}</span>
              <h1 className="text-3xl font-bold tracking-tight">{getAssetIdentifier(asset)}</h1>
              {!asset.isActive && <Badge variant="destructive">Inactive</Badge>}
            </div>
            <p className="text-muted-foreground capitalize">{asset.type}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditModalOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          {asset.type === "truck" && (company?.systemSettings?.fleetNumberEnabled || company?.systemSettings?.transporterGroupEnabled) && (
            <Button variant="outline" onClick={() => setOptionalFieldsModalOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Fleet/Group
            </Button>
          )}
          {asset.isActive ? (
            <>
              <Button variant="outline" onClick={() => setInactivateModalOpen(true)}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Mark Inactive
              </Button>
              <Button variant="destructive" onClick={() => setDeleteModalOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={async () => {
                await AssetService.reactivate(asset.id)
                fetchAsset()
              }}>
              Reactivate
            </Button>
          )}
        </div>
      </div>

      {/* Inactive Banner */}
      {!asset.isActive && (
        <Card className="border-orange-500 bg-orange-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-semibold text-orange-700 dark:text-orange-300">Asset Inactive</p>
                <p className="text-sm text-muted-foreground">Reason: {asset.inactiveReason || "Not specified"}</p>
                {asset.inactiveDate && <p className="text-sm text-muted-foreground">Date: {new Date(asset.inactiveDate).toLocaleDateString()}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expiry Warning */}
      {asset.licenseExpiryDate && (
        <div>{getExpiryBadge(asset.licenseExpiryDate)}</div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Asset Type</p>
              <p className="font-medium capitalize">{asset.type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Newton QR</p>
              <p className="font-mono">{asset.ntCode}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Company</p>
              <p className="font-medium">{company?.name || "Unknown"}</p>
            </div>
            {asset.fleetNumber && (
              <div>
                <p className="text-sm text-muted-foreground">{company?.systemSettings?.fleetNumberLabel || "Fleet Number"}</p>
                <p className="font-medium">{asset.fleetNumber}</p>
              </div>
            )}
            {asset.groupId && (
              <div>
                <p className="text-sm text-muted-foreground">{company?.systemSettings?.transporterGroupLabel || "Group"}</p>
                <p className="font-medium">{groupDisplay}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Details (for truck/trailer) */}
      {asset.type !== "driver" && (
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {asset.registration && (
                <div>
                  <p className="text-sm text-muted-foreground">Registration Number</p>
                  <p className="font-mono font-semibold">{asset.registration}</p>
                </div>
              )}
              {(asset.make || asset.model) && (
                <div>
                  <p className="text-sm text-muted-foreground">Make & Model</p>
                  <p className="font-medium">
                    {asset.make} {asset.model}
                  </p>
                </div>
              )}
              {asset.vehicleDescription && (
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle Type</p>
                  <p className="font-medium">{asset.vehicleDescription}</p>
                </div>
              )}
              {asset.description && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{asset.description}</p>
                </div>
              )}
              {asset.colour && (
                <div>
                  <p className="text-sm text-muted-foreground">Colour</p>
                  <p className="font-medium">{asset.colour}</p>
                </div>
              )}
              {(asset.licenceDiskNo || asset.licenceNo) && (
                <div>
                  <p className="text-sm text-muted-foreground">License Disk Number</p>
                  <p className="font-mono">{asset.licenceDiskNo || asset.licenceNo}</p>
                </div>
              )}
              {(asset.licenseExpiryDate || asset.dateOfExpiry || asset.expiryDate) && (
                <div>
                  <p className="text-sm text-muted-foreground">Expiry Date</p>
                  <div className="font-medium flex items-center gap-2">
                    {asset.licenseExpiryDate || asset.dateOfExpiry || asset.expiryDate}
                    {getExpiryBadge(asset.licenseExpiryDate || asset.dateOfExpiry || asset.expiryDate)}
                  </div>
                </div>
              )}
              {asset.engineNo && (
                <div>
                  <p className="text-sm text-muted-foreground">Engine Number</p>
                  <p className="font-mono">{asset.engineNo}</p>
                </div>
              )}
              {asset.vin && (
                <div>
                  <p className="text-sm text-muted-foreground">VIN</p>
                  <p className="font-mono">{asset.vin}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Driver Details */}
      {asset.type === "driver" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {asset.img && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">Driver Photo</p>
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-border">
                      <img src={asset.img} alt="Driver photo" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
                {asset.idNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">ID Number</p>
                    <p className="font-mono font-semibold">{asset.idNumber}</p>
                  </div>
                )}
                {(asset.name || asset.surname) && (
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium">
                      {asset.initials || asset.name} {asset.surname}
                    </p>
                  </div>
                )}
                {asset.gender && (
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium">{asset.gender}</p>
                  </div>
                )}
                {asset.birthDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">{asset.birthDate}</p>
                  </div>
                )}
                {asset.age && (
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="font-medium">{asset.age}</p>
                  </div>
                )}
                {asset.sadcCountry && (
                  <div>
                    <p className="text-sm text-muted-foreground">Country</p>
                    <p className="font-medium">{asset.sadcCountry}</p>
                  </div>
                )}
                {asset.issuedPlace && (
                  <div>
                    <p className="text-sm text-muted-foreground">Place Issued</p>
                    <p className="font-medium">{asset.issuedPlace}</p>
                  </div>
                )}
                {asset.idType && (
                  <div>
                    <p className="text-sm text-muted-foreground">ID Type</p>
                    <p className="font-medium">{asset.idType}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {asset.licenceNumber && (
            <Card>
              <CardHeader>
                <CardTitle>License Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">License Number</p>
                    <p className="font-mono font-semibold">{asset.licenceNumber}</p>
                  </div>
                  {asset.licenceType && (
                    <div>
                      <p className="text-sm text-muted-foreground">License Type</p>
                      <p className="font-medium">{asset.licenceType}</p>
                    </div>
                  )}
                  {(asset.licenseExpiryDate || asset.expiryDate) && (
                    <div>
                      <p className="text-sm text-muted-foreground">Expiry Date</p>
                      <div className="font-medium flex items-center gap-2">
                        {asset.licenseExpiryDate || asset.expiryDate}
                        {getExpiryBadge(asset.licenseExpiryDate || asset.expiryDate)}
                      </div>
                    </div>
                  )}
                  {(asset.issueDate || asset.firstIssueDate) && (
                    <div>
                      <p className="text-sm text-muted-foreground">Issue Date</p>
                      <p className="font-medium">{asset.issueDate || asset.firstIssueDate}</p>
                    </div>
                  )}
                  {asset.licenceIssueNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground">License Issue Number</p>
                      <p className="font-mono">{asset.licenceIssueNumber}</p>
                    </div>
                  )}
                  {asset.vehicleCodes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Vehicle Codes</p>
                      <p className="font-medium">{asset.vehicleCodes}</p>
                    </div>
                  )}
                  {asset.vehicleClassCodes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Vehicle Class Codes</p>
                      <p className="font-medium">{asset.vehicleClassCodes}</p>
                    </div>
                  )}
                  {asset.prdpCode && (
                    <div>
                      <p className="text-sm text-muted-foreground">PrDP Code</p>
                      <p className="font-mono">{asset.prdpCode}</p>
                    </div>
                  )}
                  {asset.prdpCategory && (
                    <div>
                      <p className="text-sm text-muted-foreground">PrDP Category</p>
                      <p className="font-medium">{asset.prdpCategory}</p>
                    </div>
                  )}
                  {asset.prdpValidUntil && (
                    <div>
                      <p className="text-sm text-muted-foreground">PrDP Valid Until</p>
                      <p className="font-medium">{asset.prdpValidUntil}</p>
                    </div>
                  )}
                  {asset.endorsement && (
                    <div>
                      <p className="text-sm text-muted-foreground">Endorsement</p>
                      <p className="font-medium">{asset.endorsement}</p>
                    </div>
                  )}
                  {asset.driverRestrictions && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Driver Restrictions</p>
                      <p className="font-medium">{asset.driverRestrictions}</p>
                    </div>
                  )}
                  {asset.vehicleRestrictions && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Vehicle Restrictions</p>
                      <p className="font-medium">{asset.vehicleRestrictions}</p>
                    </div>
                  )}
                  {asset.restrictions && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">General Restrictions</p>
                      <p className="font-medium">{asset.restrictions}</p>
                    </div>
                  )}
                  {asset.expired !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={asset.expired ? "destructive" : "default"}>
                        {asset.expired ? "Expired" : "Valid"}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Created At</p>
              <p>{new Date(asset.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p>{new Date(asset.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {editModalOpen && <AssetEditModal asset={asset} isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} onSuccess={fetchAsset} />}
      {deleteModalOpen && (
        <DeleteAssetModal
          asset={asset}
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onSuccess={() => router.push("/assets")}
          onSwitchToInactivate={() => {
            setDeleteModalOpen(false)
            setInactivateModalOpen(true)
          }}
        />
      )}
      {inactivateModalOpen && <InactivateAssetModal asset={asset} isOpen={inactivateModalOpen} onClose={() => setInactivateModalOpen(false)} onSuccess={fetchAsset} />}
      {optionalFieldsModalOpen && asset && (
        <AssetOptionalFieldsEditModal
          open={optionalFieldsModalOpen}
          onClose={() => setOptionalFieldsModalOpen(false)}
          onSuccess={fetchAsset}
          asset={asset}
        />
      )}
    </div>
  )
}
