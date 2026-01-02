"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import { FileDown } from "lucide-react"

type AcademicYear = {
  id: string
  year_name: string
}

type Exam = {
  id: string
  exam_name: string
  academic_year?: AcademicYear
}

type Class = {
  id: string
  class_name: string
}

type StreamType = {
  id: string
  stream_name: string
  class?: Class
}

type Student = {
  id: string
  full_name: string
}

type Subject = {
  subject_name: string
}

type Mark = {
  id: string
  score: string
  grade: string
  subject?: Subject
}

type StudentDetail = {
  id: string
  full_name: string
  admission_number: string
  current_stream_id: string
  current_stream?: {
    stream_name: string
    class?: Class
  }
}

type ReportData = {
  student: StudentDetail
  marks: Mark[]
  total: number
  average: number
  streamRank: number
  streamSize: number
}

export function StudentReportGenerator({ exams, streams }: { exams: Exam[]; streams: StreamType[] }) {
  const [examId, setExamId] = useState("")
  const [streamId, setStreamId] = useState("")
  const [studentId, setStudentId] = useState("")
  const [students, setStudents] = useState<Student[]>([])
  const [reportData, setReportData] = useState<ReportData | null>(null)
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

  const generateReport = async () => {
    if (!examId || !studentId) {
      setMessage("Please select exam and student")
      return
    }

    setIsLoading(true)
    setMessage("")

    const supabase = createClient()

    try {
      // Get student details
      const { data: student } = await supabase
        .from("students")
        .select(
          `
          *,
          current_stream:streams(*, class:classes(*))
        `,
        )
        .eq("id", studentId)
        .single()

      // Get student marks
      const { data: marks } = await supabase
        .from("marks")
        .select(
          `
          *,
          subject:subjects(*)
        `,
        )
        .eq("exam_id", examId)
        .eq("student_id", studentId)

      if (!marks || marks.length === 0) {
        setMessage("No marks found for this student in the selected exam")
        setIsLoading(false)
        return
      }

      // Calculate totals
      const total = marks.reduce((sum, m) => sum + Number.parseFloat(m.score), 0)
      const average = total / marks.length

      // Get stream ranking
      const { data: streamStudents } = await supabase
        .from("students")
        .select("id")
        .eq("current_stream_id", student.current_stream_id)
        .eq("is_graduated", false)

      const { data: streamMarks } = await supabase
        .from("marks")
        .select("student_id, score")
        .eq("exam_id", examId)
        .in("student_id", streamStudents?.map((s) => s.id) || [])

      // Calculate rankings
      const studentTotals =
        streamStudents?.map((s) => {
          const sMarks = streamMarks?.filter((m) => m.student_id === s.id) || []
          return {
            student_id: s.id,
            total: sMarks.reduce((sum, m) => sum + Number.parseFloat(m.score), 0),
          }
        }) || []

      studentTotals.sort((a, b) => b.total - a.total)
      const streamRank = studentTotals.findIndex((s) => s.student_id === studentId) + 1

      setReportData({
        student,
        marks,
        total,
        average,
        streamRank,
        streamSize: streamStudents?.length || 0,
      })
      setMessage("Report generated successfully")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to generate report")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label>Exam</Label>
          <Select value={examId} onValueChange={setExamId}>
            <SelectTrigger>
              <SelectValue placeholder="Select exam" />
            </SelectTrigger>
            <SelectContent>
              {exams.map((exam) => (
                <SelectItem key={exam.id} value={exam.id}>
                  {exam.exam_name} - {exam.academic_year?.year_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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

      <div className="flex gap-2">
        <Button onClick={generateReport} disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate Report"}
        </Button>
        {reportData && (
          <Button variant="outline">
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        )}
      </div>

      {message && (
        <div
          className={message.includes("success") || message.includes("generated") ? "text-green-600" : "text-red-600"}
        >
          {message}
        </div>
      )}

      {reportData && (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Student Name</p>
                  <p className="text-lg font-semibold">{reportData.student.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Admission Number</p>
                  <p className="text-lg font-semibold">{reportData.student.admission_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Class & Stream</p>
                  <p className="text-lg font-semibold">
                    {reportData.student.current_stream?.class?.class_name}{" "}
                    {reportData.student.current_stream?.stream_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stream Position</p>
                  <p className="text-lg font-semibold">
                    {reportData.streamRank} of {reportData.streamSize}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.marks.map((mark) => (
                  <TableRow key={mark.id}>
                    <TableCell className="font-medium">{mark.subject?.subject_name}</TableCell>
                    <TableCell>{Number.parseFloat(mark.score).toFixed(2)}</TableCell>
                    <TableCell className="font-semibold">{mark.grade}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="font-bold">{reportData.total.toFixed(2)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow className="bg-muted/50">
                  <TableCell className="font-bold">Average</TableCell>
                  <TableCell className="font-bold">{reportData.average.toFixed(2)}</TableCell>
                  <TableCell className="font-bold">
                    {reportData.average >= 80
                      ? "A"
                      : reportData.average >= 70
                        ? "B"
                        : reportData.average >= 60
                          ? "C"
                          : reportData.average >= 50
                            ? "D"
                            : reportData.average >= 40
                              ? "E"
                              : "F"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
