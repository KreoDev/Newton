import { useState, useMemo } from "react"
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react"

export type SortDirection = "asc" | "desc" | null

export interface SortConfig {
  key: string
  direction: SortDirection
}

export function useTableSort<T>(data: T[], defaultSortKey?: string) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: defaultSortKey || "",
    direction: null,
  })

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return data
    }

    return [...data].sort((a, b) => {
      const aValue = getNestedValue(a as Record<string, unknown>, sortConfig.key)
      const bValue = getNestedValue(b as Record<string, unknown>, sortConfig.key)

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1
      }
      return 0
    })
  }, [data, sortConfig])

  const requestSort = (key: string) => {
    let direction: SortDirection = "asc"

    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc"
      } else if (sortConfig.direction === "desc") {
        direction = null
      } else {
        direction = "asc"
      }
    }

    setSortConfig({ key, direction })
  }

  const getSortIcon = (columnKey: string) => {
    const iconProps = { className: "ml-2 h-4 w-4 inline-block" }
    if (sortConfig.key !== columnKey || !sortConfig.direction) {
      return <ChevronsUpDown {...iconProps} />
    }
    if (sortConfig.direction === "asc") {
      return <ArrowUp {...iconProps} />
    }
    if (sortConfig.direction === "desc") {
      return <ArrowDown {...iconProps} />
    }
    return <ChevronsUpDown {...iconProps} />
  }

  return {
    sortedData,
    requestSort,
    sortConfig,
    getSortIcon,
  }
}

// Helper function to get nested object values
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current, key) => {
    if (current && typeof current === "object" && current !== null) {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj as unknown)
}
