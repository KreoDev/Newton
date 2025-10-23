"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useCompany } from "@/contexts/CompanyContext"
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"
import { useEffect } from "react"
import { OrderCreationWizard } from "@/components/orders/OrderCreationWizard"

export default function NewOrderPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { company } = useCompany()
  const canCreate = usePermission(PERMISSIONS.ORDERS_CREATE)

  // Critical: Orders can ONLY be created in mine companies
  useEffect(() => {
    if (!company) return

    if (company.companyType !== "mine") {
      router.push("/orders")
      return
    }

    if (!canCreate) {
      router.push("/orders")
      return
    }
  }, [company, canCreate, router])

  if (!company || company.companyType !== "mine" || !canCreate) {
    return (
      <div className="p-6">
        <div className="glass-surface rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Create New Order</h1>
          <p className="text-muted-foreground mt-1">Follow the steps to create a new dispatch or receiving order</p>
        </div>

        <OrderCreationWizard company={company} user={user!} />
      </div>
    </div>
  )
}
