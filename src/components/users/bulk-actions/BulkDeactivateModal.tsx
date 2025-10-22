"use client"

import type { User as UserType } from "@/types"
import { bulkUpdateUsers } from "@/services/user-bulk.service"
import { XCircle } from "lucide-react"
import { GenericBulkActionModal, type GenericBulkActionModalConfig } from "@/components/ui/generic-bulk-action-modal"

interface BulkDeactivateModalProps {
  open: boolean
  onClose: () => void
  users: UserType[]
  onSuccess: () => void
}

export function BulkDeactivateModal({ open, onClose, users, onSuccess }: BulkDeactivateModalProps) {
  const config: GenericBulkActionModalConfig<UserType> = {
    title: "Deactivate Users",
    description: "Deactivate",
    icon: XCircle,
    iconColor: "text-orange-600",
    buttonText: "Deactivate",
    buttonVariant: "destructive",
    loadingText: "Deactivating...",
    successTitle: "Users Deactivated",
    successMessage: `Successfully deactivated ${users.length} user${users.length > 1 ? "s" : ""}.`,
    errorTitle: "Deactivation Failed",
    itemsLabel: "User",
    onConfirm: async (items) => {
      await bulkUpdateUsers(
        items.map((u) => u.id),
        { isActive: false }
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
