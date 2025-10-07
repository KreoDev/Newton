"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import type { User, Role } from "@/types"
import { useAlert } from "@/hooks/useAlert"
import { updateDocument } from "@/lib/firebase-utils"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"
import { filterVisibleRoles } from "@/lib/role-utils"

interface RoleManagerProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  user: User
}

export function RoleManager({ open, onClose, onSuccess, user }: RoleManagerProps) {
  useSignals()
  const { showSuccess, showError } = useAlert()
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Filter global roles to only show those visible for the user's company
  const availableRoles = filterVisibleRoles(globalData.roles.value, user.companyId)

  useEffect(() => {
    if (user && open) {
      // Initialize with user's current role
      setSelectedRoleIds(user.roleId ? [user.roleId] : [])
    }
  }, [user, open])

  const toggleRole = (roleId: string) => {
    if (selectedRoleIds.includes(roleId)) {
      setSelectedRoleIds(selectedRoleIds.filter(id => id !== roleId))
    } else {
      setSelectedRoleIds([...selectedRoleIds, roleId])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)

      // Update user with single role (first selected, or null if none)
      const userData: any = {
        roleId: selectedRoleIds.length > 0 ? selectedRoleIds[0] : null,
      }

      await updateDocument("users", user.id, userData)
      showSuccess("Role Updated", `Role has been updated for ${user.firstName} ${user.lastName}.`)

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error updating user role:", error)
      showError("Failed to Update Role", error instanceof Error ? error.message : "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const getRoleName = (roleId: string) => {
    const role = availableRoles.find((r: Role) => r.id === roleId)
    return role?.name || "Unknown Role"
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Role</DialogTitle>
          <DialogDescription>
            Assign a role to {user.firstName} {user.lastName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Roles Section */}
          <div className="space-y-2">
            <Label>Current Roles</Label>
            <div className="border rounded-md p-3 min-h-[60px] bg-muted/20">
              {selectedRoleIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">No roles assigned</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedRoleIds.map(roleId => (
                    <Badge key={roleId} variant="default" className="flex items-center gap-1 px-3 py-1">
                      {getRoleName(roleId)}
                      <button
                        type="button"
                        onClick={() => toggleRole(roleId)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Available Roles Section */}
          <div className="space-y-2">
            <Label>Available Roles</Label>
            <div className="border rounded-md p-3 max-h-[300px] overflow-y-auto space-y-2">
              {availableRoles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No roles available</p>
              ) : (
                availableRoles.map((role: Role) => {
                  const isSelected = selectedRoleIds.includes(role.id)
                  return (
                    <div
                      key={role.id}
                      className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{role.name}</h4>
                        <p className="text-xs text-muted-foreground">{role.description || "No description"}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {role.permissionKeys?.length || 0} permission(s)
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant={isSelected ? "outline" : "default"}
                        onClick={() => toggleRole(role.id)}
                      >
                        {isSelected ? (
                          <>
                            <X className="mr-1 h-3 w-3" />
                            Remove
                          </>
                        ) : (
                          <>
                            <Plus className="mr-1 h-3 w-3" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Roles"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
