"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type AcademicYear = {
  id: string
  year_name: string
}

type Subject = {
  id: string
  subject_name: string
}

type Exam = {
  id: string
  exam_name: string
  academic_year_id: string
  term: string
  status: string
  subjects?: string[]
}

export function ExamForm({
  academicYears,
  subjects,
  exam,
}: { academicYears: AcademicYear[]; subjects: Subject[]; exam?: Exam }) {
  const [formData, setFormData] = useState({
    exam_name: exam?.exam_name || "",
    academic_year_id: exam?.academic_year_id || "",
    term: exam?.term || "",
    status: exam?.status || "draft",
  })
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(exam?.subjects || [])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    if (selectedSubjects.length === 0) {
      setMessage("Please select at least one subject")
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    try {
      let examId: string

      if (exam) {
        const { error } = await supabase.from("exams").update(formData).eq("id", exam.id)
        if (error) throw error
        examId = exam.id
      } else {
        const { data, error } = await supabase.from("exams").insert(formData).select().single()
        if (error) throw error
        examId = data.id
      }

      // Delete existing exam_subjects and insert new ones
      await supabase.from("exam_subjects").delete().eq("exam_id", examId)

      const examSubjects = selectedSubjects.map((subjectId) => ({
        exam_id: examId,
        subject_id: subjectId,
      }))

      const { error: subjectsError } = await supabase.from("exam_subjects").insert(examSubjects)
      if (subjectsError) throw subjectsError

      setMessage("Exam saved successfully")
      setTimeout(() => router.push("/dashboard/exams"), 1000)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save exam")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId],
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="exam_name">Exam Name *</Label>
          <Input
            id="exam_name"
            value={formData.exam_name}
            onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
            placeholder="e.g., Mid-Term Exam"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="academic_year_id">Academic Year *</Label>
          <Select
            value={formData.academic_year_id}
            onValueChange={(value) => setFormData({ ...formData, academic_year_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select academic year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.year_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="term">Term *</Label>
          <Select value={formData.term} onValueChange={(value) => setFormData({ ...formData, term: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="term_1">Term 1</SelectItem>
              <SelectItem value="term_2">Term 2</SelectItem>
              <SelectItem value="term_3">Term 3</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="status">Status *</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="open">Open for Marks Entry</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Subjects *</Label>
        <div className="grid gap-3 md:grid-cols-2">
          {subjects.map((subject) => (
            <div key={subject.id} className="flex items-center space-x-2">
              <Checkbox
                id={subject.id}
                checked={selectedSubjects.includes(subject.id)}
                onCheckedChange={() => toggleSubject(subject.id)}
              />
              <label
                htmlFor={subject.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {subject.subject_name}
              </label>
            </div>
          ))}
        </div>
      </div>

      {message && <div className={message.includes("success") ? "text-green-600" : "text-red-600"}>{message}</div>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : exam ? "Update Exam" : "Create Exam"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
