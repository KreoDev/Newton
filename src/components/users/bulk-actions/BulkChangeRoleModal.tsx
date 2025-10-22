"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { User as UserType, Role } from "@/types"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"
import { bulkUpdateUsers } from "@/services/user-bulk.service"
import { useAlert } from "@/hooks/useAlert"
import { Shield, AlertCircle } from "lucide-react"

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

  // Filter out contact-only users (they need login details created first)
  const loginUsers = users.filter((u) => u.canLogin !== false)
  const contactUsers = users.filter((u) => u.canLogin === false)
  const roles = globalData.roles.value.filter((r: Role) => r.isActive)

  const handleSubmit = async () => {
    if (!selectedRoleId) {
      showError("Select Role", "Please select a role to assign.")
      return
    }

    if (loginUsers.length === 0) {
      showError("No Login Users", "Cannot change roles for contact-only users. They need login credentials created first.")
      return
    }

    try {
      setLoading(true)

      // Only update login users (contact-only users are excluded)
      await bulkUpdateUsers(
        loginUsers.map((u) => u.id),
        { roleId: selectedRoleId }
      )

      const roleName = roles.find((r: Role) => r.id === selectedRoleId)?.name || "Unknown Role"

      showSuccess(
        "Roles Updated",
        `Successfully assigned "${roleName}" role to ${loginUsers.length} user${loginUsers.length > 1 ? "s" : ""}.`
      )
      onSuccess()
    } catch (error) {
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
            {loginUsers.length > 0 && `Assign a role to ${loginUsers.length} login user${loginUsers.length > 1 ? "s" : ""}`}
            {contactUsers.length > 0 && loginUsers.length > 0 && " - "}
            {contactUsers.length > 0 && `${contactUsers.length} contact-only user${contactUsers.length > 1 ? "s" : ""} excluded`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Login users list */}
          {loginUsers.length > 0 && (
            <div className="space-y-2">
              <Label>Login Users ({loginUsers.length})</Label>
              <div className="max-h-32 overflow-y-auto space-y-1 p-3 glass-surface rounded-lg">
                {loginUsers.map((user) => (
                  <div key={user.id} className="text-sm">
                    {user.firstName} {user.lastName}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact users warning */}
          {contactUsers.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                Contact-Only Users Excluded ({contactUsers.length})
              </Label>
              <div className="max-h-32 overflow-y-auto space-y-1 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                {contactUsers.map((user) => (
                  <div key={user.id} className="text-sm text-amber-800 dark:text-amber-200">
                    {user.firstName} {user.lastName}
                  </div>
                ))}
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Contact-only users cannot have their roles changed. To change their role, first convert them to login users by editing them individually.
              </p>
            </div>
          )}

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
          <Button onClick={handleSubmit} disabled={loading || !selectedRoleId || loginUsers.length === 0}>
            {loading ? "Updating..." : `Update ${loginUsers.length} User${loginUsers.length > 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
