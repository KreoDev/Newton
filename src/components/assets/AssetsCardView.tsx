"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import type { Asset } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Truck, Search, X, User, FileText, Trash2 } from "lucide-react"
import Image from "next/image"
import { AssetFieldMapper } from "@/lib/asset-field-mappings"
import { DeleteAssetModal } from "./DeleteAssetModal"
import { InactivateAssetModal } from "./InactivateAssetModal"
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"

interface AssetsCardViewProps {
  assets: Asset[]
  loading: boolean
}

export function AssetsCardView({ assets, loading }: AssetsCardViewProps) {
  useSignals()
  const router = useRouter()
  const groups = globalData.groups.value

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "truck" | "trailer" | "driver">("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "expired">("all")
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [inactivateModalOpen, setInactivateModalOpen] = useState(false)

  // Permission checks
  const { hasPermission: canDelete } = usePermission(PERMISSIONS.ASSETS_DELETE)

  // Helper function to get group name from groupId
  const getGroupName = (asset: Asset) => {
    const groupId = asset.groupId
    if (!groupId) return null

    const group = groups.find(g => g.id === groupId)
    if (group) return group.name

    return groupId
  }

  // Filter and search assets
  const filteredAssets = useMemo(() => {
    let filtered = assets

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(asset => asset.type === filterType)
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(asset => {
        if (filterStatus === "active") return asset.isActive
        if (filterStatus === "inactive") return !asset.isActive

        if (filterStatus === "expired" && asset.licenseExpiryDate) {
          const expiryInfo = AssetFieldMapper.getExpiryInfo(asset.licenseExpiryDate)
          return expiryInfo.status === "expired"
        }

        return true
      })
    }

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(asset =>
        asset.registration?.toLowerCase().includes(term) ||
        asset.licenceNumber?.toLowerCase().includes(term) ||
        asset.ntCode?.toLowerCase().includes(term) ||
        asset.fleetNumber?.toLowerCase().includes(term) ||
        asset.name?.toLowerCase().includes(term) ||
        asset.surname?.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [assets, filterType, filterStatus, searchTerm])

  const getStatusBadge = (asset: Asset) => {
    if (!asset.isActive) {
      return <Badge variant="secondary">Inactive</Badge>
    }

    if (asset.licenseExpiryDate) {
      const expiryInfo = AssetFieldMapper.getExpiryInfo(asset.licenseExpiryDate)

      if (expiryInfo.status === "expired") {
        return <Badge variant="destructive">Expired</Badge>
      }
    }

    return <Badge variant="success">Active</Badge>
  }

  const getAssetIcon = (asset: Asset) => {
    // For drivers, show their photo if available
    if (asset.type === "driver" && asset.img) {
      return (
        <div className="h-10 w-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
          <Image src={asset.img} alt="Driver photo" width={40} height={40} className="h-full w-full object-cover" />
        </div>
      )
    }

    // For drivers without photo or other asset types, show emoji/icon
    if (asset.type === "driver") {
      return (
        <div className="h-10 w-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>
      )
    }

    // For vehicles, show emoji
    switch (asset.type) {
      case "truck":
        return <div className="text-3xl">🚚</div>
      case "trailer":
        return <div className="text-3xl">🚛</div>
      default:
        return <div className="text-3xl">📦</div>
    }
  }

  const getAssetIdentifier = (asset: Asset) => {
    if (asset.type === "driver") {
      const driverName = asset.name && asset.surname
        ? `${asset.initials || asset.name} ${asset.surname}`
        : asset.surname || asset.name || ""
      const license = asset.licenceNumber || ""

      if (driverName && license) {
        return `${driverName} (${license})`
      } else if (driverName) {
        return driverName
      } else if (license) {
        return license
      }
      return "No License"
    }
    return asset.registration || "No Registration"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading assets...</p>
      </div>
    )
  }

  return (
    <>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by registration, license, newton QR code, or fleet number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="flex gap-2">
            <span className="text-sm text-muted-foreground self-center">Type:</span>
            {["all", "truck", "trailer", "driver"].map(type => (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType(type as typeof filterType)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <span className="text-sm text-muted-foreground self-center">Status:</span>
            {["all", "active", "inactive", "expired"].map(status => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(status as typeof filterStatus)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assets List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Assets ({filteredAssets.length}
            {filteredAssets.length !== assets.length && ` of ${assets.length}`})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Truck className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">No assets found</p>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || filterType !== "all" || filterStatus !== "all"
                    ? "Try adjusting your filters"
                    : "Get started by inducting your first asset"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssets.map(asset => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors backdrop-blur-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">{getAssetIcon(asset)}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{getAssetIdentifier(asset)}</h3>
                        {asset.fleetNumber && <Badge variant="secondary">Fleet: {asset.fleetNumber}</Badge>}
                        {getGroupName(asset) && <Badge variant="purple">Group: {getGroupName(asset)}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {asset.type.charAt(0).toUpperCase() + asset.type.slice(1)} • Newton QR: {asset.ntCode}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/assets/${asset.id}`)}
                      title="View asset details"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAssetToDelete(asset)
                          setDeleteModalOpen(true)
                        }}
                        title="Delete asset"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                    {getStatusBadge(asset)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Modal */}
      {assetToDelete && deleteModalOpen && (
        <DeleteAssetModal
          asset={assetToDelete}
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false)
            setAssetToDelete(null)
          }}
          onSuccess={() => {
            setDeleteModalOpen(false)
            setAssetToDelete(null)
          }}
          onSwitchToInactivate={() => {
            setDeleteModalOpen(false)
            setInactivateModalOpen(true)
          }}
        />
      )}

      {/* Inactivate Modal */}
      {assetToDelete && inactivateModalOpen && (
        <InactivateAssetModal
          asset={assetToDelete}
          isOpen={inactivateModalOpen}
          onClose={() => {
            setInactivateModalOpen(false)
            setAssetToDelete(null)
          }}
          onSuccess={() => {
            setInactivateModalOpen(false)
            setAssetToDelete(null)
          }}
        />
      )}
    </>
  )
}
