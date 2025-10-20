"use client"

import { useState, useMemo } from "react"
import { useSignals } from "@preact/signals-react/runtime"
import { data as globalData } from "@/services/data.service"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AssetInductionState } from "@/types/asset-types"
import { ArrowRight } from "lucide-react"

interface Step1Props {
  state: Partial<AssetInductionState>
  updateState: (updates: Partial<AssetInductionState>) => void
  onNext: () => void
}

export function Step1CompanySelect({ state, updateState, onNext }: Step1Props) {
  useSignals()
  const companies = globalData.companies.value
  const [selectedCompanyId, setSelectedCompanyId] = useState(state.companyId || "")

  // Filter companies: only transporter companies OR logistics coordinators that are also transporters
  const transporterCompanies = useMemo(() => {
    return companies.filter(c => {
      if (!c.isActive) return false

      // Include all transporter companies
      if (c.companyType === "transporter") return true

      // Include logistics coordinators ONLY if they are also transporters
      if (c.companyType === "logistics_coordinator" && c.isAlsoTransporter) return true

      return false
    })
  }, [companies])

  const handleNext = () => {
    if (!selectedCompanyId) return

    updateState({ companyId: selectedCompanyId })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-4">Select the transporter or logistics coordinator company that owns this asset.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Company *</Label>
        <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
          <SelectTrigger id="company">
            <SelectValue placeholder="Select a company" />
          </SelectTrigger>
          <SelectContent>
            {transporterCompanies.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">No transporter companies found</div>
            ) : (
              transporterCompanies.map(company => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name} ({company.companyType})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Only transporter companies and logistics coordinators marked as transporters are shown</p>
      </div>

      {selectedCompanyId && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium">Selected Company:</p>
          <p className="text-sm text-muted-foreground">{transporterCompanies.find(c => c.id === selectedCompanyId)?.name}</p>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button onClick={handleNext} disabled={!selectedCompanyId}>
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
