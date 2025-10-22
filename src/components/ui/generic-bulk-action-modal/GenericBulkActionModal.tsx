"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAlert } from "@/hooks/useAlert"
import type { LucideIcon } from "lucide-react"

export interface GenericBulkActionModalConfig<T> {
  title: string
  description: string
  icon: LucideIcon
  iconColor?: string
  buttonText: string
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  buttonClassName?: string
  loadingText?: string
  successTitle?: string
  successMessage?: string
  errorTitle?: string
  onConfirm: (items: T[]) => Promise<void>
  renderItem: (item: T) => React.ReactNode
  itemsLabel?: string
}

interface GenericBulkActionModalProps<T> {
  open: boolean
  onClose: () => void
  items: T[]
  onSuccess: () => void
  config: GenericBulkActionModalConfig<T>
}

/**
 * Generic bulk action modal component
 * Handles common bulk operation patterns with customizable config
 */
export function GenericBulkActionModal<T>({ open, onClose, items, onSuccess, config }: GenericBulkActionModalProps<T>) {
  const { showSuccess, showError } = useAlert()
  const [loading, setLoading] = useState(false)

  const {
    title,
    description,
    icon: Icon,
    iconColor,
    buttonText,
    buttonVariant = "default",
    buttonClassName,
    loadingText = "Processing...",
    successTitle = "Success",
    successMessage,
    errorTitle = "Operation Failed",
    onConfirm,
    renderItem,
    itemsLabel = "Items",
  } = config

  const handleConfirm = async () => {
    try {
      setLoading(true)

      await onConfirm(items)

      const message = successMessage || `Successfully processed ${items.length} ${itemsLabel.toLowerCase()}${items.length > 1 ? "s" : ""}.`
      showSuccess(successTitle, message)

      onSuccess()
    } catch (error) {
      showError(errorTitle, error instanceof Error ? error.message : "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onEscapeKeyDown={e => e.preventDefault()} onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${iconColor || ""}`}>
            <Icon className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description} {items.length} {itemsLabel.toLowerCase()}
            {items.length > 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>
              {itemsLabel} ({items.length})
            </Label>
            <div className="max-h-48 overflow-y-auto space-y-1 p-3 glass-surface rounded-lg">
              {items.map((item, index) => (
                <div key={index} className="text-sm">
                  {renderItem(item)}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={buttonVariant} onClick={handleConfirm} disabled={loading} className={buttonClassName}>
            {loading
              ? loadingText
              : `${buttonText} ${items.length} ${itemsLabel}${items.length > 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
