"use client"

import { useState, useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useSignals } from "@preact/signals-react/runtime"
import { data as globalData } from "@/services/data.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Truck, X, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AssetFieldMapper } from "@/lib/asset-field-mappings"
import type { Asset } from "@/types"

export default function AssetsPage() {
  useSignals()
  const { user } = useAuth()
  const assets = globalData.assets.value
  const groups = globalData.groups.value
  const loading = globalData.loading.value

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "truck" | "trailer" | "driver">("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "expired">("all")

  // Helper function to get group name from groupId
  // For transporter companies: groupId is the group name itself (string from groupOptions)
  // For mine companies: groupId is a reference to a Groups document
  const getGroupName = (asset: Asset) => {
    const groupId = asset.groupId
    if (!groupId) return null

    // First, try to find in Groups collection (for mine companies)
    const group = groups.find(g => g.id === groupId)
    if (group) return group.name

    // If not found in Groups collection, it's likely a transporter company
    // where groupId is the group name itself (from systemSettings.groupOptions)
    // Just return the groupId as the group name
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
      filtered = filtered.filter(asset => asset.registration?.toLowerCase().includes(term) || asset.licenceNumber?.toLowerCase().includes(term) || asset.ntCode?.toLowerCase().includes(term) || asset.fleetNumber?.toLowerCase().includes(term) || asset.name?.toLowerCase().includes(term) || asset.surname?.toLowerCase().includes(term))
    }

    return filtered
  }, [assets, filterType, filterStatus, searchTerm])

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
        {expiryInfo.status === "expired" ? "Expired" : `${expiryInfo.daysUntilExpiry}d left`}
      </Badge>
    )
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Please log in to view assets</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground">Manage trucks, trailers, and drivers</p>
        </div>
        <Link href="/assets/induct">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Induct Asset
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by registration, license, newton QR code, or fleet number..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="flex gap-2">
            <span className="text-sm text-muted-foreground self-center">Type:</span>
            {["all", "truck", "trailer", "driver"].map(type => (
              <Button key={type} variant={filterType === type ? "default" : "outline"} size="sm" onClick={() => setFilterType(type as typeof filterType)}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <span className="text-sm text-muted-foreground self-center">Status:</span>
            {["all", "active", "inactive", "expired"].map(status => (
              <Button key={status} variant={filterStatus === status ? "default" : "outline"} size="sm" onClick={() => setFilterStatus(status as typeof filterStatus)}>
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading assets...</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Truck className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">No assets found</p>
                <p className="text-sm text-muted-foreground">{searchTerm || filterType !== "all" || filterStatus !== "all" ? "Try adjusting your filters" : "Get started by inducting your first asset"}</p>
              </div>
              {!searchTerm && filterType === "all" && filterStatus === "all" && (
                <Link href="/assets/induct">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Induct Asset
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAssets.map(asset => (
                <div key={asset.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  {/* Icon/Avatar */}
                  <div className="flex-shrink-0">{getAssetIcon(asset)}</div>

                  {/* Info */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{getAssetIdentifier(asset)}</span>
                      {asset.fleetNumber && <Badge variant="secondary">Fleet: {asset.fleetNumber}</Badge>}
                      {getGroupName(asset) && <Badge variant="purple">Group: {getGroupName(asset)}</Badge>}
                      {!asset.isActive && <Badge variant="destructive">Inactive</Badge>}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="capitalize">{asset.type}</span>
                      <span>Newton QR: {asset.ntCode}</span>
                      {asset.licenseExpiryDate && <span>Expires: {asset.licenseExpiryDate}</span>}
                    </div>
                  </div>

                  {/* Expiry Badge */}
                  <div>{getExpiryBadge(asset.licenseExpiryDate)}</div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/assets/${asset.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
