"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import { FileDown } from "lucide-react"

export function StreamReportGenerator({ exams, streams }: { exams: any[]; streams: any[] }) {
  const [examId, setExamId] = useState("")
  const [streamId, setStreamId] = useState("")
  const [reportData, setReportData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  const generateReport = async () => {
    if (!examId || !streamId) {
      setMessage("Please select both exam and stream")
      return
    }

    setIsLoading(true)
    setMessage("")

    const supabase = createClient()

    try {
      // Fetch students in the stream
      const { data: students } = await supabase
        .from("students")
        .select("*")
        .eq("current_stream_id", streamId)
        .eq("is_graduated", false)
        .order("full_name")

      if (!students || students.length === 0) {
        setMessage("No students found in this stream")
        setIsLoading(false)
        return
      }

      // Fetch marks for all students
      const { data: marks } = await supabase
        .from("marks")
        .select(
          `
          *,
          subject:subjects(subject_name, subject_code)
        `,
        )
        .eq("exam_id", examId)
        .in(
          "student_id",
          students.map((s) => s.id),
        )

      // Calculate totals and rankings
      const studentsWithMarks = students.map((student) => {
        const studentMarks = marks?.filter((m) => m.student_id === student.id) || []
        const total = studentMarks.reduce((sum, m) => sum + Number.parseFloat(m.score), 0)
        const average = studentMarks.length > 0 ? total / studentMarks.length : 0

        return {
          ...student,
          marks: studentMarks,
          total,
          average,
        }
      })

      // Sort by total for ranking
      studentsWithMarks.sort((a, b) => b.total - a.total)
      const ranked = studentsWithMarks.map((student, index) => ({
        ...student,
        rank: index + 1,
      }))

      setReportData({
        students: ranked,
        subjects:
          marks
            ?.map((m) => m.subject)
            .filter((v, i, a) => a.findIndex((t) => t.subject_code === v.subject_code) === i) || [],
      })
      setMessage(`Report generated for ${ranked.length} students`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to generate report")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
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
          <Select value={streamId} onValueChange={setStreamId}>
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Admission No.</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Average</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.students.map((student: any) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.rank}</TableCell>
                  <TableCell>{student.admission_number}</TableCell>
                  <TableCell>{student.full_name}</TableCell>
                  <TableCell>{student.total.toFixed(2)}</TableCell>
                  <TableCell>{student.average.toFixed(2)}</TableCell>
                  <TableCell className="font-semibold">
                    {student.average >= 80
                      ? "A"
                      : student.average >= 70
                        ? "B"
                        : student.average >= 60
                          ? "C"
                          : student.average >= 50
                            ? "D"
                            : student.average >= 40
                              ? "E"
                              : "F"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
