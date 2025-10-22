"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { Step1QRScan } from "./wizard-steps/Step1QRScan"
import { Step2LicenseScan } from "./wizard-steps/Step2LicenseScan"
import { Step3OptionalFields } from "./wizard-steps/Step3OptionalFields"
import { Step4Review } from "./wizard-steps/Step4Review"
import type { AssetInductionState } from "@/types/asset-types"
import { useRouter } from "next/navigation"
import { useCompany } from "@/contexts/CompanyContext"

const testDriver =
  "019B094500003D04B647B0F15FC4861E1CEA68F8EFD04137F5CF55623BB7F14A3757E887075E8EBBF0A649B64504F151962E8F2F5A3BE2356284DC6C48D1740DE577B6654DF26AD708A8158E0F4CA5CE2E7F5FEF384ED84DF6B58D3D8F52C0D658D14CD87974AD1623D2958A45E3F846A71924B0232D30A604BFB02FDF8F6D965E00D0C3C113B3A4B1C38584B6B8FC54BE559FB80B294AD35B13A02BEB39C51896E0FB5FD07318AF1855F3AC478E81EABE5B191077760113E8BCB1680E4965AE70C8BAE5A8A9AC90F70250F6472FB1BBBE0ED629F959B38E8356207851CDA52A774A42A0A049C900B851A26CC14FFAF6519508CAE78EC2BF6A30DD739009A6B4FD65EE3761C41CD235172AB1803E402F8F755A54D6E622AE0328F10E1CF671617375E8FB186F907AB0E07FF1A3D16857437E5F1752FECA11BDE5F4BA3F15218E688BAA08EBF0E0148B005430045D9AE9B3E4B22138D538B9856BA1EF0CB1C89EBD59D3588CD14FF10B5788D91669D07731ED9048F7A8F74262B3C2548C2E8A54816B93D4E8498067BC4861A29A0BE86F3F9E5A35B1D176979E47EFE1D67125DDC517ECB27C1AC292581C3BAC8CF57829F6AEF2E52BAFD3D76D56D8E6C497592E6B29AE286A816C457E174C34B7D3CEBAF8D46F4797837A8942889B77CFE76C56AA1BF5D47F3B3FCE7D20CB9ADEB97CCEC05E5DA1DB3F1A8C01AF59F7847D022926ED8B78E5256ADF2E366A7CF639221A2ABF3903B43E416329253003BE88BC9E9D69DDF755CCF979932550AEB37567F534AB8681DDFABDE7FA4FE780446A0F5D085342752D442151FF606ADF822B6076D3F90B1549D4E2A81AE8071819E3EBC42C0CE11D1D9D374B310592B6C445A6D3C09706295A8474BA9EC8CFB91FEC32D86440E26BD008B0C9CC4B8988453093CD1629FEDE4E42743DE7FA4AA4FA69D84CAF57FB7DCB215578EDD24673840A7F348722F3595F7D9A694FBD233F95DDDF3181A8FCAF5FA7E64438DDB26DF479D79E"

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
    console.log("🔙 prevStep called - currentStep:", currentStep)

    // Navigation based on 4 user-facing steps:
    // Step 1 (QR Scan) → Back to Assets
    // Step 2 (License Scan) → Back to Step 1 (QR Scan)
    // Step 3 (Optional Fields) → Back to Step 2 (License Scan)
    // Step 4 (Review) → Back to Step 3 if shown, else Step 2

    if (currentStep === 1) {
      // From QR Scan → navigate to Assets page
      console.log("🔙 From QR Scan - Back to Assets")
      handleBackToAssets()
      return
    }

    if (currentStep === 2) {
      // From License Scan → Back to QR Scan (step 1)
      console.log("🔙 From License Scan - Back to Step 1 (QR Scan), clearing QR codes")
      updateState({
        firstQRCode: undefined,
        secondQRCode: undefined,
      })
      goToStep(1)
      return
    }

    if (currentStep === 3) {
      // From Optional Fields → Back to License Scan (step 2)
      console.log("🔙 From Optional Fields - Back to Step 2 (License Scan), clearing barcode data")
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
        console.log("🔙 From Review - Back to Optional Fields (Step 3)")
        goToStep(3)
      } else {
        console.log("🔙 From Review - Back to Step 2 (License Scan), clearing barcode data")
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
    <div className="space-y-6">
      {/* Progress Indicator - Shows user-facing steps (3 or 4 depending on optional fields) */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map(step => {
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${step < currentStep ? "bg-green-500 text-white" : step === currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}</div>
                  {step < totalSteps && <div className={`h-1 flex-1 mx-2 ${step < currentStep ? "bg-green-500" : "bg-muted"}`} />}
                </div>
              )
            })}
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
          {currentStep === 1 && <Step1QRScan state={wizardState} updateState={updateState} onNext={nextStep} onPrev={prevStep} />}
          {currentStep === 2 && <Step2LicenseScan state={wizardState} updateState={updateState} onNext={nextStep} onPrev={prevStep} testDriverHex={testDriver} />}
          {currentStep === 3 && shouldShowOptionalFields() && <Step3OptionalFields state={wizardState} updateState={updateState} onNext={nextStep} onPrev={prevStep} />}
          {currentStep === 3 && !shouldShowOptionalFields() && <Step4Review state={wizardState} onComplete={handleComplete} onPrev={prevStep} />}
          {currentStep === 4 && <Step4Review state={wizardState} onComplete={handleComplete} onPrev={prevStep} />}
        </CardContent>
      </Card>
    </div>
  )
}
