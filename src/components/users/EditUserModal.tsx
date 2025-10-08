"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { User, Role } from "@/types"
import { userOperations } from "@/lib/firebase-utils"
import { useAlert } from "@/hooks/useAlert"
import { filterVisibleRoles } from "@/lib/role-utils"
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle } from "lucide-react"

interface EditUserModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  roles: Role[]
  viewOnly?: boolean
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function EditUserModal({ user, isOpen, onClose, roles, viewOnly = false }: EditUserModalProps) {
  const { showSuccess, showError } = useAlert()
  const { hasPermission } = usePermission(PERMISSIONS.ADMIN_USERS_MANAGE_GLOBAL_ADMINS)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    roleId: "",
    isGlobal: false,
  })
  const [isEmailValid, setIsEmailValid] = useState(true)

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        roleId: user.roleId || "",
        isGlobal: user.isGlobal || false,
      })
      setIsEmailValid(true)
    }
  }, [user])

  useEffect(() => {
    setIsEmailValid(emailRegex.test(formData.email))
  }, [formData.email])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleRoleChange = (roleId: string) => {
    setFormData(prev => ({ ...prev, roleId }))
  }

  const handleSaveChanges = async () => {
    if (!user) return
    if (!isEmailValid) {
      showError("Invalid Email", "Please enter a valid email address.")
      return
    }

    try {
      // Update first name, last name, roleId, isGlobal in Firestore
      await userOperations.update(user.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        roleId: formData.roleId,
        isGlobal: formData.isGlobal,
      })

      // If email has changed, update it via API route
      if (formData.email !== user.email) {
        const response = await fetch("/api/users/update-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, newEmail: formData.email }),
        })
        if (!response.ok) throw new Error("Failed to update email")
      }

      showSuccess("User Updated", `${formData.firstName} ${formData.lastName} has been updated successfully.`)
      onClose()
    } catch (error) {
      console.error("Error updating user:", error)
      showError("Failed to Update User", error instanceof Error ? error.message : "An unexpected error occurred.")
    }
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{viewOnly ? "View User" : "Edit User"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <fieldset disabled={viewOnly} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" value={formData.firstName} onChange={e => handleInputChange("firstName", e.target.value)} placeholder="Enter first name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" value={formData.lastName} onChange={e => handleInputChange("lastName", e.target.value)} placeholder="Enter last name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={formData.email} onChange={e => handleInputChange("email", e.target.value)} placeholder="Enter email address" className={!isEmailValid ? "border-red-500" : ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.roleId} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {filterVisibleRoles(roles, user.companyId).map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasPermission && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="isGlobal_edit" checked={formData.isGlobal} onCheckedChange={checked => handleInputChange("isGlobal", String(checked))} />
                <div className="flex-1">
                  <Label htmlFor="isGlobal_edit" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Global Administrator
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">Allow this user to switch between and manage all companies</p>
                </div>
              </div>
              {formData.isGlobal && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    <strong>Warning:</strong> Global administrators have access to all companies and can perform administrative tasks across the entire system. Only grant this permission to trusted users.
                  </p>
                </div>
              )}
            </div>
          )}
          </fieldset>
        </div>
        <DialogFooter>
          {viewOnly ? (
            <Button onClick={onClose}>Close</Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSaveChanges} disabled={!isEmailValid}>
                Save Changes
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
