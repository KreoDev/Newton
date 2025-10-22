"use client"

import { useState } from "react"
import { useSignals } from "@preact/signals-react/runtime"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAlert } from "@/hooks/useAlert"
import { InfoDialog } from "@/components/ui/InfoDialog"
import { Card, CardContent } from "@/components/ui/card"

export default function LoginPage() {
  useSignals()

  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const { showSuccess } = useAlert()
  const [alertInfo, setAlertInfo] = useState({ isOpen: false, title: "", description: "" })

  const handleAuthError = (error: any) => {
    let title = "Authentication Error"
    let description = "An unexpected error occurred. Please try again."

    if (error.code) {
      switch (error.code) {
        case "auth/user-not-found":
          title = "User Not Found"
          description = "No user found with this email. Please check your email or sign up."
          break
        case "auth/wrong-password":
          title = "Incorrect Password"
          description = "The password you entered is incorrect. Please try again."
          break
        case "auth/email-already-in-use":
          title = "Email Already in Use"
          description = "This email address is already registered. Please sign in or use a different email."
          break
        case "auth/weak-password":
          title = "Weak Password"
          description = "The password is too weak. Please choose a stronger password (at least 6 characters)."
          break
        case "auth/account-deactivated":
          title = "Account Deactivated"
          description = "Your account is currently inactive. Please contact your system administrator to reactivate your account."
          break
      }
    }
    setAlertInfo({ isOpen: true, title, description })
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setAlertInfo({ isOpen: true, title: "Missing Fields", description: "Please enter your email and password." })
      return
    }
    setLoading(true)
    try {
      await signIn(email, password)
      showSuccess("Signed In Successfully", "Welcome back!")
      router.push("/")
    } catch (err) {
      handleAuthError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <InfoDialog isOpen={alertInfo.isOpen} onClose={() => setAlertInfo({ isOpen: false, title: "", description: "" })} title={alertInfo.title} description={alertInfo.description} />
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">
        <div className="text-center bg-primary dark:bg-primary-foreground rounded-2xl py-4">
          <Image src="/newton.png" alt="Newton" width={250} height={57} className="mx-auto" priority />
          <p className="mt-2 text-primary-foreground">Asset Management System</p>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={handleSignIn}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" placeholder="m@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
                </div>
              </div>
              <Button type="submit" className="w-full mt-6" disabled={loading}>
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
