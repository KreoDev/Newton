"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { Product } from "@/types"
import { GenericFormModal } from "@/components/ui/generic-form-modal"

interface ProductFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  product?: Product
  viewOnly?: boolean
}

export function ProductFormModal({ open, onClose, onSuccess, product, viewOnly = false }: ProductFormModalProps) {
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [specifications, setSpecifications] = useState("")
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (product && open) {
      setName(product.name)
      setCode(product.code)
      setSpecifications(product.specifications || "")
      setIsActive(product.isActive)
    } else if (!product && open) {
      setName("")
      setCode("")
      setSpecifications("")
      setIsActive(true)
    }
  }, [product, open])

  return (
    <GenericFormModal<Product>
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      entity={product}
      viewOnly={viewOnly}
      title="Product"
      description={
        viewOnly
          ? "View product information"
          : product
          ? "Update product information"
          : "Add a new product to your catalog"
      }
      collection="products"
      onValidate={() => {
        if (!name.trim()) return "Product name is required"
        if (!code.trim()) return "Product code is required"
        return null
      }}
      onPrepareData={() => ({
        name: name.trim(),
        code: code.trim(),
        specifications: specifications.trim() || undefined,
        isActive,
      })}
    >
      {() => (
        <div className="space-y-4">
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
        </div>
      )}
    </GenericFormModal>
  )
}
