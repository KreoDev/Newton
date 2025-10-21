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
import { useCompany } from "@/contexts/CompanyContext"

interface AssetsTableViewProps {
  assets: Asset[]
  loading: boolean
}

export function AssetsTableView({ assets, loading }: AssetsTableViewProps) {
  const router = useRouter()
  const { company } = useCompany()
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

  // Get columns based on selected type and company settings
  const columns = useMemo(() => {
    let baseColumns
    switch (selectedType) {
      case "truck":
        baseColumns = getTruckColumns(canEdit, canDelete, handleView, handleEdit, handleDelete, handleInactivate)
        // Filter truck columns based on company settings
        return baseColumns.filter((col) => {
          if (col.id === "fleetNumber" && !company?.systemSettings?.fleetNumberEnabled) {
            return false
          }
          if (col.id === "group" && !company?.systemSettings?.transporterGroupEnabled) {
            return false
          }
          return true
        })
      case "trailer":
        baseColumns = getTrailerColumns(canEdit, canDelete, handleView, handleEdit, handleDelete, handleInactivate)
        // Remove group and fleetNumber columns for trailers (they never have these)
        return baseColumns.filter((col) => col.id !== "group" && col.id !== "fleetNumber")
      case "driver":
        return getDriverColumns(canEdit, canDelete, handleView, handleEdit, handleDelete, handleInactivate)
    }
  }, [selectedType, canEdit, canDelete, company])

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
          {selectedAssets.length > 0 && (
            <AssetBulkActionsToolbar
              selectedAssets={selectedAssets}
              onClearSelection={handleClearSelection}
              assetType="truck"
            />
          )}

          <DataTable
            key={`truck-${tableKey}`}
            tableId="assets-trucks-table"
            columns={columns}
            data={filteredAssets}
            defaultColumnOrder={[
              "registration",
              ...(company?.systemSettings?.fleetNumberEnabled ? ["fleetNumber"] : []),
              ...(company?.systemSettings?.transporterGroupEnabled ? ["group"] : []),
              "makeModel",
              "expiryDate",
              "status",
              "actions"
            ]}
            columnOrderVersion={2}
            defaultPageSize={20}
            searchPlaceholder="Search trucks by registration, fleet number, VIN..."
            enablePagination={true}
            enableRowSelection={true}
            enableColumnResizing={true}
            enableExport={true}
            pinnedColumns={{ right: ["actions"] }}
            onRowSelectionChange={(selectedRows) => {
              setSelectedAssets(selectedRows)
            }}
          />
        </TabsContent>

        <TabsContent value="trailer" className="space-y-4">
          {selectedAssets.length > 0 && (
            <AssetBulkActionsToolbar
              selectedAssets={selectedAssets}
              onClearSelection={handleClearSelection}
              assetType="trailer"
            />
          )}

          <DataTable
            key={`trailer-${tableKey}`}
            tableId="assets-trailers-table"
            columnOrderVersion={2}
            columns={columns}
            data={filteredAssets}
            defaultColumnOrder={["registration", "makeModel", "expiryDate", "status", "actions"]}
            defaultPageSize={20}
            searchPlaceholder="Search trailers by registration, VIN..."
            enablePagination={true}
            enableRowSelection={true}
            enableColumnResizing={true}
            enableExport={true}
            pinnedColumns={{ right: ["actions"] }}
            onRowSelectionChange={(selectedRows) => {
              setSelectedAssets(selectedRows)
            }}
          />
        </TabsContent>

        <TabsContent value="driver" className="space-y-4">
          {selectedAssets.length > 0 && (
            <AssetBulkActionsToolbar
              selectedAssets={selectedAssets}
              onClearSelection={handleClearSelection}
              assetType="driver"
            />
          )}

          <DataTable
            key={`driver-${tableKey}`}
            tableId="assets-drivers-table"
            columnOrderVersion={2}
            columns={columns}
            data={filteredAssets}
            defaultColumnOrder={["photo", "name", "idNumber", "licenceNumber", "licenceType", "group", "expiryDate", "status", "actions"]}
            defaultPageSize={20}
            searchPlaceholder="Search drivers by name, ID number, license number..."
            enablePagination={true}
            enableRowSelection={true}
            enableColumnResizing={true}
            enableExport={true}
            pinnedColumns={{ right: ["actions"] }}
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
