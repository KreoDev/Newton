"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { Product } from "@/types"
import { useAlert } from "@/hooks/useAlert"
import { useAuth } from "@/contexts/AuthContext"
import { createDocument, updateDocument } from "@/lib/firebase-utils"

interface ProductFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  product?: Product // For editing existing product
  viewOnly?: boolean // For read-only viewing
}

export function ProductFormModal({ open, onClose, onSuccess, product, viewOnly = false }: ProductFormModalProps) {
  const { user } = useAuth()
  const { showSuccess, showError } = useAlert()
  const isEditing = Boolean(product)

  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [specifications, setSpecifications] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (product && open) {
      setName(product.name)
      setCode(product.code)
      setSpecifications(product.specifications || "")
      setIsActive(product.isActive)
    } else if (!product && open) {
      resetForm()
    }
  }, [product, open])

  const resetForm = () => {
    setName("")
    setCode("")
    setSpecifications("")
    setIsActive(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      showError("Error", "Product name is required")
      return
    }

    if (!code.trim()) {
      showError("Error", "Product code is required")
      return
    }

    if (!user?.companyId) {
      showError("Error", "User company not found")
      return
    }

    try {
      setLoading(true)

      const productData: any = {
        name: name.trim(),
        code: code.trim(),
        specifications: specifications.trim() || null,
        isActive,
        companyId: user.companyId,
      }

      if (isEditing && product) {
        await updateDocument("products", product.id, productData)
        showSuccess("Product Updated", `${name} has been updated successfully.`)
      } else {
        await createDocument("products", productData)
        showSuccess("Product Created", `${name} has been created successfully.`)
      }

      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error("Error saving product:", error)
      showError(`Failed to ${isEditing ? "Update" : "Create"} Product`, error instanceof Error ? error.message : "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{viewOnly ? "View Product" : isEditing ? "Edit Product" : "Create New Product"}</DialogTitle>
          <DialogDescription>
            {viewOnly ? "View product information" : isEditing ? "Update product information" : "Add a new product to your catalog"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={viewOnly}>
          <div className="space-y-2">
            <Label htmlFor="name">
              Product Name <span className="text-destructive">*</span>
            </Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Gold Ore" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">
              Product Code <span className="text-destructive">*</span>
            </Label>
            <Input id="code" value={code} onChange={e => setCode(e.target.value)} placeholder="e.g., AU-001" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specifications">Specifications</Label>
            <Textarea
              id="specifications"
              value={specifications}
              onChange={e => setSpecifications(e.target.value)}
              placeholder="e.g., Grade A, 5500 kcal/kg"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="isActive" checked={isActive} onCheckedChange={checked => setIsActive(checked as boolean)} />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active
            </Label>
          </div>
          </fieldset>

          {viewOnly ? (
            <div className="flex justify-end pt-4 border-t">
              <Button type="button" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
