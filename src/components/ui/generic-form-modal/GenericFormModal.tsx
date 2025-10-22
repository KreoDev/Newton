"use client"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAlert } from "@/hooks/useAlert"
import { useAuth } from "@/contexts/AuthContext"
import { createDocument, updateDocument } from "@/lib/firebase-utils"

export interface GenericFormModalProps<T> {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  entity?: T & { id: string }
  viewOnly?: boolean
  title: string
  description?: string
  collection: string
  children: (props: {
    isEditing: boolean
    viewOnly: boolean
    entity?: T & { id: string }
  }) => React.ReactNode
  onValidate?: (entity?: T & { id: string }) => string | null
  onPrepareData: (entity?: T & { id: string }) => Partial<T>
  successMessage?: {
    create?: string
    update?: string
  }
  requireCompanyId?: boolean
  maxWidth?: string
  flexLayout?: boolean
}

export function GenericFormModal<T>({
  open,
  onClose,
  onSuccess,
  entity,
  viewOnly = false,
  title,
  description,
  collection,
  children,
  onValidate,
  onPrepareData,
  successMessage,
  requireCompanyId = true,
  maxWidth = "max-w-[calc(100vw-3rem)]",
  flexLayout = false,
}: GenericFormModalProps<T>) {
  const { user } = useAuth()
  const { showSuccess, showError } = useAlert()
  const [loading, setLoading] = useState(false)
  const isEditing = Boolean(entity)

  const entityName = title.replace(/^(View|Edit|Create New)\s+/i, "")

  const getTitle = () => {
    if (viewOnly) return `View ${entityName}`
    if (isEditing) return `Edit ${entityName}`
    return `Create New ${entityName}`
  }

  const getDescription = () => {
    if (description) return description
    if (viewOnly) return `View ${entityName.toLowerCase()} information`
    if (isEditing) return `Update ${entityName.toLowerCase()} information`
    return `Add a new ${entityName.toLowerCase()}`
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // Custom validation
      if (onValidate) {
        const validationError = onValidate(entity)
        if (validationError) {
          showError("Validation Error", validationError)
          return
        }
      }

      // Check company ID if required
      if (requireCompanyId && !user?.companyId) {
        showError("Error", "User company not found")
        return
      }

      try {
        setLoading(true)

        // Prepare data
        let data = onPrepareData(entity)

        // Add company ID if required
        if (requireCompanyId && user?.companyId) {
          data = { ...data, companyId: user.companyId } as Partial<T>
        }

        if (isEditing && entity) {
          await updateDocument(collection, entity.id, data)
          const message = successMessage?.update || `${entityName} has been updated successfully.`
          showSuccess(`${entityName} Updated`, message)
        } else {
          await createDocument(collection, data)
          const message = successMessage?.create || `${entityName} has been created successfully.`
          showSuccess(`${entityName} Created`, message)
        }

        onSuccess()
        onClose()
      } catch (error) {
        console.error(`Error saving ${entityName.toLowerCase()}:`, error)
        showError(
          `Failed to ${isEditing ? "Update" : "Create"} ${entityName}`,
          error instanceof Error ? error.message : "An unexpected error occurred."
        )
      } finally {
        setLoading(false)
      }
    },
    [
      entity,
      onValidate,
      requireCompanyId,
      user?.companyId,
      onPrepareData,
      isEditing,
      collection,
      showSuccess,
      successMessage,
      entityName,
      showError,
      onSuccess,
      onClose,
    ]
  )

  const contentClass = flexLayout
    ? `${maxWidth} max-h-[calc(100vh-3rem)] w-auto h-auto flex flex-col`
    : `${maxWidth} max-h-[calc(100vh-3rem)] w-auto h-auto`

  const formClass = flexLayout ? "flex-1 flex flex-col overflow-hidden" : "space-y-4"

  const fieldsetClass = flexLayout ? "flex-1 flex flex-col overflow-hidden" : "space-y-4"

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={contentClass}>
        <DialogHeader className={flexLayout ? "flex-shrink-0" : ""}>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className={formClass}>
          <fieldset disabled={viewOnly} className={fieldsetClass}>
            {children({ isEditing, viewOnly, entity })}
          </fieldset>

          {viewOnly ? (
            <div className={`flex justify-end pt-4 border-t ${flexLayout ? "flex-shrink-0" : ""}`}>
              <Button type="button" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : (
            <div className={`flex justify-end gap-3 pt-4 border-t ${flexLayout ? "flex-shrink-0" : ""}`}>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : isEditing ? `Update ${entityName}` : `Create ${entityName}`}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
