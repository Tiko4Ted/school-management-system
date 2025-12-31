import type React from "react"
import { requireAuth } from "@/lib/auth"
import { DashboardNav } from "@/components/dashboard-nav"
import { LogoutButton } from "@/components/logout-button"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold">School Management System</h1>
            <DashboardNav userRole={user.role} />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {user.full_name} ({user.role})
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6">{children}</main>
    </div>
  )
}
