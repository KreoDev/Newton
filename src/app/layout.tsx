import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { LayoutProvider } from "@/contexts/LayoutContext"
import { AuthProvider } from "@/contexts/AuthContext"
import { CompanyProvider } from "@/contexts/CompanyContext"
import { AuthGuard } from "@/components/layout/AuthGuard"
import { Toaster } from "@/components/ui/sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Newton",
  description: "Newton Fleet & Weighbridge System",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <LayoutProvider>
            <AuthProvider>
              <CompanyProvider>
                <AuthGuard>{children}</AuthGuard>
                <Toaster />
              </CompanyProvider>
            </AuthProvider>
          </LayoutProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
