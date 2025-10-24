import { useState, useEffect, useMemo } from "react"
import { SearchService, SearchConfig } from "@/services/search.service"

// Re-export SearchConfig for convenience
export type { SearchConfig }

export interface UseOptimizedSearchResult<T> {
  searchTerm: string
  setSearchTerm: (term: string) => void
  filteredItems: T[]
  isSearching: boolean
  resultCount: number
  hasResults: boolean
  isEmpty: boolean
}

export function useOptimizedSearch<T>(items: T[], config: SearchConfig): UseOptimizedSearchResult<T> {
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedTerm, setDebouncedTerm] = useState("")
  const [filteredItems, setFilteredItems] = useState<T[]>(items)
  const [isSearching, setIsSearching] = useState(false)

  // Update filtered items when items change and no search term
  useEffect(() => {
    if (!debouncedTerm) {
      setFilteredItems(items)
    }
  }, [items, debouncedTerm])

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm)
    }, config.debounceMs || 300)

    return () => clearTimeout(timer)
  }, [searchTerm, config.debounceMs])

  // Memoized search function to prevent unnecessary recalculations
  const searchFunction = useMemo(() => {
    return (items: T[], term: string): T[] => {
      return SearchService.search(items, term, config)
    }
  }, [config])

  // Perform search when debounced term or items change
  useEffect(() => {
    setIsSearching(true)

    const performSearch = () => {
      const results = searchFunction(items, debouncedTerm)
      setFilteredItems(results)
      setIsSearching(false)
    }

    // Use requestIdleCallback for non-blocking search when available
    if ("requestIdleCallback" in window) {
      const handle = requestIdleCallback(performSearch, { timeout: 100 })
      return () => cancelIdleCallback(handle)
    } else {
      const timer = setTimeout(performSearch, 0)
      return () => clearTimeout(timer)
    }
  }, [items, debouncedTerm, searchFunction])

  return {
    searchTerm,
    setSearchTerm,
    filteredItems,
    isSearching,
    resultCount: filteredItems.length,
    hasResults: filteredItems.length > 0,
    isEmpty: debouncedTerm.length > 0 && filteredItems.length === 0,
  }
}
