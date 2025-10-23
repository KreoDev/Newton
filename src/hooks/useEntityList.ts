"use client"

import { useState } from "react"
import { useViewPermission } from "@/hooks/useViewPermission"
import { useOptimizedSearch, SearchConfig } from "@/hooks/useOptimizedSearch"
import type { PermissionKey } from "@/lib/permissions"

export interface UseEntityListOptions<T> {
  items: T[]
  searchConfig: SearchConfig
  viewPermission: PermissionKey
  managePermission: PermissionKey
  globalDataLoading: boolean
}

/**
 * Reusable hook for entity list pages
 * Handles permissions, search, filtering, and loading states
 *
 * @example
 * const {
 *   canView, canManage, isViewOnly, permissionLoading,
 *   searchTerm, setSearchTerm,
 *   filterStatus, setFilterStatus,
 *   filteredItems,
 *   isSearching
 * } = useEntityList({
 *   items: products,
 *   searchConfig: SEARCH_CONFIGS.products,
 *   viewPermission: PERMISSIONS.ADMIN_PRODUCTS_VIEW,
 *   managePermission: PERMISSIONS.ADMIN_PRODUCTS,
 *   globalDataLoading: loading
 * })
 */
export function useEntityList<T extends { isActive?: boolean }>({
  items,
  searchConfig,
  viewPermission,
  managePermission,
  globalDataLoading,
}: UseEntityListOptions<T>) {
  // Permission checks
  const { canView, canManage, isViewOnly, loading: permissionLoading } = useViewPermission(
    viewPermission,
    managePermission
  )

  // Search
  const { searchTerm, setSearchTerm, filteredItems: searchedItems, isSearching } = useOptimizedSearch(
    items,
    searchConfig
  )

  // Filter by status
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const filteredItems = searchedItems.filter((item) => {
    if (filterStatus === "all") return true
    if (item.isActive === undefined) return true // Skip filtering if no isActive field
    return filterStatus === "active" ? item.isActive : !item.isActive
  })

  // Combined loading state
  const loading = globalDataLoading || permissionLoading

  return {
    // Permissions
    canView,
    canManage,
    isViewOnly,
    permissionLoading,

    // Search
    searchTerm,
    setSearchTerm,
    isSearching,

    // Filter
    filterStatus,
    setFilterStatus,

    // Data
    filteredItems,
    loading,
  }
}
