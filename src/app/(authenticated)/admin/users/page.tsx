"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useViewPermission } from "@/hooks/useViewPermission"
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, ChevronDown } from "lucide-react"
import type { User as UserType, Company } from "@/types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ViewOnlyBadge } from "@/components/ui/view-only-badge"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"
import { UsersTable } from "@/components/users/UsersTable"
import { AddUserModal } from "@/components/users/AddUserModal"
import { EditUserModal } from "@/components/users/EditUserModal"
import { ChangePasswordModal } from "@/components/users/ChangePasswordModal"
import { ChangeEmailModal } from "@/components/users/ChangeEmailModal"
import { MoveUserModal } from "@/components/users/MoveUserModal"
import { PermissionOverrideEditor } from "@/components/users/PermissionOverrideEditor"
import { RoleManager } from "@/components/users/RoleManager"

export default function UsersPage() {
  useSignals()
  const { user } = useAuth()
  const { canView, canManage, isViewOnly, loading: permissionLoading } = useViewPermission(
    PERMISSIONS.ADMIN_USERS_VIEW,
    PERMISSIONS.ADMIN_USERS
  )
  const { hasPermission: canViewAllCompanies, loading: viewAllLoading } = usePermission(PERMISSIONS.ADMIN_USERS_VIEW_ALL_COMPANIES)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(user?.companyId || "")

  // Local state for when filtering by different company
  const [localUsers, setLocalUsers] = useState<UserType[]>([])
  const [localLoading, setLocalLoading] = useState(false)

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [passwordUser, setPasswordUser] = useState<UserType | null>(null)
  const [emailUser, setEmailUser] = useState<UserType | null>(null)
  const [moveUser, setMoveUser] = useState<UserType | null>(null)
  const [permissionUser, setPermissionUser] = useState<UserType | null>(null)
  const [roleUser, setRoleUser] = useState<UserType | null>(null)

  // Determine if we're viewing current company (can use centralized data)
  const viewingCurrentCompany = selectedCompanyId === user?.companyId

  // Use centralized data when viewing current company, otherwise create local listener
  useEffect(() => {
    if (!user || viewingCurrentCompany) return

    // Only create listener when filtering by different company or "all"
    const companyId = canViewAllCompanies && selectedCompanyId ? selectedCompanyId : user.companyId

    if (!companyId) return

    setLocalLoading(true)

    const q = canViewAllCompanies && selectedCompanyId === "all"
      ? query(collection(db, "users"), orderBy("firstName", "asc"))
      : query(
          collection(db, "users"),
          where("companyId", "==", companyId),
          orderBy("firstName", "asc")
        )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as UserType[]
      setLocalUsers(usersList)
      setLocalLoading(false)
    })

    return () => unsubscribe()
  }, [user, selectedCompanyId, canViewAllCompanies, viewingCurrentCompany])

  // Select data source: centralized for current company, local for others
  const users = viewingCurrentCompany ? globalData.users.value : localUsers
  const loading = viewingCurrentCompany ? globalData.loading.value : localLoading


  if (permissionLoading || viewAllLoading) {
    return <LoadingSpinner fullScreen message="Checking permissions..." />
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">You don&apos;t have permission to view users.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground">
              {isViewOnly ? "View user accounts and permissions" : "Manage user accounts and permissions"}
            </p>
          </div>
          {isViewOnly && <ViewOnlyBadge />}
        </div>
        <div className="flex items-center gap-4">
          {canViewAllCompanies && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {selectedCompanyId === "all" ? "All Companies" : globalData.companies.value.find((c: Company) => c.id === selectedCompanyId)?.name || "Select Company"}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedCompanyId("all")}>
                  All Companies
                </DropdownMenuItem>
                {globalData.companies.value.map((company: Company) => (
                  <DropdownMenuItem key={company.id} onClick={() => setSelectedCompanyId(company.id)}>
                    {company.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {canManage && (
            <Button variant="outline" onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Loading users..." />
        </div>
      ) : (
        <UsersTable
          users={users}
          canViewAllCompanies={canViewAllCompanies}
          canManage={canManage}
          isViewOnly={isViewOnly}
          onEdit={(user) => setEditingUser(user)}
          onManageRoles={(user) => setRoleUser(user)}
          onEditPermissions={(user) => setPermissionUser(user)}
          onChangePassword={(user) => setPasswordUser(user)}
          onChangeEmail={(user) => setEmailUser(user)}
          onMoveCompany={(user) => setMoveUser(user)}
        />
      )}

      {/* Modals */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        companyId={selectedCompanyId === "all" ? (user?.companyId || "") : selectedCompanyId}
      />

      <EditUserModal
        user={editingUser}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        roles={globalData.roles.value}
        viewOnly={isViewOnly}
      />

      <ChangePasswordModal
        isOpen={!!passwordUser}
        onClose={() => setPasswordUser(null)}
      />

      <ChangeEmailModal
        isOpen={!!emailUser}
        onClose={() => setEmailUser(null)}
      />

      {moveUser && (
        <MoveUserModal
          open={!!moveUser}
          onClose={() => setMoveUser(null)}
          onSuccess={() => {
            setMoveUser(null)
            // Data will refresh automatically via real-time listener
          }}
          user={moveUser}
        />
      )}

      {permissionUser && (
        <PermissionOverrideEditor
          open={!!permissionUser}
          onClose={() => setPermissionUser(null)}
          onSuccess={() => {
            setPermissionUser(null)
            // Data will refresh automatically via real-time listener
          }}
          user={permissionUser}
          viewOnly={isViewOnly}
        />
      )}

      {roleUser && (
        <RoleManager
          open={!!roleUser}
          onClose={() => setRoleUser(null)}
          onSuccess={() => {
            setRoleUser(null)
            // Data will refresh automatically via real-time listener
          }}
          user={roleUser}
          viewOnly={isViewOnly}
        />
      )}
    </div>
  )
}
