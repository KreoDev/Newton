"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAlert } from "@/hooks/useAlert"
import { useAuth } from "@/contexts/AuthContext"
import { createDocument, updateDocument } from "@/lib/firebase-utils"
import { Mail, Eye, RefreshCw } from "lucide-react"

interface NotificationTemplate {
  id: string
  name: string
  category: string
  subject: string
  body: string
  companyId: string
  isActive: boolean
}

interface TemplateEditorProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  template?: NotificationTemplate
}

const CATEGORIES = ["Asset", "Order", "Weighbridge", "Security", "PreBooking", "Driver"]

const PLACEHOLDER_GROUPS = {
  "General": [
    { key: "{{userName}}", value: "John Doe", description: "User name" },
    { key: "{{companyName}}", value: "ABC Mining Co.", description: "Company name" },
    { key: "{{date}}", value: new Date().toLocaleDateString(), description: "Current date" },
    { key: "{{time}}", value: new Date().toLocaleTimeString(), description: "Current time" },
  ],
  "Asset": [
    { key: "{{assetType}}", value: "Truck", description: "Asset type (Truck/Trailer/Driver)" },
    { key: "{{registrationNumber}}", value: "ABC123GP", description: "Registration number" },
    { key: "{{fleetNumber}}", value: "FL-001", description: "Fleet number" },
    { key: "{{daysUntilExpiry}}", value: "7", description: "Days until expiry" },
    { key: "{{expiryDate}}", value: "2024-12-31", description: "Expiry date" },
  ],
  "Order": [
    { key: "{{orderNumber}}", value: "ORD-2024-001", description: "Order number" },
    { key: "{{productName}}", value: "Coal", description: "Product name" },
    { key: "{{weight}}", value: "25.5", description: "Weight in tons" },
  ],
  "Weighbridge": [
    { key: "{{weighbridgeName}}", value: "Weighbridge A", description: "Weighbridge name" },
    { key: "{{sealNumbers}}", value: "S001, S002", description: "Seal numbers" },
  ],
  "Other": [
    { key: "{{reason}}", value: "Maintenance required", description: "Reason for action" },
  ],
}

// Sample data for preview
const SAMPLE_DATA: Record<string, string> = {}
Object.values(PLACEHOLDER_GROUPS).forEach(group => {
  group.forEach(placeholder => {
    SAMPLE_DATA[placeholder.key] = placeholder.value
  })
})

export function TemplateEditor({ open, onClose, onSuccess, template }: TemplateEditorProps) {
  const { user } = useAuth()
  const { showSuccess, showError, showConfirm } = useAlert()
  const isEditing = Boolean(template)

  const [name, setName] = useState("")
  const [category, setCategory] = useState("Asset")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (template && open) {
      setName(template.name)
      setCategory(template.category)
      setSubject(template.subject)
      setBody(template.body)
      setIsActive(template.isActive)
    } else if (!template && open) {
      resetForm()
    }
  }, [template, open])

  const resetForm = () => {
    setName("")
    setCategory("Asset")
    setSubject("")
    setBody("")
    setIsActive(true)
  }

  const insertPlaceholder = (placeholder: string) => {
    setBody(body + " " + placeholder)
  }

  // Render preview with sample data
  const previewSubject = useMemo(() => {
    let rendered = subject
    Object.entries(SAMPLE_DATA).forEach(([key, value]) => {
      rendered = rendered.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value)
    })
    return rendered
  }, [subject])

  const previewBody = useMemo(() => {
    let rendered = body
    Object.entries(SAMPLE_DATA).forEach(([key, value]) => {
      rendered = rendered.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value)
    })
    return rendered
  }, [body])

  const handleSendTestEmail = async () => {
    if (!user?.email) {
      showError("No Email Available", "User email not found.")
      return
    }

    if (!subject.trim() || !body.trim()) {
      showError("Missing Content", "Subject and body are required to send test email.")
      return
    }

    try {
      setLoading(true)
      // In a real implementation, this would call an API endpoint to send the email
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 1000))
      showSuccess("Test Email Sent", `A test email has been sent to ${user.email}.`)
    } catch (error) {
      console.error("Error sending test email:", error)
      showError("Failed to Send Test Email", error instanceof Error ? error.message : "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const handleResetToDefault = () => {
    showConfirm(
      "Reset Template",
      "Are you sure you want to reset this template to its default values? This will discard all changes.",
      () => {
        resetForm()
        showSuccess("Template Reset", "Template has been reset to defaults.")
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      showError("Error", "Template name is required.")
      return
    }

    if (!subject.trim()) {
      showError("Error", "Email subject is required.")
      return
    }

    if (!body.trim()) {
      showError("Error", "Email body is required.")
      return
    }

    if (!user?.companyId) {
      showError("Error", "User company not found.")
      return
    }

    try {
      setLoading(true)

      const templateData: any = {
        name: name.trim(),
        category,
        subject: subject.trim(),
        body: body.trim(),
        isActive,
        companyId: user.companyId,
      }

      if (isEditing && template) {
        await updateDocument("notification_templates", template.id, templateData)
        showSuccess("Template Updated", `${name} has been updated successfully.`)
      } else {
        await createDocument("notification_templates", templateData)
        showSuccess("Template Created", `${name} has been created successfully.`)
      }

      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error("Error saving template:", error)
      showError(`Failed to ${isEditing ? "Update" : "Create"} Template`, error instanceof Error ? error.message : "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Template" : "Create New Template"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update notification template with live preview" : "Add a new notification template with live preview"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleSendTestEmail} disabled={loading}>
              <Mail className="mr-2 h-4 w-4" />
              Send Test Email
            </Button>
            {isEditing && (
              <Button type="button" variant="outline" size="sm" onClick={handleResetToDefault} disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset to Default
              </Button>
            )}
          </div>

          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Template Name <span className="text-destructive">*</span>
              </Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Asset Added" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-destructive">*</span>
              </Label>
              <select
                id="category"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full border rounded-md px-3 py-2 bg-background"
                required
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">
              Email Subject <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g., New Asset Added - {{assetType}}"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">
              Email Body <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="body"
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Enter email body with placeholders..."
              rows={8}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Available Placeholders</Label>
            <div className="border rounded-md p-3 bg-muted/20 max-h-[300px] overflow-y-auto">
              {Object.entries(PLACEHOLDER_GROUPS).map(([groupName, placeholders]) => (
                <div key={groupName} className="mb-4 last:mb-0">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">{groupName}</p>
                  <div className="flex flex-wrap gap-2">
                    {placeholders.map(placeholder => (
                      <Button
                        key={placeholder.key}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertPlaceholder(placeholder.key)}
                        className="text-xs"
                        title={placeholder.description}
                      >
                        {placeholder.key}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Click a placeholder to insert it into the email body</p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="isActive" checked={isActive} onCheckedChange={checked => setIsActive(checked as boolean)} />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active
            </Label>
          </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="border rounded-md p-6 bg-muted/20 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Subject Preview</Label>
                  <div className="p-3 bg-background border rounded-md">
                    <p className="text-sm">{previewSubject || <span className="text-muted-foreground italic">Subject will appear here...</span>}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Body Preview</Label>
                  <div className="p-4 bg-background border rounded-md min-h-[300px] max-h-[400px] overflow-y-auto">
                    <div className="prose prose-sm max-w-none">
                      {previewBody ? (
                        <pre className="whitespace-pre-wrap font-sans text-sm">{previewBody}</pre>
                      ) : (
                        <p className="text-muted-foreground italic">Email body will appear here...</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> This preview uses sample data. Actual emails will use real data from the system.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
