"use client"

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { doc, updateDoc, collection, getDocs, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { data as globalData, CompanySummary } from "@/services/data.service"

interface CompanyContextType {
  company: CompanySummary | null
  companies: CompanySummary[]
  switchCompany: (companyId: string) => Promise<void>
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user, refreshUser } = useAuth()
  const [company, setCompany] = useState<CompanySummary | null>(null)
  const [companies, setCompanies] = useState<CompanySummary[]>([])

  useEffect(() => {
    if (!user) {
      setCompany(null)
      setCompanies([])
      globalData.setCompanies([])
      return
    }

    const fetchCompanies = async () => {
      try {
        const snapshot = await getDocs(collection(db, "companies"))
        const list: CompanySummary[] = snapshot.docs.map(docSnapshot => ({
          id: docSnapshot.id,
          name: (docSnapshot.data()?.name as string) || "Unknown Company",
        }))

        setCompanies(list)
        globalData.setCompanies(list)

        const activeCompany = list.find(c => c.id === user.companyId)
        setCompany(activeCompany ?? null)
      } catch (error) {
        console.error("Failed to load companies", error)
        setCompanies([])
        globalData.setCompanies([])
        setCompany(null)
      }
    }

    fetchCompanies()
  }, [user])

  const switchCompany = async (companyId: string) => {
    if (!user) return
    try {
      await updateDoc(doc(db, "users", user.id), { companyId, updatedAt: Date.now(), dbUpdatedAt: serverTimestamp() })
      await refreshUser()
      const selectedCompany = (companies.length ? companies : globalData.companies.value).find(c => c.id === companyId) ?? null
      setCompany(selectedCompany)
    } catch (error) {
      console.error("Failed to switch company", error)
    }
  }

  const value = useMemo(
    () => ({
      company,
      companies,
      switchCompany,
    }),
    [company, companies]
  )

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
}

export function useCompany() {
  const ctx = useContext(CompanyContext)
  if (!ctx) throw new Error("useCompany must be inside CompanyProvider")
  return ctx
}
