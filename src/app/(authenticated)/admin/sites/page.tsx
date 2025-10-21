"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useViewPermission } from "@/hooks/useViewPermission"
import { PERMISSIONS } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ViewOnlyBadge } from "@/components/ui/view-only-badge"
import { Plus, Search, MapPin, Edit, ToggleLeft, ToggleRight, Trash2, FileText } from "lucide-react"
import type { Site } from "@/types"
import { useAlert } from "@/hooks/useAlert"
import { SiteFormModal } from "@/components/sites/SiteFormModal"
import { useOptimizedSearch } from "@/hooks/useOptimizedSearch"
import { SEARCH_CONFIGS } from "@/config/search-configs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { updateDocument, deleteDocument } from "@/lib/firebase-utils"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"

export default function SitesPage() {
  useSignals() // Required for reactivity
  const { user } = useAuth()
  const { canView, canManage, isViewOnly, loading: permissionLoading } = useViewPermission(
    PERMISSIONS.ADMIN_SITES_VIEW,
    PERMISSIONS.ADMIN_SITES
  )
  const { showSuccess, showError, showConfirm } = useAlert()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSite, setEditingSite] = useState<Site | undefined>(undefined)
  const [filterType, setFilterType] = useState<string>("all")

  // Get sites from centralized data service
  const sites = globalData.sites.value
  const loading = globalData.loading.value

  const { searchTerm, setSearchTerm, filteredItems: searchedSites, isSearching } = useOptimizedSearch(sites, SEARCH_CONFIGS.sites)

  const filteredSites = searchedSites.filter(site => {
    if (filterType === "all") return true
    return site.siteType === filterType
  })

  const toggleSiteStatus = async (site: Site) => {
    try {
      await updateDocument("sites", site.id, {
        isActive: !site.isActive,
      })
      showSuccess(
        `Site ${site.isActive ? "Deactivated" : "Activated"}`,
        `${site.name} has been ${site.isActive ? "deactivated" : "activated"} successfully.`
      )
    } catch (error) {
      console.error("Error toggling site status:", error)
      showError("Failed to Update Site", error instanceof Error ? error.message : "An unexpected error occurred.")
    }
  }

  const handleDeleteClick = async (site: Site) => {
    try {
      // Check if site is used in any orders (as collection or destination)
      const ordersQuery1 = query(collection(db, "orders"), where("collectionSiteId", "==", site.id))
      const ordersQuery2 = query(collection(db, "orders"), where("destinationSiteId", "==", site.id))

      const [ordersSnapshot1, ordersSnapshot2] = await Promise.all([
        getDocs(ordersQuery1),
        getDocs(ordersQuery2)
      ])

      const hasOrders = !ordersSnapshot1.empty || !ordersSnapshot2.empty
      const orderCount = ordersSnapshot1.size + ordersSnapshot2.size

      if (hasOrders) {
        showError(
          "Cannot Delete Site",
          `This site cannot be deleted because it has ${orderCount} order${orderCount > 1 ? 's' : ''} associated with it. You can deactivate the site instead to prevent it from being used in new orders.`
        )
        return
      }

      showConfirm(
        "Delete Site",
        `Are you sure you want to delete "${site.name}"? This action cannot be undone.`,
        async () => {
          try {
            await deleteDocument("sites", site.id, "Site deleted successfully")
          } catch (error) {
            console.error("Error deleting site:", error)
            showError("Failed to Delete Site", error instanceof Error ? error.message : "An unexpected error occurred.")
          }
        },
        undefined,
        "Delete",
        "Cancel"
      )
    } catch (error) {
      console.error("Error checking site usage:", error)
      showError("Error", "Failed to check if site can be deleted. Please try again.")
    }
  }

  if (permissionLoading) {
    return <LoadingSpinner fullScreen message="Checking permissions..." />
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">You don&apos;t have permission to view sites.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sites</h1>
            <p className="text-muted-foreground">
              {isViewOnly ? "View collection and destination sites" : "Manage collection and destination sites"}
            </p>
          </div>
          {isViewOnly && <ViewOnlyBadge />}
        </div>
        {canManage && (
          <Button variant="outline" onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Site
          </Button>
        )}
      </div>

      <Card className="glass-surface">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or address..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border rounded-md px-3 py-2 bg-background/60 backdrop-blur-md">
              <option value="all">All Types</option>
              <option value="collection">Collection</option>
              <option value="destination">Destination</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {(loading || isSearching) ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" message={loading ? "Loading sites..." : "Searching..."} />
            </div>
          ) : filteredSites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No sites found</div>
          ) : (
            <div className="space-y-4">
              {filteredSites.map(site => (
                <div key={site.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors backdrop-blur-sm">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{site.name}</h3>
                        <Badge variant={site.siteType === "collection" ? "default" : "secondary"}>
                          {site.siteType}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{site.physicalAddress}</p>
                      {site.mainContactId && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {site.secondaryContactIds && site.secondaryContactIds.length > 0
                            ? `${site.secondaryContactIds.length + 1} contact(s) assigned`
                            : "1 contact assigned"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManage ? (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => toggleSiteStatus(site)} title={site.isActive ? "Deactivate site" : "Activate site"}>
                          {site.isActive ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingSite(site)} title="Edit site">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(site)} title="Delete site">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    ) : isViewOnly ? (
                      <Button variant="ghost" size="sm" onClick={() => setEditingSite(site)} title="View site details">
                        <FileText className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Badge variant={site.isActive ? "success" : "secondary"}>{site.isActive ? "Active" : "Inactive"}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showCreateModal && <SiteFormModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={() => setShowCreateModal(false)} />}

      {editingSite && (
        <SiteFormModal
          open={Boolean(editingSite)}
          onClose={() => setEditingSite(undefined)}
          onSuccess={() => setEditingSite(undefined)}
          site={editingSite}
          viewOnly={isViewOnly}
        />
      )}
    </div>
  )
}
