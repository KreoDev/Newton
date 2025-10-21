"use client"

import { useState, useEffect } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type ColumnOrderState,
  type PaginationState,
  type RowSelectionState,
  type ColumnSizingState,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTableConfigStore } from "@/stores/table-config.store"
import { DataTableToolbar } from "./DataTableToolbar"
import { DataTableHeader } from "./DataTableHeader"
import { DataTablePagination } from "./DataTablePagination"

interface DataTableProps<TData, TValue> {
  tableId: string
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  defaultColumnOrder?: string[]
  defaultPageSize?: number
  searchable?: boolean
  searchPlaceholder?: string
  toolbar?: React.ReactNode
  enablePagination?: boolean
  enableRowSelection?: boolean
  enableColumnResizing?: boolean
  enableExport?: boolean
  onRowSelectionChange?: (selectedRows: TData[]) => void
}

export function DataTable<TData, TValue>({
  tableId,
  columns,
  data,
  defaultColumnOrder,
  defaultPageSize = 10,
  searchable = true,
  searchPlaceholder = "Search...",
  toolbar,
  enablePagination = true,
  enableRowSelection = true,
  enableColumnResizing = true,
  enableExport = true,
  onRowSelectionChange,
}: DataTableProps<TData, TValue>) {
  const { getConfig, setConfig } = useTableConfigStore()
  const savedConfig = getConfig(tableId)

  // Get valid column IDs from the current columns
  const validColumnIds = columns.map((col) => (col as any).id || (col as any).accessorKey)

  // Validate saved column order - filter out any columns that no longer exist
  const validatedSavedOrder = savedConfig?.columnOrder?.filter((colId) => validColumnIds.includes(colId))

  // Initialize column order - use validated saved order if it exists and is valid, otherwise use default
  const initialColumnOrder =
    validatedSavedOrder && validatedSavedOrder.length > 0
      ? validatedSavedOrder
      : defaultColumnOrder ?? validColumnIds

  // State
  const [sorting, setSorting] = useState<SortingState>(savedConfig?.sorting ?? [])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(savedConfig?.columnVisibility ?? {})
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(initialColumnOrder)
  const [globalFilter, setGlobalFilter] = useState("")
  const [pagination, setPagination] = useState<PaginationState>(savedConfig?.pagination ?? { pageIndex: 0, pageSize: defaultPageSize })
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(savedConfig?.columnSizing ?? {})

  // Initialize table
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnOrder,
      globalFilter,
      pagination,
      rowSelection,
      columnSizing,
    },
    enableRowSelection,
    enableColumnResizing,
    columnResizeMode: "onChange",
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // Save preferences whenever they change
  useEffect(() => {
    setConfig(tableId, {
      columnOrder,
      columnVisibility,
      sorting,
      pagination,
      columnSizing,
    })
  }, [tableId, columnOrder, columnVisibility, sorting, pagination, columnSizing, setConfig])

  // Notify parent of row selection changes
  useEffect(() => {
    if (onRowSelectionChange) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)
      onRowSelectionChange(selectedRows)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection])

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        enableExport={enableExport}
      >
        {toolbar}
      </DataTableToolbar>

      <div className="rounded-md border glass-surface">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <DataTableHeader
                    key={header.id}
                    header={header}
                    table={table}
                    enableResizing={enableColumnResizing}
                  />
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {enablePagination && <DataTablePagination table={table} />}
    </div>
  )
}
