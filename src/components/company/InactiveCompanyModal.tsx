"use client"

import { AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface InactiveCompanyModalProps {
  open: boolean
  companyName: string
  onLogout: () => void
}

/**
 * Modal shown to regular users when their company becomes inactive
 * Forces logout with informative message
 */
export function InactiveCompanyModal({ open, companyName, onLogout }: InactiveCompanyModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={e => e.preventDefault()}
        onPointerDownOutside={e => e.preventDefault()}
        onInteractOutside={e => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Company Deactivated
          </DialogTitle>
          <DialogDescription>Your company account has been deactivated</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{companyName}</strong> has been deactivated by an administrator. You will now be logged out and will not be able to access
              the system until your company is reactivated.
            </AlertDescription>
          </Alert>

          <div className="text-sm text-muted-foreground space-y-2">
            <p>If you believe this is an error, please contact your system administrator or company owner.</p>
            <p className="font-semibold">Click the button below to log out.</p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onLogout} variant="destructive" className="w-full">
            Log Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
