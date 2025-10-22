"use client"

import { Column } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Filter, X, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilterOption {
  label: string
  value: string
}

interface FilterableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
  filterOptions: FilterOption[]
  enableSorting?: boolean
}

/**
 * Reusable filterable column header component for DataTable
 *
 * Features:
 * - Dropdown filter with custom options
 * - Optional sorting
 * - Visual indicator for active filters
 * - Clear filter option
 *
 * @example
 * {
 *   id: "status",
 *   header: ({ column }) => (
 *     <FilterableColumnHeader
 *       column={column}
 *       title="Status"
 *       filterOptions={[
 *         { label: "All", value: "all" },
 *         { label: "Active", value: "Active" },
 *         { label: "Inactive", value: "Inactive" },
 *         { label: "Expired", value: "Expired" },
 *       ]}
 *       enableSorting={true}
 *     />
 *   ),
 * }
 */
export function FilterableColumnHeader<TData, TValue>({
  column,
  title,
  filterOptions,
  enableSorting = true,
}: FilterableColumnHeaderProps<TData, TValue>) {
  const currentFilter = (column.getFilterValue() as string) || "all"
  const isFiltered = currentFilter !== "all"
  const isSorted = column.getIsSorted()

  const handleFilterChange = (value: string) => {
    if (value === "all") {
      column.setFilterValue(undefined)
    } else {
      column.setFilterValue(value)
    }
  }

  const handleSort = () => {
    if (!enableSorting) return

    if (!isSorted) {
      column.toggleSorting(false) // ascending
    } else if (isSorted === "asc") {
      column.toggleSorting(true) // descending
    } else {
      column.clearSorting() // clear
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-semibold">{title}</span>

      <div className="flex items-center gap-1">
        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2 hover:bg-accent/50",
                isFiltered && "text-primary"
              )}
            >
              <Filter className={cn("h-3.5 w-3.5", isFiltered && "fill-primary")} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[180px]">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Filter by {title}
            </div>
            <DropdownMenuSeparator />
            {filterOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleFilterChange(option.value)}
                className={cn(
                  "cursor-pointer",
                  currentFilter === option.value && "bg-accent font-medium"
                )}
              >
                {option.label}
                {currentFilter === option.value && (
                  <span className="ml-auto text-xs text-primary">✓</span>
                )}
              </DropdownMenuItem>
            ))}
            {isFiltered && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleFilterChange("all")}
                  className="cursor-pointer text-muted-foreground"
                >
                  <X className="mr-2 h-3.5 w-3.5" />
                  Clear filter
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort Button */}
        {enableSorting && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSort}
            className="h-7 px-2 hover:bg-accent/50"
          >
            {isSorted === "asc" ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : isSorted === "desc" ? (
              <ArrowDown className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
