"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type SchoolConfig = {
  id: string
  school_name: string
  graduation_level: number
}

export function SchoolConfigForm({ config }: { config: SchoolConfig | null }) {
  const [schoolName, setSchoolName] = useState(config?.school_name || "")
  const [graduationLevel, setGraduationLevel] = useState(config?.graduation_level || 9)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    const supabase = createClient()

    try {
      const { error } = config
        ? await supabase
            .from("school_config")
            .update({ school_name: schoolName, graduation_level: graduationLevel })
            .eq("id", config.id)
        : await supabase.from("school_config").insert({ school_name: schoolName, graduation_level: graduationLevel })

      if (error) throw error

      setMessage("Settings saved successfully")
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save settings")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="schoolName">School Name</Label>
        <Input
          id="schoolName"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          placeholder="Enter school name"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="graduationLevel">Graduation Level (Grade)</Label>
        <Input
          id="graduationLevel"
          type="number"
          min="1"
          max="12"
          value={graduationLevel}
          onChange={(e) => setGraduationLevel(Number.parseInt(e.target.value))}
          required
        />
        <p className="text-sm text-muted-foreground">Students at this grade level will graduate at year rollover</p>
      </div>

      {message && <div className={message.includes("success") ? "text-green-600" : "text-red-600"}>{message}</div>}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  )
}
