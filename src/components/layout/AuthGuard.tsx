"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { usePathname, useRouter } from "next/navigation"

const PUBLIC_PATHS = ["/login"]

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return

    const pathIsPublic = PUBLIC_PATHS.includes(pathname)

    if (!user && !pathIsPublic) {
      router.push("/login")
    }

    if (user && pathIsPublic) {
      router.push("/")
    }
  }, [user, loading, pathname, router])

  if (loading || (!user && !PUBLIC_PATHS.includes(pathname))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <>{children}</>
}
