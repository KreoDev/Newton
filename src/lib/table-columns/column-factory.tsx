import { type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { StatusBadge } from "@/components/ui/status-badge"
import { FormattedDate } from "@/components/ui/formatted-date"
import { Edit, Trash2, FileText } from "lucide-react"

/**
 * Factory for creating common table column definitions
 * Reduces duplication across data table column configurations
 */
export class ColumnFactory {
  /**
   * Create a checkbox selection column
   */
  static createSelectionColumn<T>(): ColumnDef<T> {
    return {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={value => row.toggleSelected(!!value)} aria-label="Select row" />
      ),
      enableSorting: false,
      enableHiding: false,
    }
  }

  /**
   * Create a status badge column (active/inactive)
   */
  static createStatusColumn<T extends { isActive: boolean }>(field: keyof T = "isActive" as keyof T): ColumnDef<T> {
    return {
      id: "status",
      accessorKey: field as string,
      header: "Status",
      cell: ({ row }) => <StatusBadge isActive={row.original[field] as boolean} />,
      enableHiding: true,
    }
  }

  /**
   * Create a date column with formatting
   */
  static createDateColumn<T>(field: keyof T, header: string, formatType: "short" | "long" | "distance" = "short"): ColumnDef<T> {
    return {
      id: field as string,
      accessorKey: field as string,
      header,
      cell: ({ row }) => {
        const date = row.original[field]
        if (!date) return <span className="text-sm text-muted-foreground">-</span>
        return <FormattedDate date={date as any} formatType={formatType} />
      },
      enableHiding: true,
    }
  }

  /**
   * Create a badge column with custom styling
   */
  static createBadgeColumn<T>(
    id: string,
    accessor: keyof T | ((row: T) => string),
    header: string,
    variant: "default" | "success" | "destructive" | "outline" | "secondary" | "purple" = "default"
  ): ColumnDef<T> {
    return {
      id,
      accessorFn: typeof accessor === "function" ? accessor : undefined,
      accessorKey: typeof accessor === "string" ? (accessor as string) : undefined,
      header,
      cell: ({ row }) => {
        const value = typeof accessor === "function" ? accessor(row.original) : row.original[accessor]
        if (!value || value === "-") return <span className="text-sm text-muted-foreground">-</span>
        return (
          <Badge variant={variant} className="text-xs">
            {String(value)}
          </Badge>
        )
      },
      enableHiding: true,
    }
  }

  /**
   * Create a simple text column
   */
  static createTextColumn<T>(
    id: string,
    accessor: keyof T | ((row: T) => string | null | undefined),
    header: string,
    options?: {
      fontWeight?: "normal" | "semibold" | "bold"
      fontFamily?: "default" | "mono"
      className?: string
      fallback?: string
      enableHiding?: boolean
    }
  ): ColumnDef<T> {
    const { fontWeight = "normal", fontFamily = "default", className = "", fallback = "-", enableHiding = true } = options || {}

    const fontWeightClass = fontWeight === "semibold" ? "font-semibold" : fontWeight === "bold" ? "font-bold" : ""
    const fontFamilyClass = fontFamily === "mono" ? "font-mono" : ""
    const fullClassName = `text-sm ${fontWeightClass} ${fontFamilyClass} ${className}`.trim()

    return {
      id,
      accessorFn: typeof accessor === "function" ? accessor : undefined,
      accessorKey: typeof accessor === "string" ? (accessor as string) : undefined,
      header,
      cell: ({ row }) => {
        const value = typeof accessor === "function" ? accessor(row.original) : row.original[accessor]
        if (!value) return <span className="text-sm text-muted-foreground">{fallback}</span>
        return <span className={fullClassName}>{String(value)}</span>
      },
      enableHiding,
    }
  }

  /**
   * Create an actions column with view, edit, delete buttons
   */
  static createActionsColumn<T>(config: {
    canEdit?: boolean
    canDelete?: boolean
    onView?: (row: T) => void
    onEdit?: (row: T) => void
    onDelete?: (row: T) => void
  }): ColumnDef<T> {
    const { canEdit = false, canDelete = false, onView, onEdit, onDelete } = config

    return {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {onView && (
            <Button variant="ghost" size="sm" onClick={() => onView(row.original)} title="View details">
              <FileText className="h-4 w-4" />
            </Button>
          )}
          {canEdit && onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(row.original)} title="Edit">
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canDelete && onDelete && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(row.original)} title="Delete">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
      enableHiding: false,
      enableSorting: false,
    }
  }

  /**
   * Create a combined text column (e.g., "Make Model")
   */
  static createCombinedTextColumn<T>(
    id: string,
    fields: Array<keyof T>,
    header: string,
    separator: string = " ",
    fallback: string = "-"
  ): ColumnDef<T> {
    return {
      id,
      accessorFn: row => {
        const values = fields.map(field => row[field]).filter(Boolean)
        return values.length > 0 ? values.join(separator) : null
      },
      header,
      cell: ({ row }) => {
        const values = fields.map(field => row.original[field]).filter(Boolean)
        const combined = values.length > 0 ? values.join(separator) : fallback
        return <span className="text-sm">{combined}</span>
      },
      enableHiding: true,
    }
  }

  /**
   * Create a numeric column with formatting
   */
  static createNumericColumn<T>(
    id: string,
    accessor: keyof T,
    header: string,
    options?: {
      format?: (value: number) => string
      prefix?: string
      suffix?: string
      fallback?: string
    }
  ): ColumnDef<T> {
    const { format, prefix = "", suffix = "", fallback = "-" } = options || {}

    return {
      id,
      accessorKey: accessor as string,
      header,
      cell: ({ row }) => {
        const value = row.original[accessor]
        if (value === null || value === undefined) {
          return <span className="text-sm text-muted-foreground">{fallback}</span>
        }
        const numValue = Number(value)
        const formatted = format ? format(numValue) : numValue.toLocaleString()
        return <span className="text-sm font-mono">{`${prefix}${formatted}${suffix}`}</span>
      },
      enableHiding: true,
    }
  }

  /**
   * Create a boolean column with Yes/No or custom labels
   */
  static createBooleanColumn<T>(
    id: string,
    accessor: keyof T,
    header: string,
    labels: { true: string; false: string } = { true: "Yes", false: "No" }
  ): ColumnDef<T> {
    return {
      id,
      accessorKey: accessor as string,
      header,
      cell: ({ row }) => {
        const value = row.original[accessor]
        const label = value ? labels.true : labels.false
        return (
          <Badge variant={value ? "success" : "secondary"} className="text-xs">
            {label}
          </Badge>
        )
      },
      enableHiding: true,
    }
  }
}
