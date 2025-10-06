"use client"

import { createContext, useContext, useEffect, useMemo, useState, useCallback, ReactNode } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"
import type { Company } from "@/types"

interface CompanyContextType {
  company: Company | null
  companies: Company[]
  switchCompany: (companyId: string) => Promise<void>
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: ReactNode }) {
  useSignals()

  const { user, refreshUser } = useAuth()
  const [company, setCompany] = useState<Company | null>(null)

  const companies = globalData.companies.value.filter(c => c.isActive !== false)

  useEffect(() => {
    if (!user) {
      setCompany(null)
      return
    }

    return globalData.initializeForCompany(user.companyId)
  }, [user, user?.companyId])

  useEffect(() => {
    if (!user) {
      setCompany(null)
      return
    }

    const activeCompany = globalData.companies.value.find(c => c.id === user.companyId)
    setCompany(activeCompany ?? null)
  }, [globalData.companies.value, user])

  const switchCompany = useCallback(
    async (companyId: string) => {
      if (!user) return
      try {
        await updateDoc(doc(db, "users", user.id), { companyId, updatedAt: Date.now(), dbUpdatedAt: serverTimestamp() })
        await refreshUser()
        const selectedCompany = globalData.companies.value.find(c => c.id === companyId) ?? null
        setCompany(selectedCompany)
      } catch (error) {
        console.error("Failed to switch company", error)
      }
    },
    [user, refreshUser]
  )

  const value = useMemo(
    () => ({
      company,
      companies,
      switchCompany,
    }),
    [company, companies, switchCompany]
  )

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
}

export function useCompany() {
  const ctx = useContext(CompanyContext)
  if (!ctx) throw new Error("useCompany must be inside CompanyProvider")
  return ctx
}
