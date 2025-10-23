"use client"

import React from "react"
import { CheckCircle } from "lucide-react"

interface WizardStepsProps {
  currentStep: number
  totalSteps: number
  className?: string
}

/**
 * Reusable wizard step indicator with progress line
 *
 * Features:
 * - Green checkmark for completed steps
 * - Primary color for current step
 * - Muted color for pending steps
 * - Green progress line connecting completed steps
 * - Consistent styling across all wizards
 *
 * Usage:
 * <WizardSteps currentStep={3} totalSteps={9} />
 */
export function WizardSteps({ currentStep, totalSteps, className = "" }: WizardStepsProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between w-full">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step, index) => {
          const isCompleted = step < currentStep
          const isCurrent = step === currentStep

          return (
            <React.Fragment key={step}>
              {/* Step Circle */}
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isCurrent
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? <CheckCircle className="h-4 w-4" /> : step}
              </div>

              {/* Connecting Line (except after last step) */}
              {index < totalSteps - 1 && (
                <div
                  className={`h-1 flex-1 transition-colors ${
                    isCompleted ? "bg-green-500" : "bg-muted"
                  }`}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Step Counter */}
      <div className="mt-2">
        <p className="text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </p>
      </div>
    </div>
  )
}
