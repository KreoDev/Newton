"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { Role } from "@/types"
import { useAlert } from "@/hooks/useAlert"
import { useAuth } from "@/contexts/AuthContext"
import { createDocument, updateDocument } from "@/lib/firebase-utils"
import { PermissionSelector } from "./PermissionSelector"

interface RoleFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  role?: Role // For editing existing role
}

export function RoleFormModal({ open, onClose, onSuccess, role }: RoleFormModalProps) {
  const { user } = useAuth()
  const { showSuccess, showError } = useAlert()
  const isEditing = Boolean(role)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [permissionKeys, setPermissionKeys] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (role && open) {
      setName(role.name)
      setDescription(role.description || "")
      setPermissionKeys(role.permissionKeys || [])
      setIsActive(role.isActive)
    } else if (!role && open) {
      resetForm()
    }
  }, [role, open])

  const resetForm = () => {
    setName("")
    setDescription("")
    setPermissionKeys([])
    setIsActive(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      showError("Validation Error", "Role name is required")
      return
    }

    if (permissionKeys.length === 0) {
      showError("Validation Error", "At least one permission must be selected")
      return
    }

    try {
      setLoading(true)

      // NOTE: Roles are GLOBAL - no companyId field
      const roleData: any = {
        name: name.trim(),
        description: description.trim() || null,
        permissionKeys,
        isActive,
      }

      if (isEditing && role) {
        await updateDocument("roles", role.id, roleData)
        showSuccess("Role Updated", `${name} has been updated successfully.`)
      } else {
        await createDocument("roles", roleData)
        showSuccess("Role Created", `${name} has been created successfully.`)
      }

      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error("Error saving role:", error)
      showError(`Failed to ${isEditing ? "Update" : "Create"} Role`, error instanceof Error ? error.message : "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Role" : "Create New Role"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update role information and permissions" : "Add a new role with custom permissions"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Role Name <span className="text-destructive">*</span>
            </Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Weighbridge Operator" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the role and its responsibilities"
              rows={3}
            />
          </div>

          <PermissionSelector selectedPermissions={permissionKeys} onChange={setPermissionKeys} />

          <div className="flex items-center space-x-2">
            <Checkbox id="isActive" checked={isActive} onCheckedChange={checked => setIsActive(checked as boolean)} />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Update Role" : "Create Role"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
