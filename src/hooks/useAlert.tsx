"use client"

import { create } from "zustand"

export type AlertVariant = "success" | "error" | "warning" | "info" | "confirm"

export interface AlertState {
  open: boolean
  variant: AlertVariant
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
}

interface AlertStore extends AlertState {
  showAlert: (alert: Omit<AlertState, "open">) => void
  hideAlert: () => void
  setLoading: (loading: boolean) => void
  loading: boolean
}

export const useAlertStore = create<AlertStore>((set) => ({
  open: false,
  variant: "info",
  title: "",
  description: undefined,
  confirmText: "OK",
  cancelText: "Cancel",
  showCancel: false,
  onConfirm: undefined,
  onCancel: undefined,
  loading: false,
  showAlert: (alert) =>
    set({
      ...alert,
      open: true,
      confirmText: alert.confirmText || "OK",
      cancelText: alert.cancelText || "Cancel",
      showCancel: alert.showCancel ?? false,
    }),
  hideAlert: () => set({ open: false, loading: false }),
  setLoading: (loading) => set({ loading }),
}))

export function useAlert() {
  const store = useAlertStore()

  const showSuccess = (title: string, description?: string, onConfirm?: () => void) => {
    store.showAlert({
      variant: "success",
      title,
      description,
      confirmText: "OK",
      showCancel: false,
      onConfirm,
    })
  }

  const showError = (title: string, description?: string, onConfirm?: () => void) => {
    store.showAlert({
      variant: "error",
      title,
      description,
      confirmText: "OK",
      showCancel: false,
      onConfirm,
    })
  }

  const showWarning = (title: string, description?: string, onConfirm?: () => void) => {
    store.showAlert({
      variant: "warning",
      title,
      description,
      confirmText: "OK",
      showCancel: false,
      onConfirm,
    })
  }

  const showInfo = (title: string, description?: string, onConfirm?: () => void) => {
    store.showAlert({
      variant: "info",
      title,
      description,
      confirmText: "OK",
      showCancel: false,
      onConfirm,
    })
  }

  const showConfirm = (
    title: string,
    description?: string,
    confirmText = "Confirm",
    variant?: "default" | "destructive"
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      store.showAlert({
        variant: "confirm",
        title,
        description,
        confirmText,
        cancelText: "Cancel",
        showCancel: true,
        onConfirm: () => {
          resolve(true)
          store.hideAlert()
        },
        onCancel: () => {
          resolve(false)
          store.hideAlert()
        },
      })
    })
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    hideAlert: store.hideAlert,
  }
}
