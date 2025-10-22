"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useCompany } from "@/contexts/CompanyContext"
import { usePermission } from "@/hooks/usePermission"
import { useAssetViewPreference } from "@/hooks/useAssetViewPreference"
import { PERMISSIONS } from "@/lib/permissions"
import { useSignals } from "@preact/signals-react/runtime"
import { data as globalData } from "@/services/data.service"
import { Button } from "@/components/ui/button"
import { Plus, LayoutGrid, Table } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AssetsCardView } from "@/components/assets/AssetsCardView"
import { AssetsTableView } from "@/components/assets/AssetsTableView"

export default function AssetsPage() {
  useSignals()
  const { user } = useAuth()
  const { company } = useCompany()
  const router = useRouter()
  const assets = globalData.assets.value
  const loading = globalData.loading.value
  const { view, updateView } = useAssetViewPreference()

  // Permission checks for assets
  const { hasPermission: canAddAssets } = usePermission(PERMISSIONS.ASSETS_ADD)

  // Redirect if company cannot access assets
  useEffect(() => {
    if (!company) return

    const canAccessAssets =
      company.companyType === "transporter" ||
      (company.companyType === "logistics_coordinator" && company.isAlsoTransporter === true)

    if (!canAccessAssets) {
      router.replace("/")
    }
  }, [company, router])

  const handleToggleView = () => {
    const newView = view === "card" ? "table" : "card"
    updateView(newView)
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
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleView}
            title={`Switch to ${view === "card" ? "table" : "card"} view`}
          >
            {view === "card" ? (
              <>
                <Table className="mr-2 h-4 w-4" />
                Table View
              </>
            ) : (
              <>
                <LayoutGrid className="mr-2 h-4 w-4" />
                Card View
              </>
            )}
          </Button>
          {canAddAssets && (
            <Button asChild>
              <Link href="/assets/induct">
                <Plus className="mr-2 h-4 w-4" />
                Induct Asset
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Conditional View Rendering */}
      {view === "card" ? (
        <AssetsCardView assets={assets} loading={loading} />
      ) : (
        <AssetsTableView assets={assets} loading={loading} />
      )}
    </div>
  )
}
