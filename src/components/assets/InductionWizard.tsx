"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { Step1CompanySelect } from "./wizard-steps/Step1CompanySelect"
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
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"

interface InductionWizardProps {
  onComplete?: () => void
}

export function InductionWizard({ onComplete }: InductionWizardProps) {
  useSignals()
  const router = useRouter()
  const companies = globalData.companies.value
  const [currentStep, setCurrentStep] = useState(1)
  const [wizardState, setWizardState] = useState<Partial<AssetInductionState>>({
    currentStep: 1,
  })

  const totalSteps = 9

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

  // Helper function to check if Step 8 (Optional Fields) should be shown
  // Step 8 is only shown if the asset is a truck AND company has fleet/group settings enabled
  const shouldShowStep8 = (): boolean => {
    const selectedCompany = companies.find(c => c.id === wizardState.companyId)
    if (!selectedCompany || wizardState.type !== "truck") {
      return false
    }
    const fleetNumberEnabled = selectedCompany?.systemSettings?.fleetNumberEnabled ?? false
    const groupEnabled = selectedCompany?.systemSettings?.transporterGroupEnabled ?? false
    return fleetNumberEnabled || groupEnabled
  }

  const prevStep = () => {
    console.log("🔙 prevStep called - currentStep:", currentStep)
    if (currentStep > 1) {
      let targetStep = currentStep - 1
      let stateClear: Partial<AssetInductionState> = {}

      // Navigation rules for Previous button:
      // - From Step 4 → Step 2 (skip Step 3 QR Verification)
      // - From Step 7, 8, 9 → Step 4 (skip Steps 5 and 6)
      // - Step 6 is never manual (auto-advances), so no Previous from there

      if (currentStep === 4) {
        // From License Scan → jump to QR Scan (skip Step 3 QR Verification)
        // Clear QR codes so Step 2 doesn't auto-advance
        console.log("🔙 From Step 4 - Jumping to Step 2 (skipping Step 3), clearing QR codes")
        targetStep = 2
        stateClear = {
          firstQRCode: undefined,
          secondQRCode: undefined,
        }
      } else if (currentStep === 7 || currentStep === 8 || currentStep === 9) {
        // From Field Confirmation, Optional Fields, or Review → jump to License Scan
        // Skip Steps 5 (License Verification) and 6 (Asset Type Detection)
        // Clear barcode data and parsed data so Step 4 doesn't auto-advance
        console.log(`🔙 From Step ${currentStep} - Jumping to Step 4 (skipping Steps 5, 6), clearing barcode data`)
        targetStep = 4
        stateClear = {
          firstBarcodeData: undefined,
          secondBarcodeData: undefined,
          parsedData: undefined, // Clear parsed data since we're re-scanning
        }
      } else {
        // Default: go to previous step (Step 1 → nowhere, Step 2 → Step 1, Step 3 → Step 2)
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
        return "Select Company"
      case 2:
        return "Scan QR Code (First)"
      case 3:
        return "Verify QR Code (Second)"
      case 4:
        return "Scan License/Disk (First)"
      case 5:
        return "Verify License/Disk (Second)"
      case 6:
        return "Detect Asset Type"
      case 7:
        return "Confirm & Validate Fields"
      case 8:
        return "Optional Fields"
      case 9:
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
          {currentStep === 1 && <Step1CompanySelect state={wizardState} updateState={updateState} onNext={nextStep} onBack={handleBackToAssets} />}
          {currentStep === 2 && <Step2QRScan state={wizardState} updateState={updateState} onNext={nextStep} onPrev={prevStep} />}
          {currentStep === 3 && <Step3QRVerification state={wizardState} updateState={updateState} onNext={nextStep} onPrev={prevStep} onError={() => goToStep(2)} />}
          {currentStep === 4 && <Step4LicenseScan state={wizardState} updateState={updateState} onNext={nextStep} onPrev={prevStep} />}
          {currentStep === 5 && <Step5LicenseVerification state={wizardState} updateState={updateState} onNext={nextStep} onPrev={prevStep} onError={() => goToStep(4)} />}
          {currentStep === 6 && <Step6AssetTypeDetection state={wizardState} updateState={updateState} onNext={nextStep} onPrev={prevStep} />}
          {currentStep === 7 && <Step7FieldConfirmation state={wizardState} updateState={updateState} onNext={nextStep} onPrev={prevStep} onError={() => goToStep(1)} />}
          {currentStep === 8 && <Step8OptionalFields state={wizardState} updateState={updateState} onNext={nextStep} onPrev={prevStep} />}
          {currentStep === 9 && <Step9Review state={wizardState} onComplete={handleComplete} onPrev={prevStep} />}
        </CardContent>
      </Card>
    </div>
  )
}
