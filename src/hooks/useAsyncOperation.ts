import { useState, useCallback } from "react"
import { useAlert } from "./useAlert"

interface AsyncOperationOptions {
  successMessage?: string
  errorMessage?: string
  onSuccess?: () => void
  onError?: (error: Error) => void
  showSuccessToast?: boolean
  showErrorToast?: boolean
}

/**
 * Hook for managing async operations with loading states
 * Automatically handles loading, error states, and success/error alerts
 */
export function useAsyncOperation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showSuccess, showError } = useAlert()

  const execute = useCallback(
    async <T,>(operation: () => Promise<T>, options: AsyncOperationOptions = {}): Promise<T | null> => {
      const {
        successMessage,
        errorMessage = "An error occurred",
        onSuccess,
        onError,
        showSuccessToast = true,
        showErrorToast = true,
      } = options

      try {
        setLoading(true)
        setError(null)

        const result = await operation()

        if (successMessage && showSuccessToast) {
          showSuccess("Success", successMessage)
        }

        if (onSuccess) {
          onSuccess()
        }

        return result
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : errorMessage
        setError(errorMsg)

        if (showErrorToast) {
          showError("Error", errorMsg)
        }

        if (onError && err instanceof Error) {
          onError(err)
        }

        console.error("Async operation error:", err)
        return null
      } finally {
        setLoading(false)
      }
    },
    [showSuccess, showError]
  )

  const reset = useCallback(() => {
    setError(null)
    setLoading(false)
  }, [])

  return {
    loading,
    error,
    execute,
    reset,
    isIdle: !loading && !error,
    isError: Boolean(error),
  }
}

/**
 * Simplified version for operations that don't need custom error handling
 */
export function useSimpleAsyncOperation<T>() {
  const [loading, setLoading] = useState(false)

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T | null> => {
    try {
      setLoading(true)
      return await operation()
    } catch (error) {
      console.error("Operation error:", error)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, execute }
}
