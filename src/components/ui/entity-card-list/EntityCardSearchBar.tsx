"use client"

import { Search, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface FilterOption {
  label: string
  value: string
}

interface EntityCardSearchBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  filterValue: string
  onFilterChange: (value: string) => void
  filterOptions: FilterOption[]
  filterLabel?: string
}

/**
 * Reusable search and filter bar for card views
 * Always uses DropdownMenu for consistency
 */
export function EntityCardSearchBar({
  searchTerm,
  onSearchChange,
  searchPlaceholder,
  filterValue,
  onFilterChange,
  filterOptions,
  filterLabel,
}: EntityCardSearchBarProps) {
  const selectedFilterLabel =
    filterOptions.find((opt) => opt.value === filterValue)?.label || filterLabel || "Filter"

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            {selectedFilterLabel}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {filterOptions.map((option) => (
            <DropdownMenuItem key={option.value} onClick={() => onFilterChange(option.value)}>
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
