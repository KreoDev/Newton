"use client"

import { useState } from "react"
import { MapPin, Edit, ToggleLeft, ToggleRight, Trash2, FileText } from "lucide-react"
import type { Site } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SiteFormModal } from "@/components/sites/SiteFormModal"
import { SEARCH_CONFIGS } from "@/config/search-configs"
import { PERMISSIONS } from "@/lib/permissions"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"
import { useSimpleModalState } from "@/hooks/useModalState"
import { useEntityList } from "@/hooks/useEntityList"
import { useEntityActions } from "@/hooks/useEntityActions"
import { EntityListPage } from "@/components/ui/entity-list/EntityListPage"
import { EntityCardListView } from "@/components/ui/entity-card-list/EntityCardListView"
import { EntityCardSearchBar } from "@/components/ui/entity-card-list/EntityCardSearchBar"
import { EntityCard } from "@/components/ui/entity-card-list/EntityCard"

export default function SitesPage() {
  useSignals() // Required for reactivity

  const { showCreateModal, setShowCreateModal, editingEntity: editingSite, setEditingEntity: setEditingSite } = useSimpleModalState<Site>()
  const [filterType, setFilterType] = useState<string>("all")

  // Get sites from centralized data service
  const sites = globalData.sites.value
  const loading = globalData.loading.value

  // Use entity list hook (but we'll use custom filtering for siteType)
  const {
    canView,
    canManage,
    isViewOnly,
    permissionLoading,
    searchTerm,
    setSearchTerm,
    isSearching,
    filteredItems: searchedSites,
  } = useEntityList({
    items: sites,
    searchConfig: SEARCH_CONFIGS.sites,
    viewPermission: PERMISSIONS.ADMIN_SITES_VIEW,
    managePermission: PERMISSIONS.ADMIN_SITES,
    globalDataLoading: loading,
  })

  // Custom filter by siteType (not status)
  const filteredSites = searchedSites.filter((site) => {
    if (filterType === "all") return true
    return site.siteType === filterType
  })

  // Use entity actions hook
  const { toggleStatus, deleteEntity } = useEntityActions({
    collection: "sites",
    entityName: "Site",
    usageCheckQuery: async (site) => {
      const ordersQuery1 = query(collection(db, "orders"), where("collectionSiteId", "==", site.id))
      const ordersQuery2 = query(collection(db, "orders"), where("destinationSiteId", "==", site.id))

      const [ordersSnapshot1, ordersSnapshot2] = await Promise.all([getDocs(ordersQuery1), getDocs(ordersQuery2)])

      const count = ordersSnapshot1.size + ordersSnapshot2.size
      const hasOrders = count > 0

      return {
        inUse: hasOrders,
        count,
        message: `This site cannot be deleted because it has ${count} order${count > 1 ? "s" : ""} associated with it. You can deactivate the site instead to prevent it from being used in new orders.`,
      }
    },
    canManage,
  })

  return (
    <EntityListPage
      title="Sites"
      description={(isViewOnly) => (isViewOnly ? "View collection and destination sites" : "Manage collection and destination sites")}
      addButtonLabel="Add Site"
      onAddClick={() => setShowCreateModal(true)}
      canView={canView}
      canManage={canManage}
      isViewOnly={isViewOnly}
      permissionLoading={permissionLoading}
    >
      <EntityCardListView
        items={filteredSites}
        loading={loading}
        isSearching={isSearching}
        emptyMessage="No sites found"
        loadingMessage="Loading sites..."
        searchBar={
          <EntityCardSearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by name or address..."
            filterValue={filterType}
            onFilterChange={setFilterType}
            filterOptions={[
              { label: "All Types", value: "all" },
              { label: "Collection", value: "collection" },
              { label: "Destination", value: "destination" },
            ]}
            filterLabel="All Types"
          />
        }
        renderCard={(site) => (
          <EntityCard
            icon={<MapPin className="h-5 w-5 text-primary" />}
            title={
              <div className="flex items-center gap-2">
                <span>{site.name}</span>
                <Badge variant={site.siteType === "collection" ? "default" : "secondary"}>{site.siteType}</Badge>
              </div>
            }
            subtitle={site.physicalAddress}
            metadata={
              site.mainContactId
                ? [
                    site.secondaryContactIds && site.secondaryContactIds.length > 0
                      ? `${site.secondaryContactIds.length + 1} contact(s) assigned`
                      : "1 contact assigned",
                  ]
                : undefined
            }
            statusBadge={<Badge variant={site.isActive ? "success" : "secondary"}>{site.isActive ? "Active" : "Inactive"}</Badge>}
            actions={
              <>
                {canManage ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => toggleStatus(site)} title={site.isActive ? "Deactivate site" : "Activate site"}>
                      {site.isActive ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingSite(site)} title="Edit site">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteEntity(site)} title="Delete site">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                ) : isViewOnly ? (
                  <Button variant="ghost" size="sm" onClick={() => setEditingSite(site)} title="View site details">
                    <FileText className="h-4 w-4" />
                  </Button>
                ) : null}
              </>
            }
          />
        )}
      />

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
    </EntityListPage>
  )
}
