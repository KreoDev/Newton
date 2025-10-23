"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { User, Company } from "@/types"
import { useAlert } from "@/hooks/useAlert"
import { updateDocument } from "@/lib/firebase-utils"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface MoveUserModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  user: User
}

export function MoveUserModal({ open, onClose, onSuccess, user }: MoveUserModalProps) {
  useSignals()
  const { showSuccess, showError } = useAlert()
  const [newCompanyId, setNewCompanyId] = useState("")
  const [confirmChecked, setConfirmChecked] = useState(false)
  const [loading, setLoading] = useState(false)

  const currentCompany = globalData.companies.value.find((c: Company) => c.id === user.companyId)
  const availableCompanies = globalData.companies.value.filter((c: Company) => c.isActive && c.id !== user.companyId)

  useEffect(() => {
    if (open) {
      setNewCompanyId("")
      setConfirmChecked(false)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newCompanyId) {
      showError("Error", "Please select a company.")
      return
    }

    if (!confirmChecked) {
      showError("Confirmation Required", "Please confirm that you understand the implications of moving this user.")
      return
    }

    try {
      setLoading(true)

      // Move user to new company and clear company-specific data
      const userData: any = {
        companyId: newCompanyId,
        roleId: null, // Clear role
        permissionOverrides: {}, // Clear overrides
        notificationPreferences: {}, // Clear preferences
      }

      await updateDocument("users", user.id, userData)

      const newCompanyName = availableCompanies.find((c: Company) => c.id === newCompanyId)?.name || "new company"
      showSuccess("User Moved", `${user.firstName} ${user.lastName} has been moved to ${newCompanyName}.`)

      onSuccess()
      onClose()
    } catch (error) {
      showError("Failed to Move User", error instanceof Error ? error.message : "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Move User to Another Company</DialogTitle>
          <DialogDescription>Transfer user to a different company</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Current Company</Label>
            <div className="px-3 py-2 border rounded-md bg-muted/50">{currentCompany?.name || "Unknown"}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newCompanyId">
              New Company <span className="text-destructive">*</span>
            </Label>
            <Select value={newCompanyId || undefined} onValueChange={value => setNewCompanyId(value)} required>
              <SelectTrigger id="newCompanyId" className="mt-2 w-full glass-surface border-[var(--glass-border-soft)] shadow-[var(--glass-shadow-xs)] bg-[oklch(1_0_0_/_0.72)] backdrop-blur-[18px]">
                <SelectValue placeholder="-- Select Company --" />
              </SelectTrigger>
              <SelectContent>
                {availableCompanies.map((company: Company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md p-4 bg-destructive/10">
            <p className="text-sm font-semibold text-destructive mb-2">Warning: Moving a user will:</p>
            <ul className="text-sm text-destructive space-y-1 list-disc list-inside">
              <li>Remove all roles from current company</li>
              <li>Reset permission overrides</li>
              <li>Remove from notification lists</li>
              <li>Clear company-specific settings</li>
            </ul>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox id="confirm" checked={confirmChecked} onCheckedChange={checked => setConfirmChecked(checked as boolean)} className="mt-1" />
            <Label htmlFor="confirm" className="cursor-pointer text-sm">
              I understand this will remove all current roles and reset permissions for this user
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !confirmChecked} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {loading ? "Moving..." : "Move User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
