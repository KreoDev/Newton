"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { User as UserType, Company } from "@/types"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"
import { bulkUpdateUsers } from "@/services/user-bulk.service"
import { useAlert } from "@/hooks/useAlert"
import { AlertCircle } from "lucide-react"

interface BulkMoveCompanyModalProps {
  open: boolean
  onClose: () => void
  users: UserType[]
  onSuccess: () => void
}

export function BulkMoveCompanyModal({ open, onClose, users, onSuccess }: BulkMoveCompanyModalProps) {
  useSignals()
  const { showSuccess, showError } = useAlert()
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const companies = globalData.companies.value.filter((c: Company) => c.isActive)

  const handleSubmit = async () => {
    if (!selectedCompanyId) {
      showError("Select Company", "Please select a company to move users to.")
      return
    }

    try {
      setLoading(true)

      await bulkUpdateUsers(
        users.map((u) => u.id),
        { companyId: selectedCompanyId }
      )

      showSuccess(
        "Users Moved",
        `Successfully moved ${users.length} user${users.length > 1 ? "s" : ""} to the selected company.`
      )
      onSuccess()
    } catch (error) {
      console.error("Error moving users:", error)
      showError("Move Failed", error instanceof Error ? error.message : "Failed to move users.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Move Users to Company</DialogTitle>
          <DialogDescription>
            Move {users.length} user{users.length > 1 ? "s" : ""} to another company
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Users list */}
          <div className="space-y-2">
            <Label>Selected Users ({users.length})</Label>
            <div className="max-h-32 overflow-y-auto space-y-1 p-3 glass-surface rounded-lg">
              {users.map((user) => (
                <div key={user.id} className="text-sm">
                  {user.firstName} {user.lastName} <span className="text-muted-foreground">({user.email})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Company select */}
          <div className="space-y-2">
            <Label htmlFor="company">Move to Company</Label>
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger id="company">
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company: Company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Warning:</strong> Moving users will update their company assignment and may affect their access permissions.
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !selectedCompanyId}>
            {loading ? "Moving..." : `Move ${users.length} User${users.length > 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
