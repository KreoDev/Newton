"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
  viewOnly?: boolean
}

export function RoleManager({ open, onClose, onSuccess, user, viewOnly = false }: RoleManagerProps) {
  useSignals()
  const { showSuccess, showError } = useAlert()
  const [selectedRoleId, setSelectedRoleId] = useState<string>("")
  const [loading, setLoading] = useState(false)

  // Filter global roles to only show those visible for the user's company
  const availableRoles = filterVisibleRoles(globalData.roles.value, user.companyId)

  useEffect(() => {
    if (user && open) {
      // Initialize with user's current role
      setSelectedRoleId(user.roleId || "")
    }
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)

      // Update user with single role
      const userData: any = {
        roleId: selectedRoleId || null,
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
          <DialogTitle>{viewOnly ? "View Role" : "Manage Role"}</DialogTitle>
          <DialogDescription>
            {viewOnly ? `View role assigned to ${user.firstName} ${user.lastName}` : `Assign a role to ${user.firstName} ${user.lastName}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={viewOnly} className="space-y-4">
          {/* Current Role Section */}
          <div className="space-y-2">
            <Label>Current Role</Label>
            <div className="border rounded-md p-3 min-h-[60px] bg-muted/20">
              {!selectedRoleId ? (
                <p className="text-sm text-muted-foreground">No role assigned</p>
              ) : (
                <Badge variant="default" className="px-3 py-1">
                  {getRoleName(selectedRoleId)}
                </Badge>
              )}
            </div>
          </div>

          {/* Available Roles Section */}
          <div className="space-y-2">
            <Label>Select Role</Label>
            <RadioGroup value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <div className="border rounded-md p-3 max-h-[300px] overflow-y-auto space-y-2">
                {availableRoles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No roles available</p>
                ) : (
                  availableRoles.map((role: Role) => (
                    <div
                      key={role.id}
                      className="flex items-center space-x-3 p-3 border rounded-md hover:bg-accent/50 transition-colors"
                    >
                      <RadioGroupItem value={role.id} id={role.id} />
                      <Label htmlFor={role.id} className="flex-1 cursor-pointer">
                        <h4 className="font-semibold text-sm">{role.name}</h4>
                        <p className="text-xs text-muted-foreground">{role.description || "No description"}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {role.permissionKeys?.length || 0} permission(s)
                        </p>
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </RadioGroup>
          </div>
          </fieldset>

          {viewOnly ? (
            <div className="flex justify-end pt-4 border-t">
              <Button type="button" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Role"}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
