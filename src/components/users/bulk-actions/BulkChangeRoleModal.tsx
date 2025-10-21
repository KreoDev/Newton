"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { User as UserType, Role } from "@/types"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"
import { bulkUpdateUsers } from "@/services/user-bulk.service"
import { useAlert } from "@/hooks/useAlert"
import { Shield } from "lucide-react"

interface BulkChangeRoleModalProps {
  open: boolean
  onClose: () => void
  users: UserType[]
  onSuccess: () => void
}

export function BulkChangeRoleModal({ open, onClose, users, onSuccess }: BulkChangeRoleModalProps) {
  useSignals()
  const { showSuccess, showError } = useAlert()
  const [selectedRoleId, setSelectedRoleId] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const roles = globalData.roles.value.filter((r: Role) => r.isActive)

  const handleSubmit = async () => {
    if (!selectedRoleId) {
      showError("Select Role", "Please select a role to assign.")
      return
    }

    try {
      setLoading(true)

      await bulkUpdateUsers(
        users.map((u) => u.id),
        { roleId: selectedRoleId }
      )

      const roleName = roles.find((r: Role) => r.id === selectedRoleId)?.name || "Unknown Role"

      showSuccess(
        "Roles Updated",
        `Successfully assigned "${roleName}" role to ${users.length} user${users.length > 1 ? "s" : ""}.`
      )
      onSuccess()
    } catch (error) {
      console.error("Error updating roles:", error)
      showError("Update Failed", error instanceof Error ? error.message : "Failed to update roles.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Change User Roles
          </DialogTitle>
          <DialogDescription>
            Assign a role to {users.length} user{users.length > 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Users list */}
          <div className="space-y-2">
            <Label>Selected Users ({users.length})</Label>
            <div className="max-h-32 overflow-y-auto space-y-1 p-3 glass-surface rounded-lg">
              {users.map((user) => (
                <div key={user.id} className="text-sm">
                  {user.firstName} {user.lastName}
                </div>
              ))}
            </div>
          </div>

          {/* Role select */}
          <div className="space-y-2">
            <Label htmlFor="role">Assign Role</Label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role: Role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3" />
                      {role.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !selectedRoleId}>
            {loading ? "Updating..." : `Update ${users.length} User${users.length > 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
