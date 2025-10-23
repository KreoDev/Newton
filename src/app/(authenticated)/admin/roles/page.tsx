"use client"

import { Shield, Edit, ToggleLeft, ToggleRight, Trash2, Eye, EyeOff, FileText } from "lucide-react"
import type { Role } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { useAlert } from "@/hooks/useAlert"
import { RoleFormModal } from "@/components/roles/RoleFormModal"
import { SEARCH_CONFIGS } from "@/config/search-configs"
import { PERMISSIONS } from "@/lib/permissions"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { updateDocument } from "@/lib/firebase-utils"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"
import { useSimpleModalState } from "@/hooks/useModalState"
import { useEntityList } from "@/hooks/useEntityList"
import { useEntityActions } from "@/hooks/useEntityActions"
import { EntityListPage } from "@/components/ui/entity-list/EntityListPage"
import { EntityCardListView } from "@/components/ui/entity-card-list/EntityCardListView"
import { EntityCardSearchBar } from "@/components/ui/entity-card-list/EntityCardSearchBar"
import { EntityCard } from "@/components/ui/entity-card-list/EntityCard"

export default function RolesPage() {
  useSignals() // Required for reactivity
  const { user } = useAuth()
  const { showSuccess, showError } = useAlert()

  const { showCreateModal, setShowCreateModal, editingEntity: editingRole, setEditingEntity: setEditingRole } = useSimpleModalState<Role>()

  // Get roles from centralized data service (roles are GLOBAL - not company-scoped)
  const roles = globalData.roles.value
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
    filteredItems: filteredRoles,
  } = useEntityList({
    items: roles,
    searchConfig: SEARCH_CONFIGS.roles,
    viewPermission: PERMISSIONS.ADMIN_ROLES_VIEW,
    managePermission: PERMISSIONS.ADMIN_ROLES,
    globalDataLoading: loading,
  })

  // Custom toggle status for roles (with r_contact protection)
  const toggleRoleStatus = async (role: Role) => {
    if (role.id === "r_contact") {
      showError("Cannot Modify System Role", "The Contact role is a protected system role and cannot be modified.")
      return
    }

    try {
      await updateDocument("roles", role.id, {
        isActive: !role.isActive,
      })
      showSuccess(
        `Role ${role.isActive ? "Deactivated" : "Activated"}`,
        `${role.name} has been ${role.isActive ? "deactivated" : "activated"} successfully.`
      )
    } catch (error) {
      showError("Failed to Update Role", error instanceof Error ? error.message : "An unexpected error occurred.")
    }
  }

  // Toggle company visibility (unique to roles)
  const toggleCompanyVisibility = async (role: Role) => {
    if (role.id === "r_contact") {
      showError("Cannot Modify System Role", "The Contact role is a protected system role and cannot be modified.")
      return
    }

    if (!user?.companyId) {
      showError("Error", "Cannot toggle visibility: No active company selected.")
      return
    }

    try {
      const currentHiddenCompanies = role.hiddenForCompanies || []
      const isCurrentlyHidden = currentHiddenCompanies.includes(user.companyId)

      const updatedHiddenCompanies = isCurrentlyHidden
        ? currentHiddenCompanies.filter((id) => id !== user.companyId)
        : [...currentHiddenCompanies, user.companyId]

      await updateDocument("roles", role.id, {
        hiddenForCompanies: updatedHiddenCompanies,
      })

      showSuccess(`Role Visibility Updated`, `${role.name} is now ${isCurrentlyHidden ? "visible" : "hidden"} for your company.`)
    } catch (error) {
      showError("Failed to Update Visibility", error instanceof Error ? error.message : "An unexpected error occurred.")
    }
  }

  // Use entity actions hook (only for delete)
  const { deleteEntity } = useEntityActions({
    collection: "roles",
    entityName: "Role",
    usageCheckQuery: async (role) => {
      const usersQuery = query(collection(db, "users"), where("roleId", "==", role.id))
      const usersSnapshot = await getDocs(usersQuery)
      const count = usersSnapshot.size
      return {
        inUse: !usersSnapshot.empty,
        count,
        message: `This role cannot be deleted because it is assigned to ${count} user${count > 1 ? "s" : ""}. You can deactivate the role instead to prevent it from being assigned to new users.`,
      }
    },
    onDeleteValidation: async (role) => {
      if (role.id === "r_contact") {
        return {
          allowed: false,
          reason: "The Contact role is a protected system role and cannot be deleted.",
        }
      }
      return { allowed: true }
    },
    canManage,
  })

  return (
    <EntityListPage
      title="Roles"
      description={(isViewOnly) => (isViewOnly ? "View user roles and permissions" : "Manage user roles and permissions")}
      addButtonLabel="Add Role"
      onAddClick={() => setShowCreateModal(true)}
      canView={canView}
      canManage={canManage}
      isViewOnly={isViewOnly}
      permissionLoading={permissionLoading}
    >
      <EntityCardListView
        items={filteredRoles}
        loading={loading}
        isSearching={isSearching}
        emptyMessage="No roles found"
        loadingMessage="Loading roles..."
        searchBar={
          <EntityCardSearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by name or description..."
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
        renderCard={(role) => (
          <EntityCard
            icon={<Shield className="h-5 w-5 text-primary" />}
            title={
              <div className="flex items-center gap-2">
                <span>{role.name}</span>
                {role.id === "r_contact" && (
                  <Badge variant="info" className="text-xs">
                    System Role
                  </Badge>
                )}
              </div>
            }
            subtitle={role.description || "No description"}
            metadata={[`${role.permissionKeys?.length || 0} permission(s)`]}
            statusBadge={<Badge variant={role.isActive ? "success" : "secondary"}>{role.isActive ? "Active" : "Inactive"}</Badge>}
            actions={
              <>
                {canManage ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRoleStatus(role)}
                      title={role.id === "r_contact" ? "System role cannot be modified" : role.isActive ? "Deactivate role globally" : "Activate role globally"}
                      disabled={role.id === "r_contact"}
                    >
                      {role.isActive ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCompanyVisibility(role)}
                      title={
                        role.id === "r_contact"
                          ? "System role cannot be modified"
                          : role.hiddenForCompanies?.includes(user?.companyId || "")
                          ? "Show role for your company"
                          : "Hide role for your company"
                      }
                      disabled={role.id === "r_contact"}
                    >
                      {role.hiddenForCompanies?.includes(user?.companyId || "") ? (
                        <EyeOff className="h-4 w-4 text-orange-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-blue-500" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingRole(role)}
                      title={role.id === "r_contact" ? "System role cannot be edited" : "Edit role"}
                      disabled={role.id === "r_contact"}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteEntity(role)}
                      title={role.id === "r_contact" ? "System role cannot be deleted" : "Delete role"}
                      disabled={role.id === "r_contact"}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                ) : isViewOnly ? (
                  <Button variant="ghost" size="sm" onClick={() => setEditingRole(role)} title="View role details">
                    <FileText className="h-4 w-4" />
                  </Button>
                ) : null}
              </>
            }
          />
        )}
      />

      {showCreateModal && <RoleFormModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={() => setShowCreateModal(false)} />}

      {editingRole && (
        <RoleFormModal
          open={Boolean(editingRole)}
          onClose={() => setEditingRole(undefined)}
          onSuccess={() => setEditingRole(undefined)}
          role={editingRole}
          viewOnly={isViewOnly}
        />
      )}
    </EntityListPage>
  )
}
