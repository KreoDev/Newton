"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, ChevronDown } from "lucide-react"
import type { User as UserType, Company } from "@/types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"
import { UsersTable } from "@/components/users/UsersTable"

export default function UsersPage() {
  useSignals()
  const { user } = useAuth()
  const { hasPermission: canManage, loading: permissionLoading } = usePermission(PERMISSIONS.ADMIN_USERS)
  const { hasPermission: canViewAllCompanies, loading: viewAllLoading } = usePermission(PERMISSIONS.ADMIN_USERS_VIEW_ALL_COMPANIES)
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(user?.companyId || "")

  useEffect(() => {
    if (!user) return

    // For users with viewAllCompanies permission, allow filtering by company
    // For regular users, only show users from their company
    const companyId = canViewAllCompanies && selectedCompanyId ? selectedCompanyId : user.companyId

    if (!companyId) return

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
      setUsers(usersList)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, selectedCompanyId, canViewAllCompanies])


  if (permissionLoading || viewAllLoading) {
    return <LoadingSpinner fullScreen message="Checking permissions..." />
  }

  if (!canManage) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">You don&apos;t have permission to manage users.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
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
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
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
          onEdit={(user) => console.log("Edit user", user)}
          onManageRoles={(user) => console.log("Manage roles", user)}
          onEditPermissions={(user) => console.log("Edit permissions", user)}
          onChangePassword={(user) => console.log("Change password", user)}
          onChangeEmail={(user) => console.log("Change email", user)}
          onMoveCompany={(user) => console.log("Move company", user)}
        />
      )}
    </div>
  )
}
