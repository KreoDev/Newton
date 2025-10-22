"use client"

import { Column } from "@tanstack/react-table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Filter, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilterOption {
  label: string
  value: string
}

interface FilterableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
  filterOptions: FilterOption[]
}

/**
 * Reusable filterable column header component for DataTable
 *
 * Features:
 * - Dropdown filter with custom options
 * - Visual indicator for active filters
 * - Clear filter option
 * - Sorting handled by DataTableHeader wrapper
 *
 * Note: This component does NOT handle sorting - DataTableHeader handles it.
 * The filter icon is positioned at the end of the cell without button styling
 * to match other table headers.
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
 *     />
 *   ),
 *   enableSorting: true, // DataTableHeader handles sorting
 *   enableColumnFilter: true,
 *   filterFn: (row, columnId, filterValue) => {
 *     if (!filterValue || filterValue === "all") return true
 *     return row.getValue(columnId) === filterValue
 *   },
 * }
 */
export function FilterableColumnHeader<TData, TValue>({
  column,
  title,
  filterOptions,
}: FilterableColumnHeaderProps<TData, TValue>) {
  const currentFilter = (column.getFilterValue() as string) || "all"
  const isFiltered = currentFilter !== "all"

  const handleFilterChange = (value: string) => {
    if (value === "all") {
      column.setFilterValue(undefined)
    } else {
      column.setFilterValue(value)
    }
  }

  return (
    <div className="flex items-center w-full gap-2">
      <span>{title}</span>

      {/* Filter Dropdown - positioned at absolute right edge of cell */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div
            className={cn(
              "cursor-pointer p-1 hover:opacity-70 transition-opacity ml-auto -mr-2",
              isFiltered && "text-primary"
            )}
          >
            <Filter className={cn("h-4 w-4 opacity-50", isFiltered && "fill-primary opacity-100")} />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
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
    </div>
  )
}
