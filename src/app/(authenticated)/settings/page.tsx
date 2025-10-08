"use client"

import { useState, useEffect } from "react"
import { useSignals } from "@preact/signals-react/runtime"
import { Save, User, Shield, Palette, Moon, Sun, Layout, LayoutGrid, Bell } from "lucide-react"
import { useTheme } from "next-themes"
import { useLayout } from "@/hooks/useLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"
import { userOperations } from "@/lib/firebase-utils"
import { ChangePasswordModal } from "@/components/users/ChangePasswordModal"
import { ChangeEmailModal } from "@/components/users/ChangeEmailModal"
import { AvatarUpload } from "@/components/users/AvatarUpload"
import { NotificationPreferencesTab } from "@/components/settings/NotificationPreferencesTab"
import { useAlert } from "@/hooks/useAlert"

export default function SettingsPage() {
  useSignals()
  const { user, refreshUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const { layout, setLayout } = useLayout()
  const { showSuccess, showError } = useAlert()
  const [mounted, setMounted] = useState(false)
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false)
  const [isChangeEmailModalOpen, setIsChangeEmailModalOpen] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
      })
    }
  }, [user])

  const handleSaveProfile = async () => {
    if (!user) {
      showError("Authentication Required", "You must be logged in to update your profile.")
      return
    }
    if (!profile.firstName || !profile.lastName) {
      showError("Missing Information", "First name and last name are required.")
      return
    }
    setIsSubmitting(true)
    try {
      const updatedData = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber,
      }
      await userOperations.update(user.id, updatedData)
      await refreshUser() // Refresh user data in context
      showSuccess("Profile Updated", "Your profile has been updated successfully!")
    } catch (error) {
      showError("Failed to Update Profile", error instanceof Error ? error.message : "An unexpected error occurred.")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    showSuccess("Theme Changed", `Your theme has been changed to ${newTheme} mode.`)
  }

  const handleLayoutChange = (newLayout: "sidebar" | "top") => {
    setLayout(newLayout)
    showSuccess("Layout Changed", `Your navigation layout has been changed to ${newLayout}.`)
  }

  const handleAvatarUpdated = async (avatarBase64: string) => {
    // Refresh user data in context to update navbar avatar
    await refreshUser()
  }

  const getThemeIcon = (themeOption: string) => {
    switch (themeOption) {
      case "light":
        return <Sun className="h-4 w-4" />
      case "dark":
        return <Moon className="h-4 w-4" />
      default:
        return <Sun className="h-4 w-4" />
    }
  }

  const getThemeLabel = (themeOption: string) => {
    switch (themeOption) {
      case "light":
        return "Light"
      case "dark":
        return "Dark"
      default:
        return "Light"
    }
  }

  const getLayoutIcon = (layoutOption: string) => {
    switch (layoutOption) {
      case "sidebar":
        return <Layout className="h-4 w-4" />
      case "top":
        return <LayoutGrid className="h-4 w-4" />
      default:
        return <Layout className="h-4 w-4" />
    }
  }

  const getLayoutLabel = (layoutOption: string) => {
    switch (layoutOption) {
      case "sidebar":
        return "Sidebar"
      case "top":
        return "Top"
      default:
        return "Sidebar"
    }
  }

  // Don't render theme-dependent content until mounted
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Profile Picture Section */}
              {user && (
                <AvatarUpload
                  userId={user.id}
                  currentAvatar={user.profilePicture}
                  userName={`${user.firstName} ${user.lastName}`}
                  onAvatarUpdated={handleAvatarUpdated}
                />
              )}

              <div className="border-t pt-8">
                <h4 className="font-medium mb-6">Personal Details</h4>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" value={profile.firstName} onChange={e => setProfile({ ...profile, firstName: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" value={profile.lastName} onChange={e => setProfile({ ...profile, lastName: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={profile.email} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input id="phoneNumber" type="tel" value={profile.phoneNumber} onChange={e => setProfile({ ...profile, phoneNumber: e.target.value })} placeholder="Enter phone number (optional)" />
                  </div>
                  <Button onClick={handleSaveProfile} disabled={isSubmitting}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of your dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">Theme</h4>
                    <p className="text-sm text-muted-foreground">Choose between light and dark mode for your dashboard.</p>
                  </div>
                  <Select value={theme} onValueChange={handleThemeChange}>
                    <SelectTrigger className="w-36">
                      <SelectValue>
                        <div className="flex items-center space-x-2">
                          {getThemeIcon(theme || "light")}
                          <span>{getThemeLabel(theme || "light")}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center space-x-2">
                          <Sun className="h-4 w-4" />
                          <span>Light</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center space-x-2">
                          <Moon className="h-4 w-4" />
                          <span>Dark</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">Navigation Layout</h4>
                      <p className="text-sm text-muted-foreground">Choose between sidebar and top navigation layout.</p>
                    </div>
                    <Select value={layout} onValueChange={handleLayoutChange}>
                      <SelectTrigger className="w-36">
                        <SelectValue>
                          <div className="flex items-center space-x-2">
                            {getLayoutIcon(layout)}
                            <span>{getLayoutLabel(layout)}</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sidebar">
                          <div className="flex items-center space-x-2">
                            <Layout className="h-4 w-4" />
                            <span>Sidebar</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="top">
                          <div className="flex items-center space-x-2">
                            <LayoutGrid className="h-4 w-4" />
                            <span>Top</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationPreferencesTab />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security and authentication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">Email Address</h4>
                    <p className="text-sm text-muted-foreground">Update your account email address</p>
                    <p className="text-sm text-muted-foreground font-mono">{user?.email}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsChangeEmailModalOpen(true)}>
                    Change Email
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">Password</h4>
                      <p className="text-sm text-muted-foreground">Update your account password</p>
                      <p className="text-sm text-muted-foreground">••••••••••••</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsChangePasswordModalOpen(true)}>
                      Change Password
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex items-start space-x-2">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Security Tips</p>
                        <ul className="mt-2 space-y-1 list-disc list-inside">
                          <li>Use a strong password with at least 8 characters</li>
                          <li>Include uppercase, lowercase, numbers, and special characters</li>
                          <li>Don&apos;t reuse passwords from other accounts</li>
                          <li>Keep your email address up to date for account recovery</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ChangePasswordModal isOpen={isChangePasswordModalOpen} onClose={() => setIsChangePasswordModalOpen(false)} />
      <ChangeEmailModal isOpen={isChangeEmailModalOpen} onClose={() => setIsChangeEmailModalOpen(false)} />
    </div>
  )
}
