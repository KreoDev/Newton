"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface CompanyContextType {
  companyDB: string | null
  switchCompany: (dbName: string) => Promise<void>
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user, refreshUser } = useAuth()
  const [companyDB, setCompanyDB] = useState<string | null>(null)

  useEffect(() => {
    if (user?.companyDB) {
      setCompanyDB(user.companyDB)
    } else {
      setCompanyDB(null)
    }
  }, [user])

  const switchCompany = async (dbName: string) => {
    if (!user) return
    try {
      await updateDoc(doc(db, "users", user.id), { companyDB: dbName })
      setCompanyDB(dbName)
      await refreshUser()
      window.location.reload()
    } catch (error) {
      console.error("Failed to switch company", error)
    }
  }

  return <CompanyContext.Provider value={{ companyDB, switchCompany }}>{children}</CompanyContext.Provider>
}

export function useCompany() {
  const ctx = useContext(CompanyContext)
  if (!ctx) throw new Error("useCompany must be inside CompanyProvider")
  return ctx
}
