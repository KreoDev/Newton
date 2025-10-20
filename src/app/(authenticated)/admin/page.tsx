"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Users, Package, MapPin, Shield, Bell, UserCog, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { useCompany } from "@/contexts/CompanyContext"
import { useSignals } from "@preact/signals-react/runtime"
import { data as globalData } from "@/services/data.service"
import { PERMISSIONS } from "@/lib/permissions"
import { useMemo } from "react"
import type { Role } from "@/types"

export default function AdminPage() {
  useSignals()
  const { user } = useAuth()
  const { company } = useCompany()

  const companies = globalData.companies.value
  const users = globalData.users.value
  const roles = globalData.roles.value
  const products = globalData.products.value
  const sites = globalData.sites.value
  const clients = globalData.clients.value

  // Check permissions
  const hasAnyPermission = (permissions: string[]) => {
    if (!user) return false
    if (user.isGlobal) return true

    const userRole = roles.find((r: Role) => r.id === user.roleId)
    if (!userRole) return false

    return permissions.some(permission => {
      const hasRolePermission = userRole.permissionKeys.includes(permission)
      const hasOverride = user.permissionOverrides?.[permission]
      return hasOverride !== undefined ? hasOverride : hasRolePermission
    })
  }

  // Admin sections with permission checks
  const adminSections = useMemo(() => {
    const sections = [
      {
        title: "Companies",
        description: "Manage company accounts and settings",
        icon: Building2,
        href: "/admin/companies",
        count: companies.length,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-950",
        show: hasAnyPermission([PERMISSIONS.ADMIN_COMPANIES_VIEW, PERMISSIONS.ADMIN_COMPANIES]),
      },
      {
        title: "Users",
        description: "Manage user accounts and permissions",
        icon: Users,
        href: "/admin/users",
        count: users.length,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-950",
        show: hasAnyPermission([PERMISSIONS.ADMIN_USERS_VIEW, PERMISSIONS.ADMIN_USERS]),
      },
      {
        title: "Roles",
        description: "Configure user roles and permissions",
        icon: Shield,
        href: "/admin/roles",
        count: roles.length,
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-50 dark:bg-purple-950",
        show: hasAnyPermission([PERMISSIONS.ADMIN_ROLES_VIEW, PERMISSIONS.ADMIN_ROLES]),
      },
      {
        title: "Products",
        description: "Manage product catalog",
        icon: Package,
        href: "/admin/products",
        count: products.length,
        color: "text-orange-600 dark:text-orange-400",
        bgColor: "bg-orange-50 dark:bg-orange-950",
        show: company?.companyType === "mine" && hasAnyPermission([PERMISSIONS.ADMIN_PRODUCTS_VIEW, PERMISSIONS.ADMIN_PRODUCTS]),
      },
      {
        title: "Sites",
        description: "Manage operational sites",
        icon: MapPin,
        href: "/admin/sites",
        count: sites.length,
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-50 dark:bg-red-950",
        show: company?.companyType === "mine" && hasAnyPermission([PERMISSIONS.ADMIN_SITES_VIEW, PERMISSIONS.ADMIN_SITES]),
      },
      {
        title: "Clients",
        description: "Manage client companies",
        icon: UserCog,
        href: "/admin/clients",
        count: clients.length,
        color: "text-cyan-600 dark:text-cyan-400",
        bgColor: "bg-cyan-50 dark:bg-cyan-950",
        show: company?.companyType === "mine" && hasAnyPermission([PERMISSIONS.ADMIN_CLIENTS_VIEW, PERMISSIONS.ADMIN_CLIENTS]),
      },
      {
        title: "Notifications",
        description: "Configure notification templates",
        icon: Bell,
        href: "/admin/notifications",
        count: 0,
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-50 dark:bg-yellow-950",
        show: hasAnyPermission([PERMISSIONS.ADMIN_NOTIFICATIONS_VIEW, PERMISSIONS.ADMIN_NOTIFICATIONS]),
      },
    ]

    return sections.filter(section => section.show)
  }, [companies, users, roles, products, sites, clients, company, user])

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Please log in to view admin</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
        <p className="text-muted-foreground">Manage system settings, users, and configurations</p>
      </div>

      {/* Admin Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map(section => {
          const Icon = section.icon
          return (
            <Link key={section.href} href={section.href}>
              <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${section.bgColor}`}>
                      <Icon className={`h-6 w-6 ${section.color}`} />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardTitle className="text-xl mt-4">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{section.count}</span>
                    <Button variant="ghost" size="sm" className="group-hover:bg-primary/10">
                      View All
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Overview</CardTitle>
          <CardDescription>System statistics at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Active Companies</p>
              <p className="text-2xl font-bold">{companies.filter(c => c.isActive).length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{users.filter(u => u.isActive).length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">System Roles</p>
              <p className="text-2xl font-bold">{roles.filter(r => r.isActive).length}</p>
            </div>
            {company?.companyType === "mine" && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Products</p>
                <p className="text-2xl font-bold">{products.filter(p => p.isActive).length}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Access Info */}
      {!user.isGlobal && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-yellow-700 dark:text-yellow-300">Limited Access</p>
                <p className="text-sm text-muted-foreground">
                  You are viewing admin sections based on your role permissions. Some sections may be hidden if you don&apos;t have access.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
