"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Shield, Edit, ToggleLeft, ToggleRight, Trash2, Eye, EyeOff, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Role } from "@/types"
import { useAlert } from "@/hooks/useAlert"
import { RoleFormModal } from "@/components/roles/RoleFormModal"
import { useOptimizedSearch } from "@/hooks/useOptimizedSearch"
import { SEARCH_CONFIGS } from "@/config/search-configs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, deleteDoc, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function RolesPage() {
  const { user } = useAuth()
  const { hasPermission: canManage, loading: permissionLoading } = usePermission(PERMISSIONS.ADMIN_ROLES)
  const { showSuccess, showError, showConfirm } = useAlert()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  useEffect(() => {
    if (!user) return

    // NOTE: Roles are GLOBAL - not filtered by companyId
    const q = query(
      collection(db, "roles"),
      orderBy("name", "asc")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rolesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Role[]
      setRoles(rolesList)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const { searchTerm, setSearchTerm, filteredItems: searchedRoles, isSearching } = useOptimizedSearch(roles, SEARCH_CONFIGS.roles)

  const filteredRoles = searchedRoles.filter(role => {
    if (filterStatus === "all") return true
    return filterStatus === "active" ? role.isActive : !role.isActive
  })

  const toggleRoleStatus = async (role: Role) => {
    try {
      await updateDoc(doc(db, "roles", role.id), {
        isActive: !role.isActive,
        updatedAt: Date.now(),
      })
      showSuccess(
        `Role ${role.isActive ? "Deactivated" : "Activated"}`,
        `${role.name} has been ${role.isActive ? "deactivated" : "activated"} successfully.`
      )
    } catch (error) {
      console.error("Error toggling role status:", error)
      showError("Failed to Update Role", error instanceof Error ? error.message : "An unexpected error occurred.")
    }
  }

  const toggleCompanyVisibility = async (role: Role) => {
    if (!user?.companyId) {
      showError("Error", "Cannot toggle visibility: No active company selected.")
      return
    }

    try {
      const currentHiddenCompanies = role.hiddenForCompanies || []
      const isCurrentlyHidden = currentHiddenCompanies.includes(user.companyId)

      const updatedHiddenCompanies = isCurrentlyHidden
        ? currentHiddenCompanies.filter(id => id !== user.companyId) // Remove from hidden
        : [...currentHiddenCompanies, user.companyId] // Add to hidden

      await updateDoc(doc(db, "roles", role.id), {
        hiddenForCompanies: updatedHiddenCompanies,
        updatedAt: Date.now(),
      })

      showSuccess(
        `Role Visibility Updated`,
        `${role.name} is now ${isCurrentlyHidden ? "visible" : "hidden"} for your company.`
      )
    } catch (error) {
      console.error("Error toggling company visibility:", error)
      showError("Failed to Update Visibility", error instanceof Error ? error.message : "An unexpected error occurred.")
    }
  }

  const handleDeleteClick = async (role: Role) => {
    try {
      // Check if role is assigned to any users
      const usersQuery = query(collection(db, "users"), where("roleId", "==", role.id))
      const usersSnapshot = await getDocs(usersQuery)

      if (!usersSnapshot.empty) {
        showError(
          "Cannot Delete Role",
          `This role is assigned to ${usersSnapshot.size} user(s). Please reassign these users to different roles before deleting this role.`
        )
        return
      }

      showConfirm(
        "Delete Role",
        `Are you sure you want to delete "${role.name}"? This action cannot be undone.`,
        async () => {
          try {
            await deleteDoc(doc(db, "roles", role.id))
            showSuccess("Role Deleted", `${role.name} has been permanently removed.`)
          } catch (error) {
            console.error("Error deleting role:", error)
            showError("Failed to Delete Role", error instanceof Error ? error.message : "An unexpected error occurred.")
          }
        },
        undefined,
        "Delete",
        "Cancel"
      )
    } catch (error) {
      console.error("Error checking role usage:", error)
      showError("Error", "Failed to check if role can be deleted. Please try again.")
    }
  }

  const getUserCountForRole = (roleId: string) => {
    // This is a simple count - in production you might want to cache this
    const usersQuery = query(collection(db, "users"), where("roleId", "==", roleId))
    getDocs(usersQuery).then(snapshot => snapshot.size)
    return 0 // Placeholder - would need state management for real-time counts
  }

  if (permissionLoading) {
    return <LoadingSpinner fullScreen message="Checking permissions..." />
  }

  if (!canManage) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">You don&apos;t have permission to manage roles.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
        <Button variant="outline" onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Role
        </Button>
      </div>

      <Card className="glass-surface">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or description..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {filterStatus === "all" ? "All Status" : filterStatus === "active" ? "Active" : "Inactive"}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterStatus("all")}>All Status</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("active")}>Active</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("inactive")}>Inactive</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {(loading || isSearching) ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" message={loading ? "Loading roles..." : "Searching..."} />
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No roles found</div>
          ) : (
            <div className="space-y-4">
              {filteredRoles.map(role => (
                <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors backdrop-blur-sm">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{role.name}</h3>
                      <p className="text-sm text-muted-foreground">{role.description || "No description"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {role.permissionKeys?.length || 0} permission(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => toggleRoleStatus(role)} title={role.isActive ? "Deactivate role globally" : "Activate role globally"}>
                      {role.isActive ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCompanyVisibility(role)}
                      title={role.hiddenForCompanies?.includes(user?.companyId || "") ? "Show role for your company" : "Hide role for your company"}
                    >
                      {role.hiddenForCompanies?.includes(user?.companyId || "") ? (
                        <EyeOff className="h-4 w-4 text-orange-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-blue-500" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingRole(role)} title="Edit role">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(role)} title="Delete role">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <Badge variant={role.isActive ? "success" : "secondary"}>{role.isActive ? "Active" : "Inactive"}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showCreateModal && <RoleFormModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={() => setShowCreateModal(false)} />}

      {editingRole && (
        <RoleFormModal
          open={Boolean(editingRole)}
          onClose={() => setEditingRole(undefined)}
          onSuccess={() => setEditingRole(undefined)}
          role={editingRole}
        />
      )}
    </div>
  )
}
