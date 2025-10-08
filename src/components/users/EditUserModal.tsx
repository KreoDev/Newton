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
import { ReauthenticateModal } from "./ReauthenticateModal"
import { PasswordPromptModal } from "./PasswordPromptModal"
import { ConvertToContactWarningDialog } from "./ConvertToContactWarningDialog"

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
    phoneNumber: "",
    roleId: "",
    isGlobal: false,
  })
  const [isEmailValid, setIsEmailValid] = useState(true)
  const [showReauthModal, setShowReauthModal] = useState(false)
  const [pendingGlobalAdminAction, setPendingGlobalAdminAction] = useState(false)
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [showContactWarning, setShowContactWarning] = useState(false)
  const [pendingPassword, setPendingPassword] = useState("")

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
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

    // Check if user is being elevated to global admin (wasn't global before, now is)
    const isElevatingToGlobalAdmin = !user.isGlobal && formData.isGlobal

    // If elevating to global admin and not yet authenticated, require re-authentication
    if (isElevatingToGlobalAdmin && !pendingGlobalAdminAction) {
      setPendingGlobalAdminAction(true)
      setShowReauthModal(true)
      return
    }

    // Check if role changed and determine if user type conversion is needed
    const roleChanged = user.roleId !== formData.roleId
    const oldRoleIsContact = user.roleId === "r_contact"
    const newRoleIsContact = formData.roleId === "r_contact"
    const userIsCurrentlyContact = user.canLogin === false
    const userIsCurrentlyLogin = user.canLogin !== false

    // Scenario 1: Contact → Login User (role changed from r_contact to any other role)
    if (roleChanged && oldRoleIsContact && !newRoleIsContact && userIsCurrentlyContact) {
      if (!pendingPassword) {
        setShowPasswordPrompt(true)
        return
      }
      // Password provided, proceed with conversion
    }

    // Scenario 2: Login User → Contact (role changed from any role to r_contact)
    // We need a way to track if warning was shown - use pendingPassword as flag (empty string means warning not yet shown)
    if (roleChanged && !oldRoleIsContact && newRoleIsContact && userIsCurrentlyLogin) {
      if (pendingPassword !== "contact-conversion-confirmed") {
        setShowContactWarning(true)
        return
      }
      // Warning accepted, proceed with conversion
    }

    try {
      // If converting contact → login, create auth account first
      if (roleChanged && oldRoleIsContact && !newRoleIsContact && userIsCurrentlyContact && pendingPassword && pendingPassword !== "contact-conversion-confirmed") {
        const response = await fetch("/api/users/convert-to-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            email: formData.email,
            password: pendingPassword
          }),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || "Failed to convert user to login user")
        }
      }

      // If converting login → contact, delete auth account
      if (roleChanged && !oldRoleIsContact && newRoleIsContact && userIsCurrentlyLogin) {
        const response = await fetch("/api/users/convert-to-contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || "Failed to convert user to contact")
        }
      }

      // Prepare update data
      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        roleId: formData.roleId,
        isGlobal: formData.isGlobal,
      }

      // If role changed, clear permission overrides to ensure clean inheritance from new role
      if (roleChanged) {
        updateData.permissionOverrides = {}
      }

      // Update user details in Firestore
      await userOperations.update(user.id, updateData)

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
      setPendingGlobalAdminAction(false)
      setPendingPassword("")
      onClose()
    } catch (error) {
      console.error("Error updating user:", error)
      showError("Failed to Update User", error instanceof Error ? error.message : "An unexpected error occurred.")
    }
  }

  const handleReauthSuccess = () => {
    setShowReauthModal(false)
    // After successful re-auth, proceed with update
    handleSaveChanges()
  }

  const handleReauthCancel = () => {
    setShowReauthModal(false)
    setPendingGlobalAdminAction(false)
    // Revert the isGlobal checkbox to original state
    if (user) {
      setFormData({ ...formData, isGlobal: user.isGlobal })
    }
  }

  const handlePasswordConfirm = (password: string) => {
    setPendingPassword(password)
    setShowPasswordPrompt(false)
    // Trigger save again with password
    setTimeout(() => handleSaveChanges(), 100)
  }

  const handlePasswordCancel = () => {
    setShowPasswordPrompt(false)
    setPendingPassword("")
    // Revert role back to original
    if (user) {
      setFormData({ ...formData, roleId: user.roleId })
    }
  }

  const handleContactWarningConfirm = () => {
    setShowContactWarning(false)
    setPendingPassword("contact-conversion-confirmed")
    // Trigger save again
    setTimeout(() => handleSaveChanges(), 100)
  }

  const handleContactWarningCancel = () => {
    setShowContactWarning(false)
    // Revert role back to original
    if (user) {
      setFormData({ ...formData, roleId: user.roleId })
    }
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] w-auto h-auto">
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
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input id="phoneNumber" type="tel" value={formData.phoneNumber} onChange={e => handleInputChange("phoneNumber", e.target.value)} placeholder="Enter phone number (optional)" />
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

      <ReauthenticateModal
        isOpen={showReauthModal}
        onClose={handleReauthCancel}
        onSuccess={handleReauthSuccess}
        title="Confirm Global Admin Elevation"
        description={`You are about to elevate ${user?.firstName} ${user?.lastName} to a global administrator. This will grant them access to all companies in the system. Please re-enter your password to confirm this sensitive action.`}
      />

      <PasswordPromptModal
        isOpen={showPasswordPrompt}
        onClose={handlePasswordCancel}
        onConfirm={handlePasswordConfirm}
        userName={`${user?.firstName} ${user?.lastName}`}
      />

      <ConvertToContactWarningDialog
        isOpen={showContactWarning}
        onClose={handleContactWarningCancel}
        onConfirm={handleContactWarningConfirm}
        userName={`${user?.firstName} ${user?.lastName}`}
      />
    </Dialog>
  )
}
