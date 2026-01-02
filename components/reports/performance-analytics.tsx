"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

type Class = {
  id: string
  class_name: string
}

type Stream = {
  id: string
  stream_name: string
  class?: Class
}

type Student = {
  id: string
  full_name: string
}

type TermResult = {
  exam: string
  term: string
  year: string
  total: number
  average: number
}

type AnalyticsData = {
  history: unknown[]
  termResults: TermResult[]
}

export function PerformanceAnalytics({ streams }: { streams: Stream[] }) {
  const [streamId, setStreamId] = useState("")
  const [studentId, setStudentId] = useState("")
  const [students, setStudents] = useState<Student[]>([])
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  const loadStudents = async (selectedStreamId: string) => {
    setStreamId(selectedStreamId)
    const supabase = createClient()

    const { data } = await supabase
      .from("students")
      .select("*")
      .eq("current_stream_id", selectedStreamId)
      .eq("is_graduated", false)
      .order("full_name")

    setStudents(data || [])
  }

  const generateAnalytics = async () => {
    if (!studentId) {
      setMessage("Please select a student")
      return
    }

    setIsLoading(true)
    setMessage("")

    const supabase = createClient()

    try {
      // Get student history
      const { data: history } = await supabase
        .from("student_history")
        .select(
          `
          *,
          academic_year:academic_years(*),
          stream:streams(*, class:classes(*))
        `,
        )
        .eq("student_id", studentId)
        .order("academic_year(start_date)")

      // Get all exams the student participated in
      const { data: marks } = await supabase
        .from("marks")
        .select(
          `
          *,
          exam:exams(*, academic_year:academic_years(*))
        `,
        )
        .eq("student_id", studentId)

      // Group marks by exam/term
      type ExamGroup = {
        exam: { exam_name: string; term: string; academic_year?: { year_name: string } }
        marks: { score: string }[]
      }
      const termResults: TermResult[] = []
      const examGroups =
        marks?.reduce(
          (acc, mark) => {
            const examId = mark.exam_id
            if (!acc[examId]) {
              acc[examId] = {
                exam: mark.exam,
                marks: [],
              }
            }
            acc[examId].marks.push(mark)
            return acc
          },
          {} as Record<string, ExamGroup>,
        ) || {}

      Object.values(examGroups).forEach((group) => {
        const total = group.marks.reduce((sum: number, m) => sum + Number.parseFloat(m.score), 0)
        termResults.push({
          exam: group.exam.exam_name,
          term: group.exam.term,
          year: group.exam.academic_year?.year_name,
          total,
          average: total / group.marks.length,
        })
      })

      // Sort by date
      termResults.sort((a, b) => {
        if (a.year !== b.year) return a.year.localeCompare(b.year)
        return a.term.localeCompare(b.term)
      })

      setAnalyticsData({
        history,
        termResults,
      })
      setMessage("Analytics generated successfully")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to generate analytics")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>Stream</Label>
          <Select value={streamId} onValueChange={loadStudents}>
            <SelectTrigger>
              <SelectValue placeholder="Select stream" />
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
          <Label>Student</Label>
          <Select value={studentId} onValueChange={setStudentId} disabled={!streamId}>
            <SelectTrigger>
              <SelectValue placeholder="Select student" />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={generateAnalytics} disabled={isLoading}>
        {isLoading ? "Generating..." : "View Analytics"}
      </Button>

      {message && (
        <div
          className={message.includes("success") || message.includes("generated") ? "text-green-600" : "text-red-600"}
        >
          {message}
        </div>
      )}

      {analyticsData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trend</CardTitle>
              <CardDescription>Total marks across all terms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.termResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {result.exam} - {result.year}
                      </p>
                      <p className="text-sm text-muted-foreground">{result.term.replace("_", " ").toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{result.total.toFixed(0)}</p>
                      <p className="text-sm text-muted-foreground">Avg: {result.average.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
