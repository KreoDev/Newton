"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, KeyRound } from "lucide-react"

interface PasswordPromptModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (password: string) => void
  userName: string
}

export function PasswordPromptModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
}: PasswordPromptModalProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")

  const handleConfirm = () => {
    setError("")

    if (!password) {
      setError("Password is required")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    onConfirm(password)
    setPassword("")
    setConfirmPassword("")
  }

  const handleClose = () => {
    setPassword("")
    setConfirmPassword("")
    setError("")
    onClose()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && password && confirmPassword) {
      handleConfirm()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <DialogTitle>Create Login Credentials</DialogTitle>
          </div>
          <DialogDescription>
            You are converting <strong>{userName}</strong> from a contact-only user to a login user.
            Please create a password for this user&apos;s account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-md">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-800 dark:text-blue-200">
              This will create a Firebase Authentication account for this user, allowing them to log in to the system.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter password (min 6 characters)"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Re-enter password"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!password || !confirmPassword}>
            Create Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
