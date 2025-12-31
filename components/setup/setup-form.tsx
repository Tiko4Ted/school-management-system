"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createBrowserClient } from "@/lib/supabase/client"

export function SetupForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const fullName = formData.get("fullName") as string
    const schoolName = formData.get("schoolName") as string

    const supabase = createBrowserClient()

    try {
      // Sign up the admin user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Update school configuration
        const { error: configError } = await supabase
          .from("school_config")
          .update({ school_name: schoolName })
          .eq("id", 1)

        if (configError) {
          console.error("[v0] School config update error:", configError)
        }

        setSuccess(true)
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create admin account")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Alert>
        <AlertDescription>Admin account created successfully! Redirecting to dashboard...</AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="schoolName">School Name</Label>
        <Input
          id="schoolName"
          name="schoolName"
          type="text"
          placeholder="Enter your school name"
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Your Full Name</Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          placeholder="Enter your full name"
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" name="email" type="email" placeholder="admin@school.com" required disabled={loading} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Create a strong password"
          required
          minLength={8}
          disabled={loading}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating Admin Account..." : "Create Admin Account"}
      </Button>

      <p className="text-sm text-muted-foreground text-center">
        This will create your administrator account and set up your school.
      </p>
    </form>
  )
}
