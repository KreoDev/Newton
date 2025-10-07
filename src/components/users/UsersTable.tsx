"use client"

import { type ColumnDef } from "@tanstack/react-table"
import type { User as UserType, Company, Role } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { KeyRound, UserCircle2, ToggleRight, ToggleLeft, MoreHorizontal, Edit, User } from "lucide-react"
import Image from "next/image"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/ui/data-table"
import { useAlert } from "@/hooks/useAlert"
import { useAuth } from "@/contexts/AuthContext"
import { updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"

interface UsersTableProps {
  users: UserType[]
  canViewAllCompanies: boolean
  onEdit?: (user: UserType) => void
  onManageRoles?: (user: UserType) => void
  onEditPermissions?: (user: UserType) => void
  onChangePassword?: (user: UserType) => void
  onChangeEmail?: (user: UserType) => void
  onMoveCompany?: (user: UserType) => void
}

export function UsersTable({ users, canViewAllCompanies, onEdit, onManageRoles, onEditPermissions, onChangePassword, onChangeEmail, onMoveCompany }: UsersTableProps) {
  useSignals()
  const { showSuccess, showError } = useAlert()
  const { user: currentUser } = useAuth()

  const toggleUserStatus = async (user: UserType) => {
    try {
      await updateDoc(doc(db, "users", user.id), {
        isActive: !user.isActive,
        updatedAt: Date.now(),
      })
      showSuccess(`User ${user.isActive ? "Deactivated" : "Activated"}`, `${user.firstName} ${user.lastName} has been ${user.isActive ? "deactivated" : "activated"} successfully.`)
    } catch (error) {
      console.error("Error toggling user status:", error)
      showError("Failed to Update User", error instanceof Error ? error.message : "An unexpected error occurred.")
    }
  }

  const getCompanyName = (companyId: string) => {
    const company = globalData.companies.value.find((c: Company) => c.id === companyId)
    return company?.name || "Unknown Company"
  }

  const getRoleName = (roleId: string) => {
    const role = globalData.roles.value.find((r: Role) => r.id === roleId)
    return role?.name || "No Role"
  }

  const columns: ColumnDef<UserType>[] = [
    {
      id: "name",
      accessorFn: row => `${row.firstName} ${row.lastName}`,
      header: "Name",
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">{user.profilePicture ? <Image src={user.profilePicture} alt={`${user.firstName} ${user.lastName}`} width={40} height={40} className="h-full w-full object-cover" /> : <User className="h-5 w-5 text-primary" />}</div>
              <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-background flex items-center justify-center" title={user.canLogin !== false ? "Can log in" : "Contact only"}>
                {user.canLogin !== false ? <KeyRound className="h-3 w-3 text-green-600" /> : <UserCircle2 className="h-3 w-3 text-blue-600" />}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold whitespace-nowrap">
                {user.firstName} {user.lastName}
              </span>
              {user.isGlobal && (
                <Badge variant="info" className="text-xs">
                  Global Admin
                </Badge>
              )}
              {user.id === currentUser?.id && (
                <Badge variant="lime" className="text-xs">
                  You
                </Badge>
              )}
            </div>
          </div>
        )
      },
    },
    {
      id: "email",
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.email}</span>,
    },
    {
      id: "userType",
      accessorFn: row => (row.canLogin !== false ? "login" : "contact"),
      header: "User Type",
      cell: ({ row }) => {
        const user = row.original
        return user.canLogin !== false ? (
          <Badge variant="purple" className="text-xs">
            <KeyRound className="h-3 w-3 mr-1" />
            Login User
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">
            <UserCircle2 className="h-3 w-3 mr-1" />
            Contact Only
          </Badge>
        )
      },
    },
    {
      id: "role",
      accessorFn: row => getRoleName(row.roleId),
      header: "Role",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {getRoleName(row.original.roleId)}
        </Badge>
      ),
    },
    {
      id: "company",
      accessorFn: row => getCompanyName(row.companyId),
      header: "Company",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{getCompanyName(row.original.companyId)}</span>,
      enableHiding: canViewAllCompanies,
    },
    {
      id: "status",
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const user = row.original
        return <Badge variant={user.isActive ? "success" : "secondary"}>{user.isActive ? "Active" : "Inactive"}</Badge>
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => toggleUserStatus(user)} title={user.isActive ? "Deactivate user" : "Activate user"}>
              {user.isActive ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
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
                <DropdownMenuItem onClick={() => onEdit?.(user)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit User
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onChangePassword?.(user)}>Change Password</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onChangeEmail?.(user)}>Change Email</DropdownMenuItem>
                {canViewAllCompanies && <DropdownMenuItem onClick={() => onMoveCompany?.(user)}>Move to Another Company</DropdownMenuItem>}
                <DropdownMenuItem onClick={() => onManageRoles?.(user)}>Manage Roles</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEditPermissions?.(user)}>Edit Permissions</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Checkbox checked={row.getIsSelected()} onCheckedChange={value => row.toggleSelected(!!value)} aria-label="Select row" />
          </div>
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
  ]

  return (
    <DataTable
      tableId="users-table"
      columns={columns}
      data={users}
      defaultColumnOrder={["name", "email", "userType", "role", "company", "status", "actions"]}
      searchPlaceholder="Search users by name, email, or role..."
      enablePagination={true}
      enableRowSelection={true}
      enableColumnResizing={true}
      enableExport={true}
      onRowSelectionChange={selectedRows => {
        console.log("Selected users:", selectedRows)
      }}
    />
  )
}
