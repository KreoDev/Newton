"use client"

import { type Table } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DataTableColumnToggle } from "./DataTableColumnToggle"
import { Search, FileText, FileSpreadsheet, Printer, Download } from "lucide-react"
import { utils, writeFile } from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchable?: boolean
  searchPlaceholder?: string
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void
  enableExport?: boolean
  children?: React.ReactNode
}

export function DataTableToolbar<TData>({
  table,
  searchable,
  searchPlaceholder,
  globalFilter,
  onGlobalFilterChange,
  enableExport,
  children,
}: DataTableToolbarProps<TData>) {
  const exportToCSV = () => {
    // Export selected rows if any, otherwise export all filtered rows
    const rows = table.getSelectedRowModel().rows.length > 0
      ? table.getSelectedRowModel().rows
      : table.getFilteredRowModel().rows

    const data = rows.map((row) => {
      const obj: any = {}
      row.getVisibleCells().forEach((cell) => {
        const columnId = cell.column.id
        const header = cell.column.columnDef.header
        const key = typeof header === "string" ? header : columnId
        obj[key] = cell.getValue()
      })
      return obj
    })

    const ws = utils.json_to_sheet(data)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, "Data")
    writeFile(wb, `export-${Date.now()}.csv`)
  }

  const exportToExcel = () => {
    // Export selected rows if any, otherwise export all filtered rows
    const rows = table.getSelectedRowModel().rows.length > 0
      ? table.getSelectedRowModel().rows
      : table.getFilteredRowModel().rows

    const data = rows.map((row) => {
      const obj: any = {}
      row.getVisibleCells().forEach((cell) => {
        const columnId = cell.column.id
        const header = cell.column.columnDef.header
        const key = typeof header === "string" ? header : columnId
        obj[key] = cell.getValue()
      })
      return obj
    })

    const ws = utils.json_to_sheet(data)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, "Data")
    writeFile(wb, `export-${Date.now()}.xlsx`)
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    // Export selected rows if any, otherwise export all filtered rows
    const rows = table.getSelectedRowModel().rows.length > 0
      ? table.getSelectedRowModel().rows
      : table.getFilteredRowModel().rows

    // Get headers
    const headers = table.getVisibleFlatColumns()
      .filter(col => col.id !== "select" && col.id !== "actions")
      .map((col) => {
        const header = col.columnDef.header
        return typeof header === "string" ? header : col.id
      })

    // Get data
    const data = rows.map((row) => {
      return row.getVisibleCells()
        .filter(cell => cell.column.id !== "select" && cell.column.id !== "actions")
        .map((cell) => {
          const value = cell.getValue()
          return value !== null && value !== undefined ? String(value) : ""
        })
    })

    autoTable(doc, {
      head: [headers],
      body: data,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [71, 85, 105] },
    })

    doc.save(`export-${Date.now()}.pdf`)
  }

  const handlePrint = () => {
    // Export selected rows if any, otherwise export all filtered rows
    const rows = table.getSelectedRowModel().rows.length > 0
      ? table.getSelectedRowModel().rows
      : table.getFilteredRowModel().rows

    // Get headers
    const headers = table.getVisibleFlatColumns()
      .filter(col => col.id !== "select" && col.id !== "actions")
      .map((col) => {
        const header = col.columnDef.header
        return typeof header === "string" ? header : col.id
      })

    // Get data
    const data = rows.map((row) => {
      return row.getVisibleCells()
        .filter(cell => cell.column.id !== "select" && cell.column.id !== "actions")
        .map((cell) => {
          const value = cell.getValue()
          return value !== null && value !== undefined ? String(value) : ""
        })
    })

    // Create print window
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #475569; color: white; }
            @media print {
              body { margin: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <button onclick="window.print(); window.close();" style="padding: 10px 20px; margin-bottom: 20px; cursor: pointer;">Print</button>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${data.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  return (
    <div className="flex items-center space-x-2">
      {searchable && (
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter ?? ""}
            onChange={(e) => onGlobalFilterChange?.(e.target.value)}
            className="pl-8"
          />
        </div>
      )}
      <DataTableColumnToggle table={table} />
      {enableExport && (
        <>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF}>
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </>
      )}
      {children}
    </div>
  )
}
