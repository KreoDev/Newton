"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { AlertCircle, Shield } from "lucide-react"

interface ReauthenticateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  title?: string
  description?: string
}

export function ReauthenticateModal({
  isOpen,
  onClose,
  onSuccess,
  title = "Re-authenticate Required",
  description = "For security reasons, please re-enter your password to confirm this sensitive action.",
}: ReauthenticateModalProps) {
  const { user } = useAuth()
  const [password, setPassword] = useState("")
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState("")

  const handleReauthenticate = async () => {
    if (!password) {
      setError("Password is required")
      return
    }

    if (!user?.email || !auth.currentUser) {
      setError("Authentication error: User not found")
      return
    }

    try {
      setIsAuthenticating(true)
      setError("")

      // Create credential with user's email and entered password
      const credential = EmailAuthProvider.credential(user.email, password)

      // Re-authenticate the user
      await reauthenticateWithCredential(auth.currentUser, credential)

      // Success - reset and call success callback
      setPassword("")
      onSuccess()
    } catch (err: any) {
      console.error("Re-authentication error:", err)

      // Handle specific Firebase auth errors
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Incorrect password. Please try again.")
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.")
      } else {
        setError("Authentication failed. Please try again.")
      }
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleClose = () => {
    setPassword("")
    setError("")
    onClose()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isAuthenticating) {
      handleReauthenticate()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="pt-2">{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reauthPassword">Your Password</Label>
            <Input
              id="reauthPassword"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your password"
              autoFocus
              disabled={isAuthenticating}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              This is a security measure to prevent unauthorized changes to sensitive settings.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isAuthenticating}>
            Cancel
          </Button>
          <Button onClick={handleReauthenticate} disabled={isAuthenticating || !password}>
            {isAuthenticating ? "Authenticating..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
