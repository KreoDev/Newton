"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, User, Edit, ToggleLeft, ToggleRight, MoreHorizontal, KeyRound, UserCircle2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { User as UserType, Company } from "@/types"
import { useAlert } from "@/hooks/useAlert"
import { useOptimizedSearch } from "@/hooks/useOptimizedSearch"
import { SEARCH_CONFIGS } from "@/config/search-configs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"

export default function UsersPage() {
  useSignals()
  const { user } = useAuth()
  const { hasPermission: canManage, loading: permissionLoading } = usePermission(PERMISSIONS.ADMIN_USERS)
  const { showSuccess, showError } = useAlert()
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(user?.companyId || "")

  // Check if user is global admin
  const isGlobalAdmin = user?.isGlobal === true

  useEffect(() => {
    if (!user) return

    // For global admins, allow filtering by company
    // For regular users, only show users from their company
    const companyId = isGlobalAdmin && selectedCompanyId ? selectedCompanyId : user.companyId

    if (!companyId) return

    const q = isGlobalAdmin && selectedCompanyId === "all"
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
  }, [user, selectedCompanyId, isGlobalAdmin])

  const { searchTerm, setSearchTerm, filteredItems: searchedUsers, isSearching } = useOptimizedSearch(users, SEARCH_CONFIGS.users)

  const filteredUsers = searchedUsers.filter(u => {
    if (filterStatus === "all") return true
    return filterStatus === "active" ? u.isActive : !u.isActive
  })

  const toggleUserStatus = async (targetUser: UserType) => {
    try {
      await updateDoc(doc(db, "users", targetUser.id), {
        isActive: !targetUser.isActive,
        updatedAt: Date.now(),
      })
      showSuccess(
        `User ${targetUser.isActive ? "Deactivated" : "Activated"}`,
        `${targetUser.firstName} ${targetUser.lastName} has been ${targetUser.isActive ? "deactivated" : "activated"} successfully.`
      )
    } catch (error) {
      console.error("Error toggling user status:", error)
      showError("Failed to Update User", error instanceof Error ? error.message : "An unexpected error occurred.")
    }
  }

  const getCompanyName = (companyId: string) => {
    const company = globalData.companies.value.find((c: Company) => c.id === companyId)
    return company?.name || "Unknown Company"
  }

  if (permissionLoading) {
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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card className="glass-surface">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, email, or phone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            {isGlobalAdmin && (
              <select
                value={selectedCompanyId}
                onChange={e => setSelectedCompanyId(e.target.value)}
                className="border rounded-md px-3 py-2 bg-background/60 backdrop-blur-md"
              >
                <option value="all">All Companies</option>
                {globalData.companies.value.map((company: Company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            )}
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded-md px-3 py-2 bg-background/60 backdrop-blur-md">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {(loading || isSearching) ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" message={loading ? "Loading users..." : "Searching..."} />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors backdrop-blur-sm">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center relative">
                      <User className="h-5 w-5 text-primary" />
                      {/* Login capability indicator */}
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background border-2 border-background flex items-center justify-center" title={u.canLogin !== false ? "Can log in" : "Contact only"}>
                        {u.canLogin !== false ? (
                          <KeyRound className="h-3 w-3 text-green-600" />
                        ) : (
                          <UserCircle2 className="h-3 w-3 text-blue-600" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{u.firstName} {u.lastName}</h3>
                        {u.canLogin !== false ? (
                          <Badge variant="outline" className="text-xs">
                            <KeyRound className="h-3 w-3 mr-1" />
                            Login User
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <UserCircle2 className="h-3 w-3 mr-1" />
                            Contact Only
                          </Badge>
                        )}
                        {u.isGlobal && (
                          <Badge variant="default">Global Admin</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                      {isGlobalAdmin && (
                        <p className="text-xs text-muted-foreground mt-1">{getCompanyName(u.companyId)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => toggleUserStatus(u)} title={u.isActive ? "Deactivate user" : "Activate user"}>
                      {u.isActive ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Change Password
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Change Email
                        </DropdownMenuItem>
                        {isGlobalAdmin && (
                          <DropdownMenuItem>
                            Move to Another Company
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          Manage Roles
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Edit Permissions
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Badge variant={u.isActive ? "success" : "secondary"}>{u.isActive ? "Active" : "Inactive"}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
