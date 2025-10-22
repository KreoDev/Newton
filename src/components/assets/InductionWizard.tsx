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
  const [currentStep, setCurrentStep] = useState(1) // Internal step (1-8)
  const [wizardState, setWizardState] = useState<Partial<AssetInductionState>>({
    currentStep: 1,
    companyId: company?.id, // Auto-populate with current company
  })

  const totalSteps = 8 // Internal total (includes hidden steps)

  // Calculate visible steps dynamically based on whether Optional Fields is shown
  const shouldShowOptionalFields = (): boolean => {
    // Step 7 (Optional Fields) is shown if asset is a truck AND company has fleet/group settings
    const isValidTruck = wizardState.type === "truck"
    const fleetNumberEnabled = company?.systemSettings?.fleetNumberEnabled ?? false
    const groupEnabled = company?.systemSettings?.transporterGroupEnabled ?? false
    return isValidTruck && (fleetNumberEnabled || groupEnabled)
  }

  const visibleSteps = shouldShowOptionalFields() ? 4 : 3 // 4 steps with optional, 3 without

  // Map internal step (1-8) to display step (1-4 or 1-3)
  const getDisplayStep = (internalStep: number): number => {
    if (internalStep <= 2) return 1 // QR Scan + Verification
    if (internalStep <= 6) return 2 // License Scan + Verification + Detection + Confirmation
    if (internalStep === 7) return 3 // Optional Fields (fleet/group)
    return shouldShowOptionalFields() ? 4 : 3 // Review (step 4 if optional shown, step 3 if not)
  }

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
    console.log("🔙 prevStep called - currentStep:", currentStep, "displayStep:", getDisplayStep(currentStep))

    // Navigation based on INTERNAL steps (1-8):
    // Step 1-2 (Display 1: QR Scan) → Back to Assets
    // Step 3-6 (Display 2: License Scan) → Back to Step 1 (QR Scan)
    // Step 7 (Display 3: Optional Fields) → Back to Step 3 (License Scan)
    // Step 8 (Display 3 or 4: Review) → Back to Step 7 if shown, else Step 3

    if (currentStep <= 2) {
      // From QR Scan → navigate to Assets page
      console.log("🔙 From QR Scan - Back to Assets")
      handleBackToAssets()
      return
    }

    if (currentStep >= 3 && currentStep <= 6) {
      // From License Scan (any internal step 3-6) → Back to QR Scan (step 1)
      console.log("🔙 From License Scan - Jumping to Step 1 (QR Scan), clearing QR codes")
      updateState({
        firstQRCode: undefined,
        secondQRCode: undefined,
      })
      goToStep(1)
      return
    }

    if (currentStep === 7) {
      // From Optional Fields → Back to License Scan (step 3)
      console.log("🔙 From Optional Fields - Jumping to Step 3 (License Scan), clearing barcode data")
      updateState({
        firstBarcodeData: undefined,
        secondBarcodeData: undefined,
        parsedData: undefined, // Clear parsed data since we're re-scanning
      })
      goToStep(3)
      return
    }

    if (currentStep === 8) {
      // From Review → Back to Optional Fields (step 7) if shown, else License Scan (step 3)
      if (shouldShowOptionalFields()) {
        console.log("🔙 From Review - Back to Optional Fields (Step 7)")
        goToStep(7)
      } else {
        console.log("🔙 From Review - Jumping to Step 3 (License Scan), clearing barcode data")
        updateState({
          firstBarcodeData: undefined,
          secondBarcodeData: undefined,
          parsedData: undefined, // Clear parsed data since we're re-scanning
        })
        goToStep(3)
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

  const getStepTitle = (internalStep: number): string => {
    // All internal steps 1-2 show as "Scan QR Code"
    if (internalStep <= 2) {
      return "Scan QR Code"
    }
    // All internal steps 3-6 show as "Scan License/Disk"
    if (internalStep <= 6) {
      return "Scan License/Disk"
    }
    // Internal step 7 shows as "Enter Fleet/Group" (optional)
    if (internalStep === 7) {
      return "Enter Fleet/Group"
    }
    // Internal step 8 shows as "Review & Submit"
    return "Review & Submit"
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator - Shows only user-facing steps (3 or 4 depending on optional fields) */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {Array.from({ length: visibleSteps }, (_, i) => i + 1).map(displayStep => {
              const currentDisplayStep = getDisplayStep(currentStep)
              return (
                <div key={displayStep} className="flex items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                      displayStep < currentDisplayStep
                        ? "bg-green-500 text-white"
                        : displayStep === currentDisplayStep
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}>
                    {displayStep < currentDisplayStep ? <CheckCircle className="h-4 w-4" /> : displayStep}
                  </div>
                  {displayStep < visibleSteps && <div className={`h-1 flex-1 mx-2 ${displayStep < currentDisplayStep ? "bg-green-500" : "bg-muted"}`} />}
                </div>
              )
            })}
          </div>
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">
              Step {getDisplayStep(currentStep)} of {visibleSteps}
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
          {currentStep === 1 && <Step2QRScan state={wizardState} updateState={updateState} onNext={nextStep} onPrev={prevStep} />}
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
