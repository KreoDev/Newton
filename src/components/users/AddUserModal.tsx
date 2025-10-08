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
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle } from "lucide-react"
import { ReauthenticateModal } from "./ReauthenticateModal"

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  companyId: string
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AddUserModal({ isOpen, onClose, companyId }: AddUserModalProps) {
  const { showSuccess, showError } = useAlert()
  const { hasPermission } = usePermission(PERMISSIONS.ADMIN_USERS_MANAGE_GLOBAL_ADMINS)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    roleId: "",
    isGlobal: false,
  })
  const [isEmailValid, setIsEmailValid] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReauthModal, setShowReauthModal] = useState(false)
  const [pendingGlobalAdminAction, setPendingGlobalAdminAction] = useState(false)

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
    const isContactRole = formData.roleId === "r_contact"

    // Validate required fields (password not required for contact-only users)
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.roleId) {
      showError("Missing Information", "Please fill in all required fields.")
      return
    }

    // Password validation only for login users
    if (!isContactRole) {
      if (!formData.password) {
        showError("Password Required", "Password is required for login users.")
        return
      }
      if (formData.password.length < 6) {
        showError("Weak Password", "Password must be at least 6 characters long.")
        return
      }
    }

    if (!isEmailValid) {
      showError("Invalid Email", "Please enter a valid email address.")
      return
    }

    // If making user a global admin, require re-authentication
    if (formData.isGlobal && !pendingGlobalAdminAction) {
      setPendingGlobalAdminAction(true)
      setShowReauthModal(true)
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
        phoneNumber: "",
        password: "",
        roleId: "",
        isGlobal: false,
      })
      setPendingGlobalAdminAction(false)
      onClose()
    } catch (error) {
      console.error("Error adding user:", error)
      showError("Failed to Add User", error instanceof Error ? error.message : "An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReauthSuccess = () => {
    setShowReauthModal(false)
    // After successful re-auth, proceed with user creation
    handleAddUser()
  }

  const handleReauthCancel = () => {
    setShowReauthModal(false)
    setPendingGlobalAdminAction(false)
    // Uncheck the global admin checkbox
    setFormData({ ...formData, isGlobal: false })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] w-auto h-auto">
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
            <Label htmlFor="phoneNumber_add">Phone Number</Label>
            <Input id="phoneNumber_add" type="tel" value={formData.phoneNumber} onChange={e => handleInputChange("phoneNumber", e.target.value)} placeholder="Enter phone number (optional)" />
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

          {formData.roleId === "r_contact" && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-md">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Contact-Only User:</strong> This user will not have login credentials and cannot access the system. They will be stored as a contact for reference purposes only.
              </p>
            </div>
          )}

          {formData.roleId !== "r_contact" && (
            <div className="space-y-2">
              <Label htmlFor="password_add">Password</Label>
              <Input id="password_add" type="password" value={formData.password} onChange={e => handleInputChange("password", e.target.value)} placeholder="Enter password (min. 6 characters)" />
            </div>
          )}

          {hasPermission && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="isGlobal_add" checked={formData.isGlobal} onCheckedChange={checked => handleInputChange("isGlobal", String(checked))} />
                <div className="flex-1">
                  <Label htmlFor="isGlobal_add" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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

      <ReauthenticateModal
        isOpen={showReauthModal}
        onClose={handleReauthCancel}
        onSuccess={handleReauthSuccess}
        title="Confirm Global Admin Assignment"
        description="You are about to grant global administrator privileges to this user. This will allow them to access and manage all companies in the system. Please re-enter your password to confirm this sensitive action."
      />
    </Dialog>
  )
}
