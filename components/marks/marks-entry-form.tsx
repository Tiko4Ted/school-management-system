"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type Subject = {
  id: string
  subject_name: string
}

type Class = {
  id: string
  class_name: string
  class_level: number
}

type Stream = {
  id: string
  stream_name: string
  class?: Class
}

type AcademicYear = {
  id: string
  year_name: string
}

type Assignment = {
  id: string
  subject_id: string
  subject: Subject
  stream: Stream
  academic_year: AcademicYear
}

type Exam = {
  id: string
  exam_name: string
  academic_year?: AcademicYear
}

type Student = {
  id: string
  admission_number: string
  full_name: string
}

type Mark = {
  id: string
  student_id: string
  exam_id: string
  subject_id: string
  score: number
  grade: string
}

export function MarksEntryForm({
  assignments,
  exams,
  students,
  existingMarks,
  teacherId,
  selectedExam,
  selectedSubject,
  selectedStream,
}: {
  assignments: Assignment[]
  exams: Exam[]
  students: Student[]
  existingMarks: Mark[]
  teacherId: string
  selectedExam?: string
  selectedSubject?: string
  selectedStream?: string
}) {
  const [exam, setExam] = useState(selectedExam || "")
  const [subject, setSubject] = useState(selectedSubject || "")
  const [stream, setStream] = useState(selectedStream || "")
  const [marks, setMarks] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  // Initialize marks from existing data
  useEffect(() => {
    const initialMarks: Record<string, string> = {}
    existingMarks.forEach((mark) => {
      initialMarks[mark.student_id] = mark.score.toString()
    })
    setMarks(initialMarks)
  }, [existingMarks])

  const handleFilterChange = () => {
    if (exam && subject && stream) {
      router.push(`/dashboard/marks?exam=${exam}&subject=${subject}&stream=${stream}`)
    }
  }

  const calculateGrade = (score: number): string => {
    if (score >= 80) return "A"
    if (score >= 70) return "B"
    if (score >= 60) return "C"
    if (score >= 50) return "D"
    if (score >= 40) return "E"
    return "F"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    const supabase = createClient()

    try {
      const marksData = students
        .filter((student) => marks[student.id] && marks[student.id].trim() !== "")
        .map((student) => {
          const score = Number.parseFloat(marks[student.id])
          return {
            student_id: student.id,
            exam_id: exam,
            subject_id: subject,
            score,
            grade: calculateGrade(score),
            entered_by: teacherId,
          }
        })

      if (marksData.length === 0) {
        setMessage("Please enter at least one mark")
        setIsLoading(false)
        return
      }

      // Upsert marks (insert or update)
      const { error } = await supabase.from("marks").upsert(marksData, {
        onConflict: "student_id,exam_id,subject_id",
      })

      if (error) throw error

      setMessage(`Successfully saved marks for ${marksData.length} students`)
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save marks")
    } finally {
      setIsLoading(false)
    }
  }

  // Get available streams based on selected subject
  const availableStreams = assignments
    .filter((a) => !subject || a.subject_id === subject)
    .map((a) => a.stream)
    .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i)

  // Get available subjects based on assignments
  const availableSubjects = assignments
    .map((a) => a.subject)
    .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="exam">Exam</Label>
          <Select value={exam} onValueChange={setExam}>
            <SelectTrigger>
              <SelectValue placeholder="Select exam" />
            </SelectTrigger>
            <SelectContent>
              {exams.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.exam_name} - {e.academic_year?.year_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="subject">Subject</Label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger>
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {availableSubjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.subject_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="stream">Class & Stream</Label>
          <Select value={stream} onValueChange={setStream}>
            <SelectTrigger>
              <SelectValue placeholder="Select stream" />
            </SelectTrigger>
            <SelectContent>
              {availableStreams.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.class?.class_name} {s.stream_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={handleFilterChange} disabled={!exam || !subject || !stream}>
        Load Students
      </Button>

      {students.length > 0 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admission Number</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const score = marks[student.id] ? Number.parseFloat(marks[student.id]) : 0
                  const grade = score > 0 ? calculateGrade(score) : ""

                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.admission_number}</TableCell>
                      <TableCell>{student.full_name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={marks[student.id] || ""}
                          onChange={(e) =>
                            setMarks({
                              ...marks,
                              [student.id]: e.target.value,
                            })
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell className="font-semibold">{grade}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {message && <div className={message.includes("success") ? "text-green-600" : "text-red-600"}>{message}</div>}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Marks"}
          </Button>
        </form>
      )}
    </div>
  )
}
