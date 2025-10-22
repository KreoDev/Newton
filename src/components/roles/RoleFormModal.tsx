"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { Role } from "@/types"
import { GenericFormModal } from "@/components/ui/generic-form-modal"
import { PermissionSelector } from "./PermissionSelector"

interface RoleFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  role?: Role
  viewOnly?: boolean
}

export function RoleFormModal({ open, onClose, onSuccess, role, viewOnly = false }: RoleFormModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [permissionKeys, setPermissionKeys] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (role && open) {
      setName(role.name)
      setDescription(role.description || "")
      setPermissionKeys(role.permissionKeys || [])
      setIsActive(role.isActive)
    } else if (!role && open) {
      setName("")
      setDescription("")
      setPermissionKeys([])
      setIsActive(true)
    }
  }, [role, open])

  return (
    <GenericFormModal<Role>
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      entity={role}
      viewOnly={viewOnly}
      title="Role"
      description={
        viewOnly
          ? "View role information and permissions"
          : role
          ? "Update role information and permissions"
          : "Add a new role with custom permissions"
      }
      collection="roles"
      requireCompanyId={false}
      flexLayout={true}
      onValidate={() => {
        if (!name.trim()) return "Role name is required"
        if (permissionKeys.length === 0) return "At least one permission must be selected"
        return null
      }}
      onPrepareData={() => ({
        name: name.trim(),
        description: description.trim() || null,
        permissionKeys,
        isActive,
      })}
    >
      {() => (
        <>
          <div className="flex-shrink-0 space-y-4 pb-4">
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
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <PermissionSelector selectedPermissions={permissionKeys} onChange={setPermissionKeys} />
          </div>

          <div className="flex-shrink-0 flex items-center space-x-2 pt-4">
            <Checkbox id="isActive" checked={isActive} onCheckedChange={checked => setIsActive(checked as boolean)} />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active
            </Label>
          </div>
        </>
      )}
    </GenericFormModal>
  )
}
