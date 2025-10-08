"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, XCircle } from "lucide-react"

interface ConvertToContactWarningDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  userName: string
}

export function ConvertToContactWarningDialog({
  isOpen,
  onClose,
  onConfirm,
  userName,
}: ConvertToContactWarningDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Convert to Contact-Only User</DialogTitle>
          </div>
          <DialogDescription>
            You are about to convert <strong>{userName}</strong> from a login user to a contact-only user.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-4 bg-destructive/10 border-2 border-destructive/30 rounded-md">
            <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-destructive">
                Warning: This action will permanently delete authentication credentials
              </p>
              <ul className="text-sm text-destructive space-y-1 list-disc list-inside">
                <li>The user&apos;s Firebase Authentication account will be permanently deleted</li>
                <li>The user will no longer be able to log in to the system</li>
                <li>The user&apos;s password and authentication data will be lost</li>
                <li>The user&apos;s Firestore profile will be kept for contact purposes</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <strong>Important:</strong> If you need to convert this user back to a login user in the future, you will need to create new login credentials for them.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Yes, Convert to Contact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
