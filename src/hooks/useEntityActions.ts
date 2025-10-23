"use client"

import { useAlert } from "@/hooks/useAlert"
import { updateDocument, deleteDocument } from "@/lib/firebase-utils"

export interface UsageCheckResult {
  inUse: boolean
  count: number
  message?: string
}

export interface UseEntityActionsOptions<T> {
  collection: string
  entityName: string
  usageCheckQuery?: (entity: T) => Promise<UsageCheckResult>
  onToggleValidation?: (entity: T) => Promise<{ allowed: boolean; reason?: string }>
  onDeleteValidation?: (entity: T) => Promise<{ allowed: boolean; reason?: string }>
  canManage: boolean
}

/**
 * Reusable hook for entity actions (toggle status, delete)
 * Handles permissions, validation, usage checks, and error states
 *
 * @example
 * const { toggleStatus, deleteEntity } = useEntityActions({
 *   collection: "products",
 *   entityName: "Product",
 *   usageCheckQuery: async (product) => {
 *     const ordersQuery = query(collection(db, "orders"), where("productId", "==", product.id))
 *     const snapshot = await getDocs(ordersQuery)
 *     return {
 *       inUse: !snapshot.empty,
 *       count: snapshot.size,
 *       message: `This product is used in ${snapshot.size} order(s)`
 *     }
 *   },
 *   canManage: true
 * })
 */
export function useEntityActions<T extends { id: string; isActive: boolean; name?: string }>({
  collection,
  entityName,
  usageCheckQuery,
  onToggleValidation,
  onDeleteValidation,
  canManage,
}: UseEntityActionsOptions<T>) {
  const { showSuccess, showError, showConfirm } = useAlert()

  const toggleStatus = async (entity: T) => {
    // Permission check
    if (!canManage) {
      showError("Permission Denied", `You don't have permission to modify ${entityName.toLowerCase()}s.`)
      return
    }

    // Custom validation before toggle
    if (onToggleValidation) {
      const validation = await onToggleValidation(entity)
      if (!validation.allowed) {
        showError(`Cannot ${entity.isActive ? "Deactivate" : "Activate"}`, validation.reason || "This action is not allowed.")
        return
      }
    }

    try {
      await updateDocument(collection, entity.id, {
        isActive: !entity.isActive,
      })

      const displayName = entity.name || entityName
      showSuccess(
        `${entityName} ${entity.isActive ? "Deactivated" : "Activated"}`,
        `${displayName} has been ${entity.isActive ? "deactivated" : "activated"} successfully.`
      )
    } catch (error) {
      showError(`Failed to Update ${entityName}`, error instanceof Error ? error.message : "An unexpected error occurred.")
    }
  }

  const deleteEntity = async (entity: T) => {
    // Permission check
    if (!canManage) {
      showError("Permission Denied", `You don't have permission to delete ${entityName.toLowerCase()}s.`)
      return
    }

    // Custom validation before delete
    if (onDeleteValidation) {
      const validation = await onDeleteValidation(entity)
      if (!validation.allowed) {
        showError(`Cannot Delete ${entityName}`, validation.reason || "This action is not allowed.")
        return
      }
    }

    try {
      // Check if entity is in use
      if (usageCheckQuery) {
        const usageResult = await usageCheckQuery(entity)

        if (usageResult.inUse) {
          const message =
            usageResult.message ||
            `This ${entityName.toLowerCase()} is used in ${usageResult.count} record(s) and cannot be deleted. You can deactivate it instead to prevent it from being used in new records.`

          showError(`Cannot Delete ${entityName}`, message)
          return
        }
      }

      // Confirm deletion
      const displayName = entity.name || entityName
      const confirmed = await showConfirm(
        `Delete ${entityName}`,
        `Are you sure you want to delete "${displayName}"? This action cannot be undone.`,
        "Delete"
      )

      if (!confirmed) return

      // Delete entity
      await deleteDocument(collection, entity.id, `${entityName} deleted successfully`)
    } catch (error) {
      showError(
        `Failed to Delete ${entityName}`,
        error instanceof Error ? error.message : "An unexpected error occurred."
      )
    }
  }

  return {
    toggleStatus,
    deleteEntity,
  }
}
