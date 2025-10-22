"use client"

import { useState } from "react"
import { AlertCircle, Building2, CheckCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import type { Company } from "@/types"

interface CompanySwitcherModalProps {
  open: boolean
  inactiveCompanyName: string
  availableCompanies: Company[]
  onSwitchCompany: (companyId: string) => Promise<void>
  onLogout: () => void
}

/**
 * Modal shown to global admin users when their company becomes inactive
 * Allows switching to another active company instead of forcing logout
 */
export function CompanySwitcherModal({ open, inactiveCompanyName, availableCompanies, onSwitchCompany, onLogout }: CompanySwitcherModalProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [switching, setSwitching] = useState(false)

  const handleSwitch = async () => {
    if (!selectedCompanyId) return

    try {
      setSwitching(true)
      await onSwitchCompany(selectedCompanyId)
    } catch (error) {
    } finally {
      setSwitching(false)
    }
  }

  const getCompanyTypeLabel = (type: "mine" | "transporter" | "logistics_coordinator") => {
    const labels = {
      mine: "Mine",
      transporter: "Transporter",
      logistics_coordinator: "Logistics",
    }
    return labels[type]
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-2xl"
        onEscapeKeyDown={e => e.preventDefault()}
        onPointerDownOutside={e => e.preventDefault()}
        onInteractOutside={e => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-5 w-5" />
            Company Deactivated
          </DialogTitle>
          <DialogDescription>Your current company has been deactivated. Please select another company to continue.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{inactiveCompanyName}</strong> has been deactivated by an administrator. As a global user, you can switch to another
              active company to continue using the system.
            </AlertDescription>
          </Alert>

          {availableCompanies.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                There are no other active companies available. You will need to log out and contact your system administrator.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              <div className="font-medium text-sm">Select a company to switch to:</div>
              <div className="h-[300px] overflow-y-auto rounded-md border p-4">
                <div className="space-y-2">
                  {availableCompanies.map(company => (
                    <button
                      key={company.id}
                      onClick={() => setSelectedCompanyId(company.id)}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        selectedCompanyId === company.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-base mb-1">{company.name}</div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {getCompanyTypeLabel(company.companyType)}
                              </Badge>
                              {company.registrationNumber && (
                                <span className="text-xs text-muted-foreground">{company.registrationNumber}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {selectedCompanyId === company.id && <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onLogout} disabled={switching} className="w-full sm:w-auto">
            Log Out Instead
          </Button>
          {availableCompanies.length > 0 && (
            <Button onClick={handleSwitch} disabled={!selectedCompanyId || switching} className="w-full sm:w-auto">
              {switching ? "Switching..." : "Switch Company"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
