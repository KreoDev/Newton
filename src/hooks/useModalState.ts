import { useState, useCallback } from "react"

/**
 * Hook for managing modal state in admin pages
 * Simplifies create/edit/view modal management
 */
export function useModalState<T>() {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editEntity, setEditEntity] = useState<T | null>(null)
  const [viewEntity, setViewEntity] = useState<T | null>(null)

  const showCreateModal = useCallback(() => {
    setCreateModalOpen(true)
  }, [])

  const hideCreateModal = useCallback(() => {
    setCreateModalOpen(false)
  }, [])

  const showEditModal = useCallback((entity: T) => {
    setEditEntity(entity)
  }, [])

  const hideEditModal = useCallback(() => {
    setEditEntity(null)
  }, [])

  const showViewModal = useCallback((entity: T) => {
    setViewEntity(entity)
  }, [])

  const hideViewModal = useCallback(() => {
    setViewEntity(null)
  }, [])

  const closeAll = useCallback(() => {
    setCreateModalOpen(false)
    setEditEntity(null)
    setViewEntity(null)
  }, [])

  return {
    // Create modal
    createModal: {
      open: createModalOpen,
      show: showCreateModal,
      hide: hideCreateModal,
    },
    // Edit modal
    editModal: {
      open: Boolean(editEntity),
      entity: editEntity,
      show: showEditModal,
      hide: hideEditModal,
    },
    // View modal
    viewModal: {
      open: Boolean(viewEntity),
      entity: viewEntity,
      show: showViewModal,
      hide: hideViewModal,
    },
    // Utilities
    closeAll,
  }
}

/**
 * Simplified version for pages that only need create/edit
 */
export function useSimpleModalState<T>() {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editEntity, setEditEntity] = useState<T | undefined>(undefined)

  return {
    showCreateModal: createModalOpen,
    setShowCreateModal: setCreateModalOpen,
    editingEntity: editEntity,
    setEditingEntity: setEditEntity,
    closeAll: () => {
      setCreateModalOpen(false)
      setEditEntity(undefined)
    },
  }
}
