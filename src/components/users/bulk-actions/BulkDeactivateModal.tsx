"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { User as UserType } from "@/types"
import { bulkUpdateUsers } from "@/services/user-bulk.service"
import { useAlert } from "@/hooks/useAlert"
import { XCircle } from "lucide-react"

interface BulkDeactivateModalProps {
  open: boolean
  onClose: () => void
  users: UserType[]
  onSuccess: () => void
}

export function BulkDeactivateModal({ open, onClose, users, onSuccess }: BulkDeactivateModalProps) {
  const { showSuccess, showError } = useAlert()
  const [loading, setLoading] = useState(false)

  const handleDeactivate = async () => {
    try {
      setLoading(true)

      await bulkUpdateUsers(
        users.map((u) => u.id),
        { isActive: false }
      )

      showSuccess(
        "Users Deactivated",
        `Successfully deactivated ${users.length} user${users.length > 1 ? "s" : ""}.`
      )
      onSuccess()
    } catch (error) {
      console.error("Error deactivating users:", error)
      showError("Deactivation Failed", error instanceof Error ? error.message : "Failed to deactivate users.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <XCircle className="h-5 w-5" />
            Deactivate Users
          </DialogTitle>
          <DialogDescription>
            Deactivate {users.length} active user{users.length > 1 ? "s" : ""}. They won&apos;t be able to log in but their data will be preserved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Users list */}
          <div className="space-y-2">
            <Label>Users to Deactivate ({users.length})</Label>
            <div className="max-h-48 overflow-y-auto space-y-1 p-3 glass-surface rounded-lg">
              {users.map((user) => (
                <div key={user.id} className="text-sm">
                  {user.firstName} {user.lastName} <span className="text-muted-foreground text-xs">({user.email})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleDeactivate} disabled={loading} variant="destructive">
            {loading ? "Deactivating..." : `Deactivate ${users.length} User${users.length > 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
