"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import type { Asset } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Truck, TruckIcon as Trailer, User } from "lucide-react"
import { DataTable } from "@/components/ui/data-table/DataTable"
import { AssetBulkActionsToolbar } from "./AssetBulkActionsToolbar"
import { DeleteAssetModal } from "./DeleteAssetModal"
import { InactivateAssetModal } from "./InactivateAssetModal"
import { getTruckColumns } from "./column-definitions/truckColumns"
import { getTrailerColumns } from "./column-definitions/trailerColumns"
import { getDriverColumns } from "./column-definitions/driverColumns"
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"

interface AssetsTableViewProps {
  assets: Asset[]
  loading: boolean
}

export function AssetsTableView({ assets, loading }: AssetsTableViewProps) {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<"truck" | "trailer" | "driver">("truck")
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([])
  const [tableKey, setTableKey] = useState(0) // Key to force re-render and clear selection

  // Modal states
  const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null)
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null)
  const [assetToInactivate, setAssetToInactivate] = useState<Asset | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [inactivateModalOpen, setInactivateModalOpen] = useState(false)

  // Permission checks
  const { hasPermission: canEdit } = usePermission(PERMISSIONS.ASSETS_EDIT)
  const { hasPermission: canDelete } = usePermission(PERMISSIONS.ASSETS_DELETE)

  // Filter assets by selected type
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => asset.type === selectedType)
  }, [assets, selectedType])

  // Handlers for column actions
  const handleView = (asset: Asset) => {
    router.push(`/assets/${asset.id}`)
  }

  const handleEdit = (asset: Asset) => {
    // Navigate to edit page or open edit modal
    router.push(`/assets/${asset.id}`)
  }

  const handleDelete = (asset: Asset) => {
    setAssetToDelete(asset)
    setDeleteModalOpen(true)
  }

  const handleInactivate = (asset: Asset) => {
    setAssetToInactivate(asset)
    setInactivateModalOpen(true)
  }

  // Get columns based on selected type
  const columns = useMemo(() => {
    switch (selectedType) {
      case "truck":
        return getTruckColumns(canEdit, canDelete, handleView, handleEdit, handleDelete, handleInactivate)
      case "trailer":
        return getTrailerColumns(canEdit, canDelete, handleView, handleEdit, handleDelete, handleInactivate)
      case "driver":
        return getDriverColumns(canEdit, canDelete, handleView, handleEdit, handleDelete, handleInactivate)
    }
  }, [selectedType, canEdit, canDelete])

  const handleClearSelection = () => {
    setSelectedAssets([])
    setTableKey((prev) => prev + 1) // Force re-render to clear table selection
  }

  const handleBulkActionSuccess = () => {
    handleClearSelection()
    // Data will refresh automatically via real-time listeners in data.service.ts
  }

  // When switching tabs, clear selection
  const handleTabChange = (value: string) => {
    setSelectedType(value as "truck" | "trailer" | "driver")
    handleClearSelection()
  }

  // Get asset type counts
  const truckCount = assets.filter(a => a.type === "truck").length
  const trailerCount = assets.filter(a => a.type === "trailer").length
  const driverCount = assets.filter(a => a.type === "driver").length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading assets...</p>
      </div>
    )
  }

  return (
    <>
      <Tabs value={selectedType} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="truck" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <span>Trucks</span>
            <span className="ml-1 text-xs text-muted-foreground">({truckCount})</span>
          </TabsTrigger>
          <TabsTrigger value="trailer" className="flex items-center gap-2">
            <Trailer className="h-4 w-4" />
            <span>Trailers</span>
            <span className="ml-1 text-xs text-muted-foreground">({trailerCount})</span>
          </TabsTrigger>
          <TabsTrigger value="driver" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Drivers</span>
            <span className="ml-1 text-xs text-muted-foreground">({driverCount})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="truck" className="space-y-4">
          <AssetBulkActionsToolbar
            selectedAssets={selectedAssets}
            onClearSelection={handleClearSelection}
            assetType="truck"
          />

          <DataTable
            key={`truck-${tableKey}`}
            tableId="assets-trucks-table"
            columns={columns}
            data={filteredAssets}
            defaultColumnOrder={["select", "icon", "registration", "fleetNumber", "group", "makeModel", "status", "expiryDate", "actions"]}
            defaultPageSize={20}
            searchPlaceholder="Search trucks by registration, fleet number, VIN..."
            enablePagination={true}
            enableRowSelection={true}
            enableColumnResizing={true}
            enableExport={true}
            onRowSelectionChange={(selectedRows) => {
              setSelectedAssets(selectedRows)
            }}
          />
        </TabsContent>

        <TabsContent value="trailer" className="space-y-4">
          <AssetBulkActionsToolbar
            selectedAssets={selectedAssets}
            onClearSelection={handleClearSelection}
            assetType="trailer"
          />

          <DataTable
            key={`trailer-${tableKey}`}
            tableId="assets-trailers-table"
            columns={columns}
            data={filteredAssets}
            defaultColumnOrder={["select", "icon", "registration", "fleetNumber", "group", "makeModel", "status", "expiryDate", "actions"]}
            defaultPageSize={20}
            searchPlaceholder="Search trailers by registration, fleet number, VIN..."
            enablePagination={true}
            enableRowSelection={true}
            enableColumnResizing={true}
            enableExport={true}
            onRowSelectionChange={(selectedRows) => {
              setSelectedAssets(selectedRows)
            }}
          />
        </TabsContent>

        <TabsContent value="driver" className="space-y-4">
          <AssetBulkActionsToolbar
            selectedAssets={selectedAssets}
            onClearSelection={handleClearSelection}
            assetType="driver"
          />

          <DataTable
            key={`driver-${tableKey}`}
            tableId="assets-drivers-table"
            columns={columns}
            data={filteredAssets}
            defaultColumnOrder={["select", "photo", "name", "idNumber", "licenceNumber", "licenceType", "group", "status", "expiryDate", "actions"]}
            defaultPageSize={20}
            searchPlaceholder="Search drivers by name, ID number, license number..."
            enablePagination={true}
            enableRowSelection={true}
            enableColumnResizing={true}
            enableExport={true}
            onRowSelectionChange={(selectedRows) => {
              setSelectedAssets(selectedRows)
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Delete Modal */}
      {assetToDelete && (
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
            handleBulkActionSuccess()
          }}
          onSwitchToInactivate={() => {
            setDeleteModalOpen(false)
            setInactivateModalOpen(true)
            setAssetToInactivate(assetToDelete)
          }}
        />
      )}

      {/* Inactivate Modal */}
      {assetToInactivate && (
        <InactivateAssetModal
          asset={assetToInactivate}
          isOpen={inactivateModalOpen}
          onClose={() => {
            setInactivateModalOpen(false)
            setAssetToInactivate(null)
          }}
          onSuccess={() => {
            setInactivateModalOpen(false)
            setAssetToInactivate(null)
            handleBulkActionSuccess()
          }}
        />
      )}
    </>
  )
}
