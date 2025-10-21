"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { User as UserType } from "@/types"
import { bulkDeleteUsers } from "@/services/user-bulk.service"
import { useAlert } from "@/hooks/useAlert"
import { AlertTriangle } from "lucide-react"

interface BulkDeleteModalProps {
  open: boolean
  onClose: () => void
  users: UserType[]
  onSuccess: () => void
}

export function BulkDeleteModal({ open, onClose, users, onSuccess }: BulkDeleteModalProps) {
  const { showSuccess, showError } = useAlert()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    try {
      setLoading(true)

      await bulkDeleteUsers(users.map((u) => u.id))

      showSuccess(
        "Users Deleted",
        `Successfully deleted ${users.length} user${users.length > 1 ? "s" : ""}.`
      )
      onSuccess()
    } catch (error) {
      console.error("Error deleting users:", error)
      showError("Delete Failed", error instanceof Error ? error.message : "Failed to delete users.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Users
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete {users.length} user{users.length > 1 ? "s" : ""} and their authentication accounts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Users list */}
          <div className="space-y-2">
            <Label>Users to Delete ({users.length})</Label>
            <div className="max-h-48 overflow-y-auto space-y-1 p-3 glass-surface rounded-lg border border-destructive/20">
              {users.map((user) => (
                <div key={user.id} className="text-sm flex items-center justify-between">
                  <span>
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-muted-foreground text-xs">{user.email}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
            <div className="text-sm text-destructive">
              <strong>Warning:</strong> This will permanently delete all selected users and their Firebase Authentication accounts. This action cannot be undone.
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : `Delete ${users.length} User${users.length > 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
