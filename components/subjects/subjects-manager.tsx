"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

type Subject = {
  id: string
  subject_name: string
  subject_code: string
  max_score: number
}

export function SubjectsManager({ subjects }: { subjects: Subject[] }) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    subject_name: "",
    subject_code: "",
    max_score: 100,
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
      const { error } = await supabase.from("subjects").insert(formData)

      if (error) throw error

      setMessage("Subject created successfully")
      setFormData({ subject_name: "", subject_code: "", max_score: 100 })
      setShowForm(false)
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create subject")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Max Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subjects.map((subject) => (
            <TableRow key={subject.id}>
              <TableCell className="font-medium">{subject.subject_name}</TableCell>
              <TableCell>{subject.subject_code}</TableCell>
              <TableCell>{subject.max_score}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {!showForm ? (
        <Button onClick={() => setShowForm(true)} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Subject
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="subject_name">Subject Name</Label>
              <Input
                id="subject_name"
                value={formData.subject_name}
                onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                placeholder="e.g., Mathematics"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject_code">Subject Code</Label>
              <Input
                id="subject_code"
                value={formData.subject_code}
                onChange={(e) => setFormData({ ...formData, subject_code: e.target.value.toUpperCase() })}
                placeholder="e.g., MATH"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="max_score">Max Score</Label>
              <Input
                id="max_score"
                type="number"
                min="1"
                max="1000"
                value={formData.max_score}
                onChange={(e) => setFormData({ ...formData, max_score: Number.parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          {message && <div className={message.includes("success") ? "text-green-600" : "text-red-600"}>{message}</div>}

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Subject"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
