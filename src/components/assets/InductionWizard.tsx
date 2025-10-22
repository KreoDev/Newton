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

interface InductionWizardProps {
  onComplete?: () => void
}

export function InductionWizard({ onComplete }: InductionWizardProps) {
  const router = useRouter()
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

  const prevStep = () => {
    if (currentStep > 1) {
      let targetStep = currentStep - 1

      // Skip automated verification steps when going backwards
      // Step 3 (QR Verification) and Step 5 (License Verification) auto-advance
      // So we skip them and go to the manual scan steps instead

      if (currentStep === 4) {
        // From License Scan → skip QR Verification → go to QR Scan
        targetStep = 2
      } else if (currentStep >= 6) {
        // From Asset Type Detection onwards → skip License Verification → go to License Scan
        targetStep = currentStep - 1
        if (targetStep === 5) {
          targetStep = 4 // Skip Step 5 (License Verification)
        }
        if (targetStep === 3) {
          targetStep = 2 // Skip Step 3 (QR Verification)
        }
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
