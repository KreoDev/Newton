"use client"

import { useEffect } from "react"
import { useCompany } from "@/contexts/CompanyContext"
import { data } from "@/services/data.service"

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { companyDB } = useCompany()

  useEffect(() => {
    if (companyDB) {
      data.setCompanyDB(companyDB)
    } else {
      data.setCompanyDB(null)
    }
  }, [companyDB])

  return <>{children}</>
}
