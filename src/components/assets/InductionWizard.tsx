"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { Step2QRScan } from "./wizard-steps/Step2QRScan"
import { Step3QRVerification } from "./wizard-steps/Step3QRVerification"
import { Step4LicenseScan } from "./wizard-steps/Step4LicenseScan"
import { Step5LicenseVerification } from "./wizard-steps/Step5LicenseVerification"
import { Step6AssetTypeDetection } from "./wizard-steps/Step6AssetTypeDetection"
import { Step7FieldConfirmation } from "./wizard-steps/Step7FieldConfirmation"
import { Step8OptionalFields } from "./wizard-steps/Step8OptionalFields"
import { Step9Review } from "./wizard-steps/Step9Review"
import type { AssetInductionState } from "@/types/asset-types"
import { useRouter } from "next/navigation"
import { useCompany } from "@/contexts/CompanyContext"

interface InductionWizardProps {
  onComplete?: () => void
}

export function InductionWizard({ onComplete }: InductionWizardProps) {
  const router = useRouter()
  const { company } = useCompany()
  const [currentStep, setCurrentStep] = useState(1)
  const [wizardState, setWizardState] = useState<Partial<AssetInductionState>>({
    currentStep: 1,
    companyId: company?.id, // Auto-populate with current company
  })

  const totalSteps = 8

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
    console.log("🔙 prevStep called - currentStep:", currentStep)
    if (currentStep > 1) {
      let targetStep = currentStep - 1
      let stateClear: Partial<AssetInductionState> = {}

      // Navigation rules for Previous button (8 steps total, no company select):
      // - Step 1: QR Scan (First)
      // - Step 2: QR Verification (Second) - auto-advances
      // - Step 3: License Scan (First)
      // - Step 4: License Verification (Second) - auto-advances
      // - Step 5: Asset Type Detection - auto-advances
      // - Step 6: Field Confirmation
      // - Step 7: Optional Fields (conditional)
      // - Step 8: Review
      //
      // Previous button navigation:
      // - From Step 3 → Step 1 (skip Step 2 QR Verification)
      // - From Steps 6, 7, 8 → Step 3 (skip Steps 4 and 5)

      if (currentStep === 3) {
        // From License Scan → jump to QR Scan (skip Step 2 QR Verification)
        // Clear QR codes so Step 1 doesn't auto-advance
        console.log("🔙 From Step 3 - Jumping to Step 1 (skipping Step 2), clearing QR codes")
        targetStep = 1
        stateClear = {
          firstQRCode: undefined,
          secondQRCode: undefined,
        }
      } else if (currentStep === 6 || currentStep === 7 || currentStep === 8) {
        // From Field Confirmation, Optional Fields, or Review → jump to License Scan
        // Skip Steps 4 (License Verification) and 5 (Asset Type Detection)
        // Clear barcode data and parsed data so Step 3 doesn't auto-advance
        console.log(`🔙 From Step ${currentStep} - Jumping to Step 3 (skipping Steps 4, 5), clearing barcode data`)
        targetStep = 3
        stateClear = {
          firstBarcodeData: undefined,
          secondBarcodeData: undefined,
          parsedData: undefined, // Clear parsed data since we're re-scanning
        }
      } else {
        // Default: go to previous step (Step 2 → Step 1)
        targetStep = currentStep - 1
        console.log(`🔙 From Step ${currentStep} - Default navigation to Step ${targetStep}`)
      }

      console.log(`🔙 Final navigation: Step ${currentStep} → Step ${targetStep}`)
      console.log("🔙 Clearing state:", stateClear)

      // Clear state first, then navigate
      if (Object.keys(stateClear).length > 0) {
        updateState(stateClear)
      }
      goToStep(targetStep)
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
        return "Scan QR Code (First)"
      case 2:
        return "Verify QR Code (Second)"
      case 3:
        return "Scan License/Disk (First)"
      case 4:
        return "Verify License/Disk (Second)"
      case 5:
        return "Detect Asset Type"
      case 6:
        return "Confirm & Validate Fields"
      case 7:
        return "Optional Fields"
      case 8:
        return "Review & Submit"
      default:
        return "Asset Induction"
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map(step => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                    step < currentStep
                      ? "bg-green-500 text-white"
                      : step === currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
                  {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
                </div>
                {step < totalSteps && <div className={`h-1 flex-1 mx-2 ${step < currentStep ? "bg-green-500" : "bg-muted"}`} />}
              </div>
            ))}
          </div>
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{getStepTitle(currentStep)}</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[400px]">
          {currentStep === 1 && <Step2QRScan state={wizardState} updateState={updateState} onNext={nextStep} onPrev={handleBackToAssets} />}
          {currentStep === 2 && <Step3QRVerification state={wizardState} updateState={updateState} onNext={nextStep} onPrev={prevStep} onError={() => goToStep(1)} />}
          {currentStep === 3 && <Step4LicenseScan state={wizardState} updateState={updateState} onNext={nextStep} onPrev={prevStep} />}
          {currentStep === 4 && <Step5LicenseVerification state={wizardState} updateState={updateState} onNext={nextStep} onPrev={prevStep} onError={() => goToStep(3)} />}
          {currentStep === 5 && <Step6AssetTypeDetection state={wizardState} updateState={updateState} onNext={nextStep} onPrev={prevStep} />}
          {currentStep === 6 && <Step7FieldConfirmation state={wizardState} updateState={updateState} onNext={nextStep} onPrev={prevStep} onError={handleBackToAssets} />}
          {currentStep === 7 && <Step8OptionalFields state={wizardState} updateState={updateState} onNext={nextStep} onPrev={prevStep} />}
          {currentStep === 8 && <Step9Review state={wizardState} onComplete={handleComplete} onPrev={prevStep} />}
        </CardContent>
      </Card>
    </div>
  )
}
