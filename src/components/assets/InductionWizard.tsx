"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WizardSteps } from "@/components/ui/wizard-steps"
import { Step1QRScan } from "./wizard-steps/Step1QRScan"
import { Step2LicenseScan } from "./wizard-steps/Step2LicenseScan"
import { Step3OptionalFields } from "./wizard-steps/Step3OptionalFields"
import { Step4Review } from "./wizard-steps/Step4Review"
import type { AssetInductionState } from "@/types/asset-types"
import { useRouter } from "next/navigation"
import { useCompany } from "@/contexts/CompanyContext"

interface InductionWizardProps {
  onComplete?: () => void
}

export function InductionWizard({ onComplete }: InductionWizardProps) {
  const router = useRouter()
  const { company } = useCompany()
  const [currentStep, setCurrentStep] = useState(1) // User-facing step (1-4)
  const [wizardState, setWizardState] = useState<Partial<AssetInductionState>>({
    currentStep: 1,
    companyId: company?.id, // Auto-populate with current company
  })

  // Calculate visible steps dynamically based on whether Optional Fields is shown
  const shouldShowOptionalFields = (): boolean => {
    // Step 3 (Optional Fields) is shown if asset is a truck AND company has fleet/group settings
    const isValidTruck = wizardState.type === "truck"
    const fleetNumberEnabled = company?.systemSettings?.fleetNumberEnabled ?? false
    const groupEnabled = company?.systemSettings?.transporterGroupEnabled ?? false
    return isValidTruck && (fleetNumberEnabled || groupEnabled)
  }

  const totalSteps = shouldShowOptionalFields() ? 4 : 3 // 4 steps with optional, 3 without

  const updateState = (updates: Partial<AssetInductionState>) => {
    setWizardState(prev => ({ ...prev, ...updates }))
  }

  const goToStep = (step: number) => {
    setCurrentStep(step)
    updateState({ currentStep: step })
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      goToStep(currentStep + 1)
    }
  }

  const prevStep = () => {

    // Navigation based on 4 user-facing steps:
    // Step 1 (QR Scan) → Back to Assets
    // Step 2 (License Scan) → Back to Step 1 (QR Scan)
    // Step 3 (Optional Fields) → Back to Step 2 (License Scan)
    // Step 4 (Review) → Back to Step 3 if shown, else Step 2

    if (currentStep === 1) {
      // From QR Scan → navigate to Assets page
      handleBackToAssets()
      return
    }

    if (currentStep === 2) {
      // From License Scan → Back to QR Scan (step 1)
      updateState({
        firstQRCode: undefined,
        secondQRCode: undefined,
      })
      goToStep(1)
      return
    }

    if (currentStep === 3) {
      // From Optional Fields → Back to License Scan (step 2)
      updateState({
        firstBarcodeData: undefined,
        secondBarcodeData: undefined,
        parsedData: undefined,
      })
      goToStep(2)
      return
    }

    if (currentStep === 4) {
      // From Review → Back to Optional Fields (step 3) if shown, else License Scan (step 2)
      if (shouldShowOptionalFields()) {
        goToStep(3)
      } else {
        updateState({
          firstBarcodeData: undefined,
          secondBarcodeData: undefined,
          parsedData: undefined,
        })
        goToStep(2)
      }
      return
    }
  }

  const handleComplete = () => {
    if (onComplete) {
      onComplete()
    } else {
      router.push("/assets")
    }
  }

  const handleBackToAssets = () => {
    router.push("/assets")
  }

  const getStepTitle = (step: number): string => {
    switch (step) {
      case 1:
        return "Scan QR Code"
      case 2:
        return "Scan License/Disk"
      case 3:
        return shouldShowOptionalFields() ? "Enter Fleet/Group" : "Review & Submit"
      case 4:
        return "Review & Submit"
      default:
        return "Unknown Step"
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Progress Indicator - Shows user-facing steps (3 or 4 depending on optional fields) */}
      <WizardSteps currentStep={currentStep} totalSteps={totalSteps} />

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{getStepTitle(currentStep)}</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[400px]">
          {currentStep === 1 && <Step1QRScan state={wizardState} updateState={updateState} onNext={nextStep} onPrev={prevStep} />}
          {currentStep === 2 && <Step2LicenseScan state={wizardState} updateState={updateState} onNext={nextStep} onPrev={prevStep} />}
          {currentStep === 3 && shouldShowOptionalFields() && <Step3OptionalFields state={wizardState} updateState={updateState} onNext={nextStep} onPrev={prevStep} />}
          {currentStep === 3 && !shouldShowOptionalFields() && <Step4Review state={wizardState} onComplete={handleComplete} onPrev={prevStep} />}
          {currentStep === 4 && <Step4Review state={wizardState} onComplete={handleComplete} onPrev={prevStep} />}
        </CardContent>
      </Card>
    </div>
  )
}
