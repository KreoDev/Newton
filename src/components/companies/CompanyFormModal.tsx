"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { CompanyService } from "@/services/company.service"
import { toast } from "sonner"
import type { Company } from "@/types"

interface CompanyFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  company?: Company
}

export function CompanyFormModal({ open, onClose, onSuccess, company }: CompanyFormModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: company?.name || "",
    companyType: company?.companyType || "mine",
    registrationNumber: company?.registrationNumber || "",
    vatNumber: company?.vatNumber || "",
    physicalAddress: company?.physicalAddress || "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.name || !formData.companyType || !formData.registrationNumber || !formData.physicalAddress) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!user) {
      toast.error("User not found")
      return
    }

    try {
      setLoading(true)

      const companyData = {
        name: formData.name,
        companyType: formData.companyType as "mine" | "transporter" | "logistics_coordinator",
        registrationNumber: formData.registrationNumber,
        vatNumber: formData.vatNumber,
        physicalAddress: formData.physicalAddress,
        mainContactId: user.id, // Use current user as main contact for now
        secondaryContactIds: [],
        isActive: true,
      }

      if (company) {
        // Update existing company
        await CompanyService.update(company.id, companyData)
      } else {
        // Create new company
        await CompanyService.create(companyData)
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error saving company:", error)
      toast.error(`Failed to ${company ? "update" : "create"} company`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] glass-surface">
        <DialogHeader>
          <DialogTitle>{company ? "Edit Company" : "Create New Company"}</DialogTitle>
          <DialogDescription>Enter the company details below.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Acme Corporation" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyType">Company Type *</Label>
            <select
              id="companyType"
              value={formData.companyType}
              onChange={e => setFormData({ ...formData, companyType: e.target.value as "mine" | "transporter" | "logistics_coordinator" })}
              className="w-full border rounded-md px-3 py-2 bg-background/60 backdrop-blur-md"
            >
              <option value="mine">Mine</option>
              <option value="transporter">Transporter</option>
              <option value="logistics_coordinator">Logistics Coordinator</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationNumber">Registration Number *</Label>
            <Input
              id="registrationNumber"
              value={formData.registrationNumber}
              onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
              placeholder="2024/001234/07"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vatNumber">VAT Number</Label>
            <Input
              id="vatNumber"
              value={formData.vatNumber}
              onChange={e => setFormData({ ...formData, vatNumber: e.target.value })}
              placeholder="4001234567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="physicalAddress">Physical Address *</Label>
            <Input
              id="physicalAddress"
              value={formData.physicalAddress}
              onChange={e => setFormData({ ...formData, physicalAddress: e.target.value })}
              placeholder="123 Main Street, City, Province, Postal Code"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : company ? "Update Company" : "Create Company"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
