"use client"

import type { User as UserType } from "@/types"
import { bulkUpdateUsers } from "@/services/user-bulk.service"
import { CheckCircle } from "lucide-react"
import { GenericBulkActionModal, type GenericBulkActionModalConfig } from "@/components/ui/generic-bulk-action-modal"

interface BulkActivateModalProps {
  open: boolean
  onClose: () => void
  users: UserType[]
  onSuccess: () => void
}

export function BulkActivateModal({ open, onClose, users, onSuccess }: BulkActivateModalProps) {
  const config: GenericBulkActionModalConfig<UserType> = {
    title: "Activate Users",
    description: "Activate",
    icon: CheckCircle,
    iconColor: "text-green-600",
    buttonText: "Activate",
    buttonClassName: "bg-green-600 hover:bg-green-700",
    loadingText: "Activating...",
    successTitle: "Users Activated",
    successMessage: `Successfully activated ${users.length} user${users.length > 1 ? "s" : ""}.`,
    errorTitle: "Activation Failed",
    itemsLabel: "User",
    onConfirm: async (items) => {
      await bulkUpdateUsers(
        items.map((u) => u.id),
        { isActive: true }
      )
    },
    renderItem: (user) => (
      <>
        {user.firstName} {user.lastName} <span className="text-muted-foreground text-xs">({user.email})</span>
      </>
    ),
  }

  return <GenericBulkActionModal open={open} onClose={onClose} items={users} onSuccess={onSuccess} config={config} />
}
