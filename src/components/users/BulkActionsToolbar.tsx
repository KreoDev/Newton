"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Trash2,
  Shield,
  CheckCircle,
  XCircle,
  Download,
  Bell,
  X,
} from "lucide-react"
import type { User as UserType } from "@/types"
import { BulkMoveCompanyModal } from "./bulk-actions/BulkMoveCompanyModal"
import { BulkDeleteModal } from "./bulk-actions/BulkDeleteModal"
import { BulkChangeRoleModal } from "./bulk-actions/BulkChangeRoleModal"
import { BulkActivateModal } from "./bulk-actions/BulkActivateModal"
import { BulkDeactivateModal } from "./bulk-actions/BulkDeactivateModal"
import { BulkSendNotificationModal } from "./bulk-actions/BulkSendNotificationModal"
import { exportUsersToCSV } from "@/services/user-bulk.service"

interface BulkActionsToolbarProps {
  selectedUsers: UserType[]
  currentUserId: string
  canManage: boolean
  canViewAllCompanies: boolean
  onClearSelection: () => void
  onSuccess: () => void
}

export function BulkActionsToolbar({
  selectedUsers,
  currentUserId,
  canManage,
  canViewAllCompanies,
  onClearSelection,
  onSuccess,
}: BulkActionsToolbarProps) {
  const [moveModalOpen, setMoveModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [activateModalOpen, setActivateModalOpen] = useState(false)
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false)
  const [notificationModalOpen, setNotificationModalOpen] = useState(false)

  // Filter users for specific actions
  const usersForMove = selectedUsers.filter((u) => u.id !== currentUserId)
  const usersForDelete = selectedUsers.filter((u) => u.id !== currentUserId)
  const usersForDeactivate = selectedUsers.filter(
    (u) => u.id !== currentUserId && u.isActive
  )
  const usersForActivate = selectedUsers.filter((u) => !u.isActive)

  const handleExport = () => {
    exportUsersToCSV(selectedUsers)
  }

  if (selectedUsers.length === 0) return null

  return (
    <>
      <div className="sticky top-0 z-50 bg-primary/95 backdrop-blur-sm border border-primary/20 rounded-lg shadow-lg p-4 mb-4 animate-in slide-in-from-top duration-200">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-base px-3 py-1">
              {selectedUsers.length} user{selectedUsers.length > 1 ? "s" : ""}{" "}
              selected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Move to Company */}
            {canManage && canViewAllCompanies && usersForMove.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setMoveModalOpen(true)}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Move to Company
              </Button>
            )}

            {/* Change Role */}
            {canManage && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRoleModalOpen(true)}
              >
                <Shield className="h-4 w-4 mr-2" />
                Change Role
              </Button>
            )}

            {/* Activate */}
            {canManage && usersForActivate.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActivateModalOpen(true)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Activate ({usersForActivate.length})
              </Button>
            )}

            {/* Deactivate */}
            {canManage && usersForDeactivate.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeactivateModalOpen(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Deactivate ({usersForDeactivate.length})
              </Button>
            )}

            {/* Send Notification */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setNotificationModalOpen(true)}
            >
              <Bell className="h-4 w-4 mr-2" />
              Send Notification
            </Button>

            {/* Export */}
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            {/* Delete */}
            {canManage && usersForDelete.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteModalOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({usersForDelete.length})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <BulkMoveCompanyModal
        open={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        users={usersForMove}
        onSuccess={() => {
          setMoveModalOpen(false)
          onSuccess()
        }}
      />

      <BulkDeleteModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        users={usersForDelete}
        onSuccess={() => {
          setDeleteModalOpen(false)
          onSuccess()
        }}
      />

      <BulkChangeRoleModal
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        users={selectedUsers}
        onSuccess={() => {
          setRoleModalOpen(false)
          onSuccess()
        }}
      />

      <BulkActivateModal
        open={activateModalOpen}
        onClose={() => setActivateModalOpen(false)}
        users={usersForActivate}
        onSuccess={() => {
          setActivateModalOpen(false)
          onSuccess()
        }}
      />

      <BulkDeactivateModal
        open={deactivateModalOpen}
        onClose={() => setDeactivateModalOpen(false)}
        users={usersForDeactivate}
        onSuccess={() => {
          setDeactivateModalOpen(false)
          onSuccess()
        }}
      />

      <BulkSendNotificationModal
        open={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
        users={selectedUsers}
        onSuccess={() => {
          setNotificationModalOpen(false)
          onSuccess()
        }}
      />
    </>
  )
}
