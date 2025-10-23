"use client"

import { Building, Edit, ToggleLeft, ToggleRight, Trash2, FileText } from "lucide-react"
import type { Client } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ClientFormModal } from "@/components/clients/ClientFormModal"
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

export default function ClientsPage() {
  useSignals() // Required for reactivity

  const { showCreateModal, setShowCreateModal, editingEntity: editingClient, setEditingEntity: setEditingClient } = useSimpleModalState<Client>()

  // Get clients from centralized data service
  const clients = globalData.clients.value
  const loading = globalData.loading.value

  // Use entity list hook
  const {
    canView,
    canManage,
    isViewOnly,
    permissionLoading,
    searchTerm,
    setSearchTerm,
    isSearching,
    filterStatus,
    setFilterStatus,
    filteredItems: filteredClients,
  } = useEntityList({
    items: clients,
    searchConfig: SEARCH_CONFIGS.clients,
    viewPermission: PERMISSIONS.ADMIN_CLIENTS_VIEW,
    managePermission: PERMISSIONS.ADMIN_CLIENTS,
    globalDataLoading: loading,
  })

  // Use entity actions hook
  const { toggleStatus, deleteEntity } = useEntityActions({
    collection: "clients",
    entityName: "Client",
    usageCheckQuery: async (client) => {
      const ordersQuery = query(collection(db, "orders"), where("clientCompanyId", "==", client.id))
      const ordersSnapshot = await getDocs(ordersQuery)
      const count = ordersSnapshot.size
      return {
        inUse: !ordersSnapshot.empty,
        count,
        message: `This client cannot be deleted because it has ${count} order${count > 1 ? "s" : ""} associated with it. You can deactivate the client instead to prevent it from being used in new orders.`,
      }
    },
    canManage,
  })

  return (
    <EntityListPage
      title="Clients"
      description={(isViewOnly) => (isViewOnly ? "View client companies and contacts" : "Manage client companies and contacts")}
      addButtonLabel="Add Client"
      onAddClick={() => setShowCreateModal(true)}
      canView={canView}
      canManage={canManage}
      isViewOnly={isViewOnly}
      permissionLoading={permissionLoading}
    >
      <EntityCardListView
        items={filteredClients}
        loading={loading}
        isSearching={isSearching}
        emptyMessage="No clients found"
        loadingMessage="Loading clients..."
        searchBar={
          <EntityCardSearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by name, registration, or contact..."
            filterValue={filterStatus}
            onFilterChange={setFilterStatus}
            filterOptions={[
              { label: "All Status", value: "all" },
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
            filterLabel="All Status"
          />
        }
        renderCard={(client) => (
          <EntityCard
            icon={<Building className="h-5 w-5 text-primary" />}
            title={client.name}
            subtitle={client.registrationNumber + (client.vatNumber ? ` • VAT: ${client.vatNumber}` : "")}
            metadata={[client.contactName, client.contactEmail, client.contactPhone]}
            statusBadge={<Badge variant={client.isActive ? "success" : "secondary"}>{client.isActive ? "Active" : "Inactive"}</Badge>}
            actions={
              <>
                {canManage ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => toggleStatus(client)} title={client.isActive ? "Deactivate client" : "Activate client"}>
                      {client.isActive ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingClient(client)} title="Edit client">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteEntity(client)} title="Delete client">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                ) : isViewOnly ? (
                  <Button variant="ghost" size="sm" onClick={() => setEditingClient(client)} title="View client details">
                    <FileText className="h-4 w-4" />
                  </Button>
                ) : null}
              </>
            }
          />
        )}
      />

      {showCreateModal && <ClientFormModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={() => setShowCreateModal(false)} />}

      {editingClient && (
        <ClientFormModal
          open={Boolean(editingClient)}
          onClose={() => setEditingClient(undefined)}
          onSuccess={() => setEditingClient(undefined)}
          client={editingClient}
          viewOnly={isViewOnly}
        />
      )}
    </EntityListPage>
  )
}
