"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { User as UserType } from "@/types"
import { bulkUpdateUsers } from "@/services/user-bulk.service"
import { useAlert } from "@/hooks/useAlert"
import { CheckCircle } from "lucide-react"

interface BulkActivateModalProps {
  open: boolean
  onClose: () => void
  users: UserType[]
  onSuccess: () => void
}

export function BulkActivateModal({ open, onClose, users, onSuccess }: BulkActivateModalProps) {
  const { showSuccess, showError } = useAlert()
  const [loading, setLoading] = useState(false)

  const handleActivate = async () => {
    try {
      setLoading(true)

      await bulkUpdateUsers(
        users.map((u) => u.id),
        { isActive: true }
      )

      showSuccess(
        "Users Activated",
        `Successfully activated ${users.length} user${users.length > 1 ? "s" : ""}.`
      )
      onSuccess()
    } catch (error) {
      console.error("Error activating users:", error)
      showError("Activation Failed", error instanceof Error ? error.message : "Failed to activate users.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Activate Users
          </DialogTitle>
          <DialogDescription>
            Activate {users.length} inactive user{users.length > 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Users list */}
          <div className="space-y-2">
            <Label>Users to Activate ({users.length})</Label>
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
          <Button onClick={handleActivate} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? "Activating..." : `Activate ${users.length} User${users.length > 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
