"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { User as UserType } from "@/types"
import { useAlert } from "@/hooks/useAlert"
import { Bell } from "lucide-react"
import { createDocument } from "@/lib/firebase-utils"

interface BulkSendNotificationModalProps {
  open: boolean
  onClose: () => void
  users: UserType[]
  onSuccess: () => void
}

export function BulkSendNotificationModal({ open, onClose, users, onSuccess }: BulkSendNotificationModalProps) {
  const { showSuccess, showError } = useAlert()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")

  const handleSend = async () => {
    if (!title.trim()) {
      showError("Title Required", "Please enter a notification title.")
      return
    }

    if (!message.trim()) {
      showError("Message Required", "Please enter a notification message.")
      return
    }

    try {
      setLoading(true)

      // Create a notification for each user
      const promises = users.map((user) =>
        createDocument(
          "notifications",
          {
            userId: user.id,
            title: title.trim(),
            message: message.trim(),
            type: "announcement",
            read: false,
            companyId: user.companyId,
          },
          "" // No toast for individual notifications
        )
      )

      await Promise.all(promises)

      showSuccess(
        "Notifications Sent",
        `Successfully sent notification to ${users.length} user${users.length > 1 ? "s" : ""}.`
      )

      // Reset form
      setTitle("")
      setMessage("")
      onSuccess()
    } catch (error) {
      showError("Send Failed", error instanceof Error ? error.message : "Failed to send notifications.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Send Notification
          </DialogTitle>
          <DialogDescription>
            Send a notification to {users.length} user{users.length > 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Users list */}
          <div className="space-y-2">
            <Label>Recipients ({users.length})</Label>
            <div className="max-h-24 overflow-y-auto space-y-1 p-3 glass-surface rounded-lg">
              {users.map((user) => (
                <div key={user.id} className="text-sm">
                  {user.firstName} {user.lastName}
                </div>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={loading || !title.trim() || !message.trim()}>
            {loading ? "Sending..." : `Send to ${users.length} User${users.length > 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
