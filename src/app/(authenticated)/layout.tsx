"use client"

import AppLayout from "@/components/layout/AppLayout"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  useSignals()

  const isLoading = globalData.loading.value

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading application data..." />
  }

  return <AppLayout>{children}</AppLayout>
}
