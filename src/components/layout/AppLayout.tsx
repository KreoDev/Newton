"use client"

import { useState, useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useLayout } from "@/hooks/useLayout"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Home, Settings, Menu, X, LogOut, ChevronDown, Building2, Users, Package, MapPin, Shield, Bell, UserCog } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useCompany } from "@/contexts/CompanyContext"
import { useSignals } from "@preact/signals-react/runtime"
import React from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { PERMISSIONS, type PermissionKey } from "@/lib/permissions"
import { data as globalData } from "@/services/data.service"
import type { Role } from "@/types"

function AppBreadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0) {
    return null
  }

  if (segments.length === 1 && baseNavigation.some(item => item.href === `/${segments[0]}`)) {
    return null
  }

  const crumbs = [] as React.ReactNode[]

  let cumulativePath = ""

  segments.forEach((segment, index) => {
    cumulativePath += `/${segment}`
    const navMatch = baseNavigation.find(item => item.href === cumulativePath)
    const label = navMatch?.name ?? segment.replace(/-/g, " ").replace(/\b\w/g, char => char.toUpperCase())
    const isLast = index === segments.length - 1

    crumbs.push(
      <React.Fragment key={cumulativePath}>
        {index > 0 && <span className="text-muted-foreground/60">/</span>}
        {isLast ? (
          <span className="text-primary">{label}</span>
        ) : (
          <Link href={cumulativePath} className="text-muted-foreground hover:text-primary transition-colors">
            {label}
          </Link>
        )}
      </React.Fragment>
    )
  })

  if (crumbs.length === 0) {
    return null
  }

  return <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{crumbs}</div>
}

interface AppLayoutProps {
  children: React.ReactNode
}

// Base navigation items with permission requirements
const baseNavigation = [
  { name: "Dashboard", href: "/", icon: Home },
  {
    name: "Companies",
    href: "/admin/companies",
    icon: Building2,
    requiredPermissions: [PERMISSIONS.ADMIN_COMPANIES_VIEW, PERMISSIONS.ADMIN_COMPANIES]
  },
  {
    name: "Products",
    href: "/admin/products",
    icon: Package,
    requiresMine: true,
    requiredPermissions: [PERMISSIONS.ADMIN_PRODUCTS_VIEW, PERMISSIONS.ADMIN_PRODUCTS]
  },
  {
    name: "Clients",
    href: "/admin/clients",
    icon: UserCog,
    requiresMine: true,
    requiredPermissions: [PERMISSIONS.ADMIN_CLIENTS_VIEW, PERMISSIONS.ADMIN_CLIENTS]
  },
  {
    name: "Sites",
    href: "/admin/sites",
    icon: MapPin,
    requiresMine: true,
    requiredPermissions: [PERMISSIONS.ADMIN_SITES_VIEW, PERMISSIONS.ADMIN_SITES]
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
    requiredPermissions: [PERMISSIONS.ADMIN_USERS_VIEW, PERMISSIONS.ADMIN_USERS]
  },
  {
    name: "Roles",
    href: "/admin/roles",
    icon: Shield,
    requiredPermissions: [PERMISSIONS.ADMIN_ROLES_VIEW, PERMISSIONS.ADMIN_ROLES]
  },
  {
    name: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
    requiredPermissions: [PERMISSIONS.ADMIN_NOTIFICATIONS_VIEW, PERMISSIONS.ADMIN_NOTIFICATIONS]
  },
  { name: "Settings", href: "/settings", icon: Settings },
]

interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
  requiresMine?: boolean
  requiredPermissions?: PermissionKey[]
}

function NavLink({ item, className, onClick }: { item: NavigationItem; className?: string; onClick?: () => void }) {
  const pathname = usePathname()
  const isDashboard = item.href === "/"
  const isActive = isDashboard ? pathname === item.href : pathname.startsWith(item.href)

  return (
    <Link
      key={item.name}
      href={item.href}
      className={cn(
        "relative flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border",
        isActive
          ? "glass-surface-strong glass-layer-gradient text-primary dark:text-white shadow-[var(--glass-shadow-lg)] border-[var(--glass-border-floating)] ring-2 ring-[color:var(--glass-border-floating)]/75 ring-offset-2 ring-offset-background after:absolute after:inset-0 after:-z-10 after:rounded-[inherit] after:bg-white/25 after:opacity-40 after:blur-xl dark:after:bg-white/10"
          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-[oklch(1_0_0_/_0.18)] hover:border-[var(--glass-border-soft)] hover:shadow-[var(--glass-shadow-sm)]",
        className
      )}
      onClick={onClick}>
      <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-primary dark:text-white" : "text-muted-foreground")} />
      <span>{item.name}</span>
    </Link>
  )
}

export default function AppLayout({ children }: AppLayoutProps) {
  useSignals()
  const { layout } = useLayout()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout, loading } = useAuth()
  const { company, companies, switchCompany } = useCompany()
  const activeCompanyName = company?.name || user?.companyId || "Select company"
  const canSwitchCompanies = Boolean(user?.isGlobal && companies.length > 0)

  const switchableCompanies = useMemo(
    () => companies.filter(c => c.id !== user?.companyId),
    [companies, user?.companyId]
  )

  // Helper function to check if user has at least one of the required permissions
  const hasAnyPermission = (permissions?: PermissionKey[]): boolean => {
    if (!permissions || permissions.length === 0) return true
    if (!user) return false

    // Get user's role from global data
    const userRole = globalData.roles.value.find((r: Role) => r.id === user.roleId)

    // Check if user has any of the required permissions
    // Evaluation order: permissionOverrides → isGlobal → role.permissionKeys
    return permissions.some(permission => {
      // 1. Check permission overrides FIRST (allows revoking permissions from global users)
      if (user.permissionOverrides && permission in user.permissionOverrides) {
        return user.permissionOverrides[permission]
      }

      // 2. Global users have all permissions (unless overridden above)
      if (user.isGlobal) return true

      // 3. Check role permissions
      if (userRole) {
        // Check for wildcard permission
        if (userRole.permissionKeys.includes("*")) return true
        // Check for specific permission
        if (userRole.permissionKeys.includes(permission)) return true
      }

      return false
    })
  }

  // Filter navigation based on company type AND user permissions
  const navigation = useMemo(() => {
    if (!company || !user) return []

    return baseNavigation.filter(item => {
      // Filter out mine-only items for non-mine companies
      if (item.requiresMine && company.companyType !== "mine") {
        return false
      }

      // Filter based on permissions
      if (!hasAnyPermission(item.requiredPermissions)) {
        return false
      }

      return true
    })
  }, [company, user])

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading..." />
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (layout === "sidebar") {
    return (
      <div className="flex h-screen bg-transparent">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[var(--glass-blur-md)] lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Sidebar */}
        <div className={cn("fixed inset-y-0 left-0 z-50 w-64 glass-surface-floating glass-layer-gradient border border-[var(--glass-border-soft)] shadow-[var(--glass-shadow-xl)] transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
          <div className="flex items-center justify-between h-16 px-4 bg-slate-900/90 dark:bg-transparent border-b border-[var(--glass-border-soft)] glass-inner-soft backdrop-blur-[var(--glass-blur-sm)]">
            <div className="flex items-center space-x-2">
              <Link href="/" className="w-fit h-auto flex items-center justify-center px-3 py-1">
                <Image src="/newton.png" alt="Newton" width={250} height={57} className="w-full h-full object-contain" priority />
              </Link>
            </div>
            <Button variant="ghost" size="sm" className="lg:hidden text-primary-foreground hover:text-primary" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {navigation.map(item => (
              <NavLink key={item.name} item={item} className="space-x-3" onClick={() => setSidebarOpen(false)} />
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-16 glass-surface glass-layer-gradient border border-[var(--glass-border-soft)] shadow-[var(--glass-shadow-sm)] flex items-center justify-between px-4">
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>

            {/* Company switcher or company name */}
            {canSwitchCompanies ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="mr-4 ml-4">
                    {activeCompanyName}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {switchableCompanies.map(c => (
                    <DropdownMenuItem key={c.id} onClick={() => switchCompany(c.id)}>
                      {c.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="mr-4 ml-4 px-4 py-2 glass-surface glass-layer-gradient border border-[var(--glass-border-soft)] rounded-md">
                <span className="text-sm font-medium">{activeCompanyName}</span>
              </div>
            )}

            {/* User Info and Avatar - Right side */}
            <div className="flex items-center space-x-3 ml-auto">
              <div className="hidden md:flex flex-col items-end">
                <p className="text-sm font-medium leading-none">
                  {user?.firstName || "Admin"} {user?.lastName || "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email || "admin@vrcargo.com"}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-12 w-12 rounded-full p-0">
                    <Image src={user?.profilePicture || "/blank-avatar.jpg"} alt="User Avatar" width={48} height={48} className="rounded-full object-cover" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.firstName || "Admin"} {user?.lastName || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto p-6 space-y-6">
            {AppBreadcrumbs() && (
              <div className="glass-surface glass-layer-gradient border border-[var(--glass-border-soft)] shadow-[var(--glass-shadow-sm)] rounded-2xl px-4 py-3">
                <AppBreadcrumbs />
              </div>
            )}
            <div className="glass-surface-floating glass-layer-gradient border border-[var(--glass-border-floating)] shadow-[var(--glass-shadow-xl)] min-h-full rounded-3xl px-6 py-5 animate-fade-up [animation-duration:400ms]">{children}</div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-transparent">
      {/* Top Navigation Header */}
      <header className="glass-surface glass-layer-gradient border border-[var(--glass-border-soft)] shadow-[var(--glass-shadow-sm)]">
        {/* Primary Header Row */}
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <div className="flex items-center space-x-4 p-0">
            <Link href="/" className="w-fit h-auto flex items-center justify-center">
              <span className="rounded-lg bg-slate-900/90 px-3 py-1 dark:bg-transparent">
                <Image src="/newton.png" alt="Newton" width={180} height={41} className="w-full h-full object-contain" priority />
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigation.map(item => (
              <NavLink key={item.name} item={item} />
            ))}
          </nav>

          {/* Right Side: Company Switcher + User Menu */}
          <div className="flex items-center space-x-3">
            {canSwitchCompanies ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {activeCompanyName}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {switchableCompanies.map(c => (
                    <DropdownMenuItem key={c.id} onClick={() => switchCompany(c.id)}>
                      {c.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="px-3 py-1.5 glass-surface glass-layer-gradient border border-[var(--glass-border-soft)] rounded-md">
                <span className="text-xs font-medium">{activeCompanyName}</span>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="h-4 w-4" />
            </Button>

            {/* User Info and Avatar */}
            <div className="hidden md:flex flex-col items-end">
              <p className="text-sm font-medium leading-none">
                {user?.firstName || "Admin"} {user?.lastName || "User"}
              </p>
              <p className="text-xs leading-none text-muted-foreground">{user?.email || "admin@vrcargo.com"}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Image src={user?.profilePicture || "/blank-avatar.jpg"} alt="User Avatar" width={40} height={40} className="rounded-full object-cover" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.firstName || "Admin"} {user?.lastName || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t glass-surface glass-layer-gradient">
            <nav className="px-4 py-2 space-y-1">
              {navigation.map(item => (
                <NavLink key={item.name} item={item} className="space-x-3" onClick={() => setMobileMenuOpen(false)} />
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-auto p-6 space-y-6">
        {AppBreadcrumbs() && (
          <div className="glass-surface glass-layer-gradient border border-[var(--glass-border-soft)] shadow-[var(--glass-shadow-sm)] rounded-2xl px-4 py-3">
            <AppBreadcrumbs />
          </div>
        )}
        <div className="glass-surface-floating glass-layer-gradient border border-[var(--glass-border-floating)] shadow-[var(--glass-shadow-xl)] min-h-full rounded-3xl px-6 py-5 animate-fade-up [animation-duration:400ms]">{children}</div>
      </main>
    </div>
  )
}
