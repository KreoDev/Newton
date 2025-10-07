"use client"

import { useEffect, useRef, useState } from "react"
import { type Header, type Table, flexRender } from "@tanstack/react-table"
import { TableHead } from "@/components/ui/table"
import { ArrowUpDown, ArrowUp, ArrowDown, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine"

interface DataTableHeaderProps<TData> {
  header: Header<TData, unknown>
  table: Table<TData>
  enableResizing?: boolean
}

export function DataTableHeader<TData>({ header, table, enableResizing = true }: DataTableHeaderProps<TData>) {
  const { column } = header
  const ref = useRef<HTMLTableCellElement>(null)
  const dragHandleRef = useRef<HTMLButtonElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isDropTarget, setIsDropTarget] = useState(false)

  // Setup drag and drop
  useEffect(() => {
    const element = ref.current
    const dragHandle = dragHandleRef.current

    if (!element || !dragHandle) return
    if (header.isPlaceholder) return
    if (column.id === "actions") return // Disable drag for actions column

    return combine(
      draggable({
        element: dragHandle,
        getInitialData: () => ({ columnId: column.id, index: header.index }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element,
        getData: () => ({ columnId: column.id, index: header.index }),
        canDrop: ({ source }) => {
          // Prevent dropping actions column or dropping onto actions column
          const sourceColumnId = source.data.columnId as string
          return sourceColumnId !== column.id && sourceColumnId !== "actions" && column.id !== "actions"
        },
        onDragEnter: () => setIsDropTarget(true),
        onDragLeave: () => setIsDropTarget(false),
        onDrop: ({ source }) => {
          setIsDropTarget(false)

          const sourceColumnId = source.data.columnId as string
          const targetColumnId = column.id

          if (sourceColumnId === targetColumnId) return
          if (sourceColumnId === "actions" || targetColumnId === "actions") return // Prevent actions column movement

          // Reorder columns
          const currentOrder = table.getState().columnOrder
          const sourceIndex = currentOrder.indexOf(sourceColumnId)
          const targetIndex = currentOrder.indexOf(targetColumnId)

          if (sourceIndex === -1 || targetIndex === -1) return

          const newOrder = [...currentOrder]
          newOrder.splice(sourceIndex, 1)
          newOrder.splice(targetIndex, 0, sourceColumnId)

          table.setColumnOrder(newOrder)
        },
      })
    )
  }, [column.id, header.index, header.isPlaceholder, table])

  if (header.isPlaceholder) {
    return <TableHead />
  }

  const isSorted = column.getIsSorted()
  const canSort = column.getCanSort()

  const isActionsColumn = column.id === "actions"

  return (
    <TableHead
      ref={ref}
      className={cn(
        "relative cursor-pointer hover:bg-muted/50 select-none",
        isDragging && "opacity-50",
        isDropTarget && "bg-accent"
      )}
      style={{
        width: header.getSize(),
      }}
    >
      <div className="flex items-center gap-2">
        {!isActionsColumn && (
          <Button
            ref={dragHandleRef}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 cursor-grab active:cursor-grabbing hover:bg-accent"
            title="Drag to reorder column"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground/50" />
          </Button>
        )}

        {canSort ? (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 flex-1 justify-start data-[state=open]:bg-accent hover:bg-transparent",
              !isActionsColumn && "-ml-3"
            )}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>{flexRender(column.columnDef.header, header.getContext())}</span>
            {isSorted === "asc" && <ArrowUp className="ml-2 h-4 w-4" />}
            {isSorted === "desc" && <ArrowDown className="ml-2 h-4 w-4" />}
            {!isSorted && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
          </Button>
        ) : (
          <span className="flex-1">{flexRender(column.columnDef.header, header.getContext())}</span>
        )}
      </div>

      {enableResizing && column.getCanResize() && !isActionsColumn && (
        <div
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className={cn(
            "absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-primary",
            header.column.getIsResizing() && "bg-primary"
          )}
        />
      )}
    </TableHead>
  )
}
