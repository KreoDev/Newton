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

interface Step8Props {
  state: Partial<AssetInductionState>
  updateState: (updates: Partial<AssetInductionState>) => void
  onNext: () => void
  onPrev: () => void
}

export function Step8OptionalFields({ state, updateState, onNext, onPrev }: Step8Props) {
  useSignals()
  const companies = globalData.companies.value
  const groups = globalData.groups.value

  const [fleetNumber, setFleetNumber] = useState(state.fleetNumber || "")
  const [groupId, setGroupId] = useState(state.groupId || "")

  const selectedCompany = useMemo(() => {
    return companies.find(c => c.id === state.companyId)
  }, [companies, state.companyId])

  const fleetNumberEnabled = selectedCompany?.systemSettings?.fleetNumberEnabled ?? false
  const groupEnabled = selectedCompany?.systemSettings?.transporterGroupEnabled ?? false

  // Filter groups for the selected company
  const companyGroups = useMemo(() => {
    return groups.filter(g => g.companyId === state.companyId && g.isActive)
  }, [groups, state.companyId])

  const handleNext = () => {
    updateState({
      fleetNumber: fleetNumber.trim() || undefined,
      groupId: groupId || undefined,
    })
    onNext()
  }

  const handleSkip = () => {
    updateState({
      fleetNumber: undefined,
      groupId: undefined,
    })
    onNext()
  }

  // If both fields are disabled, auto-skip
  useEffect(() => {
    if (!fleetNumberEnabled && !groupEnabled) {
      handleSkip()
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
        <p className="text-muted-foreground mb-4">Add optional information to this asset. These fields are configured in the company&apos;s system settings.</p>
      </div>

      {fleetNumberEnabled && (
        <div className="space-y-2">
          <Label htmlFor="fleetNumber">
            {selectedCompany?.systemSettings?.fleetNumberLabel || "Fleet Number"}
          </Label>
          <Input
            id="fleetNumber"
            type="text"
            placeholder={`Enter ${selectedCompany?.systemSettings?.fleetNumberLabel?.toLowerCase() || "fleet number"}...`}
            value={fleetNumber}
            onChange={e => setFleetNumber(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Optional: Internal fleet identifier for this asset</p>
        </div>
      )}

      {groupEnabled && (
        <div className="space-y-2">
          <Label htmlFor="group">
            {selectedCompany?.systemSettings?.transporterGroupLabel || "Transporter Group"}
          </Label>
          <Select value={groupId} onValueChange={setGroupId}>
            <SelectTrigger id="group">
              <SelectValue placeholder="Select a group (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {companyGroups.map(group => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Optional: Assign this asset to a transporter group</p>
        </div>
      )}

      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">Summary:</p>
        <div className="space-y-1 text-sm">
          {fleetNumberEnabled && (
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">{selectedCompany?.systemSettings?.fleetNumberLabel || "Fleet Number"}:</span>
              <span>{fleetNumber || "Not set"}</span>
            </div>
          )}
          {groupEnabled && (
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">{selectedCompany?.systemSettings?.transporterGroupLabel || "Group"}:</span>
              <span>{groupId ? companyGroups.find(g => g.id === groupId)?.name : "Not set"}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleSkip}>
            Skip
          </Button>
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
