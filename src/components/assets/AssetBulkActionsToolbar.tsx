"use client"

import { useState } from "react"
import type { Asset } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, CheckCircle, XCircle, Hash, FolderTree } from "lucide-react"
import { updateDocument } from "@/lib/firebase-utils"
import { useAlert } from "@/hooks/useAlert"
import { useCompany } from "@/contexts/CompanyContext"
import { useSignals } from "@preact/signals-react/runtime"
import { InactivateAssetModal } from "./InactivateAssetModal"
import { BulkFleetNumberModal } from "./BulkFleetNumberModal"
import { BulkGroupModal } from "./BulkGroupModal"

interface AssetBulkActionsToolbarProps {
  selectedAssets: Asset[]
  onClearSelection: () => void
  assetType: "truck" | "trailer" | "driver"
}

export function AssetBulkActionsToolbar({
  selectedAssets,
  onClearSelection,
  assetType,
}: AssetBulkActionsToolbarProps) {
  useSignals()
  const { company } = useCompany()
  const { showSuccess, showError, showConfirm } = useAlert()
  const [loading, setLoading] = useState(false)
  const [inactivateModalOpen, setInactivateModalOpen] = useState(false)
  const [assetsToInactivate, setAssetsToInactivate] = useState<Asset[]>([])
  const [fleetNumberModalOpen, setFleetNumberModalOpen] = useState(false)
  const [groupModalOpen, setGroupModalOpen] = useState(false)

  const activeCount = selectedAssets.filter(a => a.isActive).length
  const inactiveCount = selectedAssets.length - activeCount

  // Check if bulk actions should be shown based on asset type and company settings
  const showFleetNumberAction = assetType === "truck" && company?.systemSettings?.fleetNumberEnabled
  const showGroupAction = assetType === "truck" && company?.systemSettings?.transporterGroupEnabled

  const handleBulkActivate = async () => {
    const assetsToActivate = selectedAssets.filter(a => !a.isActive)

    if (assetsToActivate.length === 0) {
      showError("No Assets to Activate", "All selected assets are already active.")
      return
    }

    const confirmed = await showConfirm(
      "Activate Assets",
      `Are you sure you want to activate ${assetsToActivate.length} asset${assetsToActivate.length > 1 ? "s" : ""}?`,
      "Activate"
    )
    if (!confirmed) return

    setLoading(true)
    try {
      // Update each asset to active
      await Promise.all(
        assetsToActivate.map(asset =>
          updateDocument("assets", asset.id, {
            isActive: true,
            inactiveReason: "",
            inactiveDate: "",
          })
        )
      )

      showSuccess(
        "Assets Activated",
        `${assetsToActivate.length} asset${assetsToActivate.length > 1 ? "s have" : " has"} been activated.`
      )
      onClearSelection()
    } catch (error) {
      showError("Failed to Activate Assets", error instanceof Error ? error.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleBulkInactivate = () => {
    const assetsToInactivate = selectedAssets.filter(a => a.isActive)

    if (assetsToInactivate.length === 0) {
      showError("No Assets to Deactivate", "All selected assets are already inactive.")
      return
    }

    setAssetsToInactivate(assetsToInactivate)
    setInactivateModalOpen(true)
  }

  const handleInactivateSuccess = () => {
    setInactivateModalOpen(false)
    setAssetsToInactivate([])
    onClearSelection()
  }

  const handleFleetNumberSuccess = () => {
    setFleetNumberModalOpen(false)
    onClearSelection()
  }

  const handleGroupSuccess = () => {
    setGroupModalOpen(false)
    onClearSelection()
  }

  return (
    <>
      <div className="sticky top-0 z-50 glass-surface border border-[oklch(0.922_0_0_/_0.55)] rounded-lg backdrop-blur-[18px] shadow-[inset_0_1px_0_0_rgb(255_255_255_/_0.2),inset_0_-12px_30px_-24px_rgb(15_15_15_/_0.28),0_36px_80px_-36px_rgb(15_15_15_/_0.32)] p-4 mb-4 animate-in slide-in-from-top duration-200">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge variant="info" className="text-base px-3 py-1">
              {selectedAssets.length} asset{selectedAssets.length > 1 ? "s" : ""} selected
            </Badge>
            <Button variant="ghost" size="sm" onClick={onClearSelection}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {showFleetNumberAction && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFleetNumberModalOpen(true)}
                disabled={loading}
              >
                <Hash className="h-4 w-4 mr-2" />
                Update Fleet #
              </Button>
            )}

            {showGroupAction && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGroupModalOpen(true)}
                disabled={loading}
              >
                <FolderTree className="h-4 w-4 mr-2" />
                Update {company?.systemSettings?.transporterGroupLabel || "Group"}
              </Button>
            )}

            {inactiveCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkActivate}
                disabled={loading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Activate ({inactiveCount})
              </Button>
            )}

            {activeCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkInactivate}
                disabled={loading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Deactivate ({activeCount})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Inactivate Modal */}
      {assetsToInactivate.length > 0 && (
        <InactivateAssetModal
          asset={assetsToInactivate[0]}
          isOpen={inactivateModalOpen}
          onClose={() => {
            setInactivateModalOpen(false)
            setAssetsToInactivate([])
          }}
          onSuccess={handleInactivateSuccess}
          bulkAssets={assetsToInactivate}
        />
      )}

      {/* Fleet Number Modal */}
      <BulkFleetNumberModal
        selectedAssets={selectedAssets}
        isOpen={fleetNumberModalOpen}
        onClose={() => setFleetNumberModalOpen(false)}
        onSuccess={handleFleetNumberSuccess}
      />

      {/* Group Modal */}
      <BulkGroupModal
        selectedAssets={selectedAssets}
        isOpen={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        onSuccess={handleGroupSuccess}
      />
    </>
  )
}
