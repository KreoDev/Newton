"use client"

import { CheckCircle2, XCircle, AlertTriangle, AlertCircle } from "lucide-react"
import { useAlertStore } from "@/hooks/useAlert"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogAction, AlertDialogCancel } from "./alert-dialog"
import { useState } from "react"

const variantConfig = {
  success: {
    icon: CheckCircle2,
    iconColor: "text-green-600 dark:text-green-500",
    iconBg: "bg-green-100/80 dark:bg-green-900/30 backdrop-blur-sm",
  },
  error: {
    icon: XCircle,
    iconColor: "text-red-600 dark:text-red-500",
    iconBg: "bg-red-100/80 dark:bg-red-900/30 backdrop-blur-sm",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-yellow-600 dark:text-yellow-500",
    iconBg: "bg-yellow-100/80 dark:bg-yellow-900/30 backdrop-blur-sm",
  },
  info: {
    icon: AlertCircle,
    iconColor: "text-blue-600 dark:text-blue-500",
    iconBg: "bg-blue-100/80 dark:bg-blue-900/30 backdrop-blur-sm",
  },
  confirm: {
    icon: AlertCircle,
    iconColor: "text-blue-600 dark:text-blue-500",
    iconBg: "bg-blue-100/80 dark:bg-blue-900/30 backdrop-blur-sm",
  },
}

export function AlertProvider() {
  const { open, variant, title, description, confirmText, cancelText, showCancel, onConfirm, onCancel, loading, hideAlert } = useAlertStore()

  const [isProcessing, setIsProcessing] = useState(false)

  const config = variantConfig[variant]
  const Icon = config.icon

  const handleConfirm = async () => {
    if (isProcessing) return

    if (onConfirm) {
      setIsProcessing(true)
      try {
        await onConfirm()
      } catch (error) {
        console.error("Alert confirm error:", error)
      } finally {
        setIsProcessing(false)
      }
    }

    hideAlert()
  }

  const handleCancel = () => {
    if (isProcessing) return

    if (onCancel) {
      onCancel()
    }

    hideAlert()
  }

  return (
    <AlertDialog open={open} onOpenChange={open => !open && !isProcessing && hideAlert()}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          {/* Icon */}
          <div className="flex justify-center mb-2">
            <div className={`${config.iconBg} rounded-full p-3 shadow-inner`}>
              <Icon className={`h-8 w-8 ${config.iconColor}`} strokeWidth={2} />
            </div>
          </div>

          <AlertDialogTitle className="text-center">{title}</AlertDialogTitle>
          {description && <AlertDialogDescription className="text-center">{description}</AlertDialogDescription>}
        </AlertDialogHeader>

        <AlertDialogFooter className="sm:justify-center gap-2">
          {showCancel && (
            <AlertDialogCancel onClick={handleCancel} disabled={isProcessing}>
              {cancelText}
            </AlertDialogCancel>
          )}
          <AlertDialogAction onClick={handleConfirm} disabled={isProcessing} className={variant === "error" || variant === "confirm" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}>
            {isProcessing ? "Please wait..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
