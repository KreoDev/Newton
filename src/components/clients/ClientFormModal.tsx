"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { Client, Site } from "@/types"
import { useAlert } from "@/hooks/useAlert"
import { useAuth } from "@/contexts/AuthContext"
import { createDocument, updateDocument } from "@/lib/firebase-utils"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { X } from "lucide-react"

interface ClientFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  client?: Client // For editing existing client
}

export function ClientFormModal({ open, onClose, onSuccess, client }: ClientFormModalProps) {
  const { user } = useAuth()
  const { showSuccess, showError } = useAlert()
  const isEditing = Boolean(client)

  const [name, setName] = useState("")
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [vatNumber, setVatNumber] = useState("")
  const [physicalAddress, setPhysicalAddress] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [allowedSiteIds, setAllowedSiteIds] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)

  const [sites, setSites] = useState<Site[]>([])
  const [loadingSites, setLoadingSites] = useState(true)

  useEffect(() => {
    if (!user?.companyId || !open) return

    const fetchSites = async () => {
      try {
        const q = query(collection(db, "sites"), where("companyId", "==", user.companyId), where("isActive", "==", true))
        const snapshot = await getDocs(q)
        const sitesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Site[]
        setSites(sitesList)
      } catch (error) {
        console.error("Error fetching sites:", error)
        showError("Error", "Failed to load sites")
      } finally {
        setLoadingSites(false)
      }
    }

    fetchSites()
  }, [user?.companyId, open])

  useEffect(() => {
    if (client && open) {
      setName(client.name)
      setRegistrationNumber(client.registrationNumber)
      setVatNumber(client.vatNumber || "")
      setPhysicalAddress(client.physicalAddress)
      setContactName(client.contactName)
      setContactEmail(client.contactEmail)
      setContactPhone(client.contactPhone)
      setAllowedSiteIds(client.allowedSiteIds || [])
      setIsActive(client.isActive)
    } else if (!client && open) {
      resetForm()
    }
  }, [client, open])

  const resetForm = () => {
    setName("")
    setRegistrationNumber("")
    setVatNumber("")
    setPhysicalAddress("")
    setContactName("")
    setContactEmail("")
    setContactPhone("")
    setAllowedSiteIds([])
    setIsActive(true)
  }

  const toggleSite = (siteId: string) => {
    if (allowedSiteIds.includes(siteId)) {
      setAllowedSiteIds(allowedSiteIds.filter(id => id !== siteId))
    } else {
      setAllowedSiteIds([...allowedSiteIds, siteId])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      showError("Validation Error", "Client name is required")
      return
    }

    if (!registrationNumber.trim()) {
      showError("Validation Error", "Registration number is required")
      return
    }

    if (!physicalAddress.trim()) {
      showError("Validation Error", "Physical address is required")
      return
    }

    if (!contactName.trim()) {
      showError("Validation Error", "Contact person name is required")
      return
    }

    if (!contactEmail.trim()) {
      showError("Validation Error", "Contact email is required")
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contactEmail.trim())) {
      showError("Validation Error", "Please enter a valid email address")
      return
    }

    if (!contactPhone.trim()) {
      showError("Validation Error", "Contact phone is required")
      return
    }

    if (!user?.companyId) {
      showError("Error", "User company not found")
      return
    }

    try {
      setLoading(true)

      const clientData: any = {
        name: name.trim(),
        registrationNumber: registrationNumber.trim(),
        vatNumber: vatNumber.trim() || null,
        physicalAddress: physicalAddress.trim(),
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        allowedSiteIds,
        isActive,
        companyId: user.companyId,
      }

      if (isEditing && client) {
        await updateDocument("clients", client.id, clientData)
        showSuccess("Client Updated", `${name} has been updated successfully.`)
      } else {
        await createDocument("clients", clientData)
        showSuccess("Client Created", `${name} has been created successfully.`)
      }

      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error("Error saving client:", error)
      showError(`Failed to ${isEditing ? "Update" : "Create"} Client`, error instanceof Error ? error.message : "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Client" : "Create New Client"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update client information and contacts" : "Add a new client company"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Client Name <span className="text-destructive">*</span>
            </Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., ABC Corporation" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">
                Registration Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="registrationNumber"
                value={registrationNumber}
                onChange={e => setRegistrationNumber(e.target.value)}
                placeholder="e.g., 2019/111111/07"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vatNumber">VAT Number</Label>
              <Input id="vatNumber" value={vatNumber} onChange={e => setVatNumber(e.target.value)} placeholder="e.g., 4111111111" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="physicalAddress">
              Physical Address <span className="text-destructive">*</span>
            </Label>
            <Textarea id="physicalAddress" value={physicalAddress} onChange={e => setPhysicalAddress(e.target.value)} placeholder="Enter full address" rows={2} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactName">
              Contact Person Name <span className="text-destructive">*</span>
            </Label>
            <Input id="contactName" value={contactName} onChange={e => setContactName(e.target.value)} placeholder="e.g., John Smith" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">
                Contact Email <span className="text-destructive">*</span>
              </Label>
              <Input id="contactEmail" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="email@example.com" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">
                Contact Phone <span className="text-destructive">*</span>
              </Label>
              <Input id="contactPhone" type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+27821234567" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Allowed Sites</Label>
            {loadingSites ? (
              <p className="text-sm text-muted-foreground">Loading sites...</p>
            ) : sites.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active sites available. Please create sites first.</p>
            ) : (
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                {sites.map(site => (
                  <div key={site.id} className="flex items-center space-x-2">
                    <Checkbox id={`site-${site.id}`} checked={allowedSiteIds.includes(site.id)} onCheckedChange={() => toggleSite(site.id)} />
                    <Label htmlFor={`site-${site.id}`} className="cursor-pointer text-sm">
                      {site.name} ({site.siteType})
                    </Label>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">{allowedSiteIds.length} site(s) selected</p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="isActive" checked={isActive} onCheckedChange={checked => setIsActive(checked as boolean)} />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Update Client" : "Create Client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
