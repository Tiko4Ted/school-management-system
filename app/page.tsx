import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, BarChart3, Users, BookOpen } from "lucide-react"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const supabase = await createServerClient()
  const { data: users } = await supabase.from("users").select("id").limit(1)

  // If no users exist, redirect to setup page
  if (!users || users.length === 0) {
    redirect("/setup")
  }

  // Check if user is already logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            <h1 className="text-lg font-semibold">School Management System</h1>
          </div>
          <Button asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="container px-4 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Modern School Management Made Simple
            </h2>
            <p className="text-xl text-muted-foreground">
              Comprehensive exam and academic performance management system for schools
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/auth/login">Get Started</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="container px-4 py-16">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Student Management</CardTitle>
                <CardDescription>
                  Comprehensive student records, class assignments, and academic history
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BookOpen className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Exam Management</CardTitle>
                <CardDescription>Create exams, manage marks entry, and track academic performance</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Reports & Analytics</CardTitle>
                <CardDescription>Generate detailed reports and track performance trends over time</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <GraduationCap className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Offline Support</CardTitle>
                <CardDescription>Progressive web app with offline capabilities for uninterrupted work</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          School Management System - Built with Next.js
        </div>
      </footer>
    </div>
  )
}
