"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Asset } from "@/types"
import { Truck, Users } from "lucide-react"
import Link from "next/link"

interface AssetListModalProps {
  open: boolean
  onClose: () => void
  assets: Asset[]
  field: "fleetNumber" | "group"
  fieldLabel: string
  onBulkRemove: () => Promise<void>
}

export function AssetListModal({ open, onClose, assets, field, fieldLabel, onBulkRemove }: AssetListModalProps) {
  const [loading, setLoading] = useState(false)

  const handleBulkRemove = async () => {
    try {
      setLoading(true)
      await onBulkRemove()
      onClose()
    } catch (error) {
      console.error("Error during bulk removal:", error)
    } finally {
      setLoading(false)
    }
  }

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "truck":
        return <Truck className="h-4 w-4" />
      case "trailer":
        return <Truck className="h-4 w-4" /> // Use Truck icon for trailers
      case "driver":
        return <Users className="h-4 w-4" />
      default:
        return null
    }
  }

  const getAssetLabel = (asset: Asset) => {
    if (asset.type === "driver") {
      return `${asset.name} ${asset.surname} (${asset.idNumber})`
    }
    return `${asset.registration} - ${asset.make} ${asset.model}`
  }

  const getFieldValue = (asset: Asset) => {
    if (field === "fleetNumber") {
      return asset.fleetNumber || "N/A"
    }
    return asset.groupId || "N/A"
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Assets Using {fieldLabel}</DialogTitle>
          <DialogDescription>
            The following {assets.length} asset{assets.length !== 1 ? "s are" : " is"} currently using {fieldLabel.toLowerCase()}.
            You must remove {fieldLabel.toLowerCase()} from these assets before disabling this feature.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="h-[300px] w-full rounded-md border p-4 overflow-y-auto">
            <div className="space-y-2">
              {assets.map(asset => (
                <Link
                  key={asset.id}
                  href={`/assets/${asset.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => onClose()}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                      {getAssetIcon(asset.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{getAssetLabel(asset)}</p>
                      <p className="text-xs text-muted-foreground">
                        {fieldLabel}: <span className="font-medium">{getFieldValue(asset)}</span>
                      </p>
                    </div>
                    <Badge variant={asset.isActive ? "default" : "secondary"}>
                      {asset.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">What would you like to do?</p>
            <p className="text-xs text-muted-foreground mb-3">
              You can either remove {fieldLabel.toLowerCase()} from all assets automatically, or manage them manually.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                variant="destructive"
                onClick={handleBulkRemove}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Removing..." : `Remove ${fieldLabel} from all ${assets.length} asset${assets.length !== 1 ? "s" : ""} and disable feature`}
              </Button>
              <Button variant="outline" onClick={onClose} disabled={loading} className="w-full">
                I&apos;ll remove them manually
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Tip: Click on any asset above to edit it manually, or use the bulk removal option to clear all at once.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
