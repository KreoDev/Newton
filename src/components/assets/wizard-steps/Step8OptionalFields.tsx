"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AssetInductionState } from "@/types/asset-types"
import { ArrowRight, ArrowLeft } from "lucide-react"
import { useSignals } from "@preact/signals-react/runtime"
import { data as globalData } from "@/services/data.service"
import { toast } from "sonner"

interface Step8Props {
  state: Partial<AssetInductionState>
  updateState: (updates: Partial<AssetInductionState>) => void
  onNext: () => void
  onPrev: () => void
}

export function Step8OptionalFields({ state, updateState, onNext, onPrev }: Step8Props) {
  useSignals()
  const companies = globalData.companies.value

  const [fleetNumber, setFleetNumber] = useState(state.fleetNumber || "")
  const [groupId, setGroupId] = useState(state.groupId || "")

  const selectedCompany = useMemo(() => {
    return companies.find(c => c.id === state.companyId)
  }, [companies, state.companyId])

  const fleetNumberEnabled = selectedCompany?.systemSettings?.fleetNumberEnabled ?? false
  const groupEnabled = selectedCompany?.systemSettings?.transporterGroupEnabled ?? false

  // Get group options from company systemSettings
  const groupOptions = useMemo(() => {
    return selectedCompany?.systemSettings?.groupOptions || []
  }, [selectedCompany])

  const handleContinue = () => {
    // Validate required fields
    if (fleetNumberEnabled && !fleetNumber.trim()) {
      toast.error(`${selectedCompany?.systemSettings?.fleetNumberLabel || "Fleet Number"} is required`)
      return
    }

    if (groupEnabled && !groupId) {
      toast.error(`${selectedCompany?.systemSettings?.transporterGroupLabel || "Group"} is required`)
      return
    }

    // Update state with values and proceed
    updateState({
      fleetNumber: fleetNumber.trim() || undefined,
      groupId: groupId || undefined,
    })
    onNext()
  }

  // If both fields are disabled, auto-skip
  useEffect(() => {
    if (!fleetNumberEnabled && !groupEnabled) {
      updateState({
        fleetNumber: undefined,
        groupId: undefined,
      })
      onNext()
    }
  }, [fleetNumberEnabled, groupEnabled])

  if (!fleetNumberEnabled && !groupEnabled) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No optional fields configured. Skipping...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-4">Complete the required information for this asset. These fields are configured in the company&apos;s system settings.</p>
      </div>

      {fleetNumberEnabled && (
        <div className="space-y-2">
          <Label htmlFor="fleetNumber">
            {selectedCompany?.systemSettings?.fleetNumberLabel || "Fleet Number"} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fleetNumber"
            type="text"
            placeholder={`Enter ${selectedCompany?.systemSettings?.fleetNumberLabel?.toLowerCase() || "fleet number"}...`}
            value={fleetNumber}
            onChange={e => setFleetNumber(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">Required: Internal fleet identifier for this asset</p>
        </div>
      )}

      {groupEnabled && (
        <div className="space-y-2">
          <Label htmlFor="group">
            {selectedCompany?.systemSettings?.transporterGroupLabel || "Group"} <span className="text-destructive">*</span>
          </Label>
          <Select value={groupId || undefined} onValueChange={setGroupId} required>
            <SelectTrigger id="group">
              <SelectValue placeholder="Select a group..." />
            </SelectTrigger>
            <SelectContent>
              {groupOptions.map((groupName, index) => (
                <SelectItem key={index} value={groupName}>
                  {groupName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Required: Assign this asset to a group</p>
        </div>
      )}

      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">Summary:</p>
        <div className="space-y-1 text-sm">
          {fleetNumberEnabled && (
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">{selectedCompany?.systemSettings?.fleetNumberLabel || "Fleet Number"}:</span>
              <span className={!fleetNumber ? "text-destructive" : ""}>{fleetNumber || "Required"}</span>
            </div>
          )}
          {groupEnabled && (
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">{selectedCompany?.systemSettings?.transporterGroupLabel || "Group"}:</span>
              <span className={!groupId ? "text-destructive" : ""}>{groupId || "Required"}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={handleContinue}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
