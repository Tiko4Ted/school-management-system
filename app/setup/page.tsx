import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SetupForm } from "@/components/setup/setup-form"

export default async function SetupPage() {
  const supabase = await createServerClient()

  // Check if any users exist
  const { data: users } = await supabase.from("users").select("id").limit(1)

  // If users exist, redirect to login
  if (users && users.length > 0) {
    redirect("/auth/login")
  }

  // Check if user is already logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome to School Management System</CardTitle>
          <CardDescription className="text-center">Create your administrator account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <SetupForm />
        </CardContent>
      </Card>
    </div>
  )
}
