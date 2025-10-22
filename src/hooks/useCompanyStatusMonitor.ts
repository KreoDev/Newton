import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useCompany } from "@/contexts/CompanyContext"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"

/**
 * Hook to monitor company status changes in real-time
 * Detects when the current company becomes inactive
 */
export function useCompanyStatusMonitor() {
  useSignals()

  const { user, logout } = useAuth()
  const { company, companies } = useCompany()
  const [companyBecameInactive, setCompanyBecameInactive] = useState(false)
  const [hasActiveCompanies, setHasActiveCompanies] = useState(false)

  // Monitor company status changes
  useEffect(() => {
    if (!user || !company) {
      setCompanyBecameInactive(false)
      return
    }

    // Check if current company is inactive
    const currentCompany = globalData.companies.value.find(c => c.id === company.id)

    if (currentCompany && !currentCompany.isActive) {
      // Company has become inactive
      setCompanyBecameInactive(true)

      // Check if there are other active companies available (for global users)
      const activeCompanies = globalData.companies.value.filter(c => c.isActive && c.id !== company.id)
      setHasActiveCompanies(activeCompanies.length > 0)
    } else {
      setCompanyBecameInactive(false)
    }
  }, [user, company, globalData.companies.value])

  // Force logout for regular users
  const handleForceLogout = useCallback(async () => {
    await logout()
    setCompanyBecameInactive(false)
  }, [logout])

  // Reset state (after company switch or modal close)
  const resetState = useCallback(() => {
    setCompanyBecameInactive(false)
  }, [])

  return {
    companyBecameInactive,
    isGlobalUser: Boolean(user?.isGlobal),
    hasActiveCompanies,
    availableCompanies: companies.filter(c => c.id !== company?.id),
    handleForceLogout,
    resetState,
  }
}
