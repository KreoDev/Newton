"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Mail, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { InlineSpinner } from "@/components/ui/loading-spinner"

interface ChangeEmailModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ChangeEmailModal({ isOpen, onClose }: ChangeEmailModalProps) {
  const { user, refreshUser } = useAuth()
  const [formData, setFormData] = useState({
    newEmail: "",
    currentPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({
    newEmail: "",
    currentPassword: "",
    general: "",
  })

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address"
    }
    return ""
  }

  const validateForm = () => {
    const newErrors = {
      newEmail: "",
      currentPassword: "",
      general: "",
    }

    if (!formData.newEmail) {
      newErrors.newEmail = "New email is required"
    } else {
      const emailValidation = validateEmail(formData.newEmail)
      if (emailValidation) {
        newErrors.newEmail = emailValidation
      } else if (formData.newEmail === user?.email) {
        newErrors.newEmail = "New email must be different from current email"
      }
    }

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required for security verification"
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== "")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!user?.email) {
      toast.error("User email not found")
      return
    }

    setIsLoading(true)

    try {
      // Verify current password by re-authenticating
      await signInWithEmailAndPassword(auth, user.email, formData.currentPassword)

      // Call API to update email
      const response = await fetch("/api/users/update-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          newEmail: formData.newEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 400 && data.error?.includes("email")) {
          throw new Error("This email address is already in use by another account")
        }
        throw new Error(data.error || "Failed to update email")
      }

      // Refresh user data to reflect the new email
      await refreshUser()

      toast.success("Email updated successfully", {
        description: `Your email has been changed to ${formData.newEmail}. Please use this email for future logins.`,
      })

      // Clear form and close modal
      setFormData({
        newEmail: "",
        currentPassword: "",
      })
      setErrors({
        newEmail: "",
        currentPassword: "",
        general: "",
      })
      onClose()
    } catch (error: any) {
      console.error("Error changing email:", error)

      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        setErrors(prev => ({ ...prev, currentPassword: "Current password is incorrect" }))
      } else if (error.code === "auth/too-many-requests") {
        setErrors(prev => ({ ...prev, general: "Too many failed attempts. Please try again later." }))
      } else if (error.message?.includes("email")) {
        setErrors(prev => ({ ...prev, newEmail: error.message }))
      } else {
        toast.error("Failed to update email", {
          description: error.message || "An unexpected error occurred. Please try again.",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    // Clear sensitive data
    setFormData({
      newEmail: "",
      currentPassword: "",
    })
    setErrors({
      newEmail: "",
      currentPassword: "",
      general: "",
    })
    setShowPassword(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Change Email Address</span>
          </DialogTitle>
          <DialogDescription>Enter your new email address and current password for verification.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.general}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="currentEmail">Current Email</Label>
            <Input id="currentEmail" type="email" value={user?.email || ""} disabled className="bg-muted" />
            <div className="text-xs text-muted-foreground">This is your current email address</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newEmail">New Email Address</Label>
            <Input id="newEmail" type="email" value={formData.newEmail} onChange={e => setFormData(prev => ({ ...prev, newEmail: e.target.value }))} placeholder="Enter your new email address" className={errors.newEmail ? "border-red-500" : ""} />
            {errors.newEmail && <p className="text-sm text-red-600">{errors.newEmail}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input id="currentPassword" type={showPassword ? "text" : "password"} value={formData.currentPassword} onChange={e => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))} placeholder="Enter your current password" className={errors.currentPassword ? "border-red-500" : ""} />
              <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.currentPassword && <p className="text-sm text-red-600">{errors.currentPassword}</p>}
            <div className="text-xs text-muted-foreground">Required for security verification</div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Important:</p>
                <p>After changing your email, you&apos;ll need to use the new email address for future logins.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <InlineSpinner className="mr-2" />
                  Updating...
                </>
              ) : (
                "Update Email"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
