"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AssetInductionState } from "@/types/asset-types"
import { ArrowRight, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface Step3Props {
  state: Partial<AssetInductionState>
  updateState: (updates: Partial<AssetInductionState>) => void
  onNext: () => void
  onPrev: () => void
  onError: () => void
}

export function Step3QRVerification({ state, updateState, onNext, onPrev, onError }: Step3Props) {
  const [qrCode, setQrCode] = useState("")
  const [error, setError] = useState("")
  const [isMatch, setIsMatch] = useState(false)

  useEffect(() => {
    // Auto-focus the input when component mounts
    const input = document.getElementById("qr-verify-input")
    if (input) {
      input.focus()
    }
  }, [])

  useEffect(() => {
    // Check if codes match
    if (qrCode && state.firstQRCode) {
      if (qrCode.trim() === state.firstQRCode.trim()) {
        setIsMatch(true)
        setError("")
      } else {
        setIsMatch(false)
        setError("QR codes do not match")
      }
    }
  }, [qrCode, state.firstQRCode])

  const handleNext = () => {
    if (!qrCode.trim()) {
      setError("Please scan the QR code again")
      return
    }

    if (!isMatch) {
      toast.error("QR codes do not match. Please try again.")
      setTimeout(() => {
        onError() // Return to Step 2
      }, 1500)
      return
    }

    updateState({ secondQRCode: qrCode.trim() })
    onNext()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleNext()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-4">Scan the same QR code again to verify accuracy.</p>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium">First QR Code:</p>
        <p className="text-sm text-muted-foreground font-mono">{state.firstQRCode}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="qr-verify-input">QR Code (Verification) *</Label>
        <Input
          id="qr-verify-input"
          type="text"
          placeholder="Scan QR code again..."
          value={qrCode}
          onChange={e => {
            setQrCode(e.target.value)
            setError("")
          }}
          onKeyPress={handleKeyPress}
          className={error ? "border-red-500" : isMatch ? "border-green-500" : ""}
          autoComplete="off"
        />
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        {isMatch && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>QR codes match!</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Scan the same QR code to confirm</p>
      </div>

      {isMatch && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">Verification Successful</p>
              <p className="text-xs text-muted-foreground">QR codes match perfectly</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={handleNext} disabled={!isMatch}>
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
