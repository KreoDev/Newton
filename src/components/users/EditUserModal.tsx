"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { User, Role } from "@/types"
import { userOperations } from "@/lib/firebase-utils"
import { toast } from "sonner"

interface EditUserModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  roles: Role[]
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function EditUserModal({ user, isOpen, onClose, roles }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    roleId: "",
  })
  const [isEmailValid, setIsEmailValid] = useState(true)

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        roleId: user.roleId || "",
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
      toast.error("Invalid email format")
      return
    }

    try {
      // Update first name, last name, roleId in Firestore
      await userOperations.update(user.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        roleId: formData.roleId,
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

      toast.success("User updated successfully")
      onClose()
    } catch (error) {
      console.error("Error updating user:", error)
      toast.error("Failed to update user")
    }
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveChanges} disabled={!isEmailValid}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
