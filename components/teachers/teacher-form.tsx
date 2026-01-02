"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type Teacher = {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: string
}

export function TeacherForm({ teacher }: { teacher?: Teacher }) {
  const [formData, setFormData] = useState({
    full_name: teacher?.full_name || "",
    email: teacher?.email || "",
    phone: teacher?.phone || "",
    role: teacher?.role || "subject_teacher",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    const supabase = createClient()

    try {
      if (teacher) {
        // Update existing teacher
        const updateData: Record<string, string | null> = {
          full_name: formData.full_name,
          phone: formData.phone || null,
          role: formData.role,
        }

        const { error } = await supabase.from("users").update(updateData).eq("id", teacher.id)
        if (error) throw error

        setMessage("Teacher updated successfully")
      } else {
        // Create new teacher via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name,
              role: formData.role,
              phone: formData.phone || null,
            },
          },
        })

        if (authError) throw authError

        if (authData.user) {
          // Update the user record with additional info
          const { error: updateError } = await supabase
            .from("users")
            .update({
              full_name: formData.full_name,
              phone: formData.phone || null,
              role: formData.role,
            })
            .eq("id", authData.user.id)

          if (updateError) throw updateError
        }

        setMessage("Teacher created successfully")
      }

      setTimeout(() => router.push("/dashboard/teachers"), 1000)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save teacher")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="full_name">Full Name *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="Enter full name"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="teacher@school.com"
            required
            disabled={!!teacher}
          />
        </div>

        {!teacher && (
          <div className="grid gap-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
            />
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Phone number"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="role">Role *</Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="subject_teacher">Subject Teacher</SelectItem>
              <SelectItem value="class_teacher">Class Teacher</SelectItem>
              <SelectItem value="class_supervisor">Class Supervisor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {message && <div className={message.includes("success") ? "text-green-600" : "text-red-600"}>{message}</div>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : teacher ? "Update Teacher" : "Add Teacher"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
