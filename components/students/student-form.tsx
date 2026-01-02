"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type Stream = {
  id: string
  stream_name: string
  class?: {
    id: string
    class_name: string
    class_level: number
  }
}

type Student = {
  id: string
  admission_number: string
  assessment_number: string
  full_name: string
  gender: string
  date_of_birth: string
  parent_name: string
  parent_phone: string
  parent_email: string
  current_stream_id: string
}

export function StudentForm({ streams, student }: { streams: Stream[]; student?: Student }) {
  const [formData, setFormData] = useState({
    admission_number: student?.admission_number || "",
    assessment_number: student?.assessment_number || "",
    full_name: student?.full_name || "",
    gender: student?.gender || "",
    date_of_birth: student?.date_of_birth || "",
    parent_name: student?.parent_name || "",
    parent_phone: student?.parent_phone || "",
    parent_email: student?.parent_email || "",
    current_stream_id: student?.current_stream_id || "",
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
      if (student) {
        const { error } = await supabase.from("students").update(formData).eq("id", student.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("students").insert(formData)
        if (error) throw error
      }

      setMessage("Student saved successfully")
      setTimeout(() => router.push("/dashboard/students"), 1000)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save student")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="admission_number">Admission Number *</Label>
          <Input
            id="admission_number"
            value={formData.admission_number}
            onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="assessment_number">Assessment Number *</Label>
          <Input
            id="assessment_number"
            value={formData.assessment_number}
            onChange={(e) => setFormData({ ...formData, assessment_number: e.target.value })}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="full_name">Full Name *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="gender">Gender *</Label>
          <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="date_of_birth">Date of Birth *</Label>
          <Input
            id="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="current_stream_id">Class & Stream *</Label>
          <Select
            value={formData.current_stream_id}
            onValueChange={(value) => setFormData({ ...formData, current_stream_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select class & stream" />
            </SelectTrigger>
            <SelectContent>
              {streams.map((stream) => (
                <SelectItem key={stream.id} value={stream.id}>
                  {stream.class?.class_name} {stream.stream_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="parent_name">Parent/Guardian Name *</Label>
          <Input
            id="parent_name"
            value={formData.parent_name}
            onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="parent_phone">Parent/Guardian Phone *</Label>
          <Input
            id="parent_phone"
            type="tel"
            value={formData.parent_phone}
            onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="parent_email">Parent/Guardian Email</Label>
          <Input
            id="parent_email"
            type="email"
            value={formData.parent_email}
            onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
          />
        </div>
      </div>

      {message && <div className={message.includes("success") ? "text-green-600" : "text-red-600"}>{message}</div>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : student ? "Update Student" : "Add Student"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
