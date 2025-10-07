"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAlert } from "@/hooks/useAlert"
import { data } from "@/services/data.service"
import { InlineSpinner } from "@/components/ui/loading-spinner"
import { filterVisibleRoles } from "@/lib/role-utils"

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  companyId: string
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AddUserModal({ isOpen, onClose, companyId }: AddUserModalProps) {
  const { showSuccess, showError } = useAlert()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    roleId: "",
  })
  const [isEmailValid, setIsEmailValid] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (formData.email === "") {
      setIsEmailValid(true)
    } else {
      setIsEmailValid(emailRegex.test(formData.email))
    }
  }, [formData.email])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddUser = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.roleId) {
      showError("Missing Information", "Please fill in all fields.")
      return
    }
    if (!isEmailValid) {
      showError("Invalid Email", "Please enter a valid email address.")
      return
    }
    if (formData.password.length < 6) {
      showError("Weak Password", "Password must be at least 6 characters long.")
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, companyId }),
      })

      if (!response.ok) {
        throw new Error("Failed to add user")
      }

      showSuccess("User Added", `${formData.firstName} ${formData.lastName} has been added successfully.`)
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        roleId: "",
      })
      onClose()
    } catch (error) {
      console.error("Error adding user:", error)
      showError("Failed to Add User", error instanceof Error ? error.message : "An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>Create a new user account and assign them a role.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="firstName_add">First Name</Label>
            <Input id="firstName_add" value={formData.firstName} onChange={e => handleInputChange("firstName", e.target.value)} placeholder="Enter first name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName_add">Last Name</Label>
            <Input id="lastName_add" value={formData.lastName} onChange={e => handleInputChange("lastName", e.target.value)} placeholder="Enter last name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email_add">Email</Label>
            <Input id="email_add" type="email" value={formData.email} onChange={e => handleInputChange("email", e.target.value)} placeholder="Enter email address" className={!isEmailValid ? "border-red-500" : ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password_add">Password</Label>
            <Input id="password_add" type="password" value={formData.password} onChange={e => handleInputChange("password", e.target.value)} placeholder="Enter password (min. 6 characters)" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role_add">Role</Label>
            <Select value={formData.roleId} onValueChange={value => handleInputChange("roleId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {filterVisibleRoles(data.roles.value, companyId).map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleAddUser} disabled={!isEmailValid || isSubmitting}>
            {isSubmitting ? (
              <>
                <InlineSpinner className="mr-2" />
                Adding...
              </>
            ) : (
              "Add User"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
