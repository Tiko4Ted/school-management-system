"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  class_level: number
}

type StudentWithRank = {
  id: string
  full_name: string
  gender: string
  current_stream?: { stream_name: string }
  total: number
  rank: number
}

type ReportData = {
  all: StudentWithRank[]
  top10Overall: StudentWithRank[]
  top10Boys: StudentWithRank[]
  top10Girls: StudentWithRank[]
}

export function ClassReportGenerator({ exams, classes }: { exams: Exam[]; classes: Class[] }) {
  const [examId, setExamId] = useState("")
  const [classId, setClassId] = useState("")
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  const generateReport = async () => {
    if (!examId || !classId) {
      setMessage("Please select both exam and class")
      return
    }

    setIsLoading(true)
    setMessage("")

    const supabase = createClient()

    try {
      // Get all streams in the class
      const { data: streams } = await supabase.from("streams").select("*").eq("class_id", classId)

      if (!streams || streams.length === 0) {
        setMessage("No streams found in this class")
        setIsLoading(false)
        return
      }

      // Fetch all students across all streams in this class
      const { data: students } = await supabase
        .from("students")
        .select(
          `
          *,
          current_stream:streams(stream_name)
        `,
        )
        .in(
          "current_stream_id",
          streams.map((s) => s.id),
        )
        .eq("is_graduated", false)

      if (!students || students.length === 0) {
        setMessage("No students found in this class")
        setIsLoading(false)
        return
      }

      // Fetch marks for all students
      const { data: marks } = await supabase
        .from("marks")
        .select("*")
        .eq("exam_id", examId)
        .in(
          "student_id",
          students.map((s) => s.id),
        )

      // Calculate totals and rankings
      const studentsWithMarks = students.map((student) => {
        const studentMarks = marks?.filter((m) => m.student_id === student.id) || []
        const total = studentMarks.reduce((sum, m) => sum + Number.parseFloat(m.score), 0)

        return {
          ...student,
          total,
        }
      })

      // Sort by total for ranking
      studentsWithMarks.sort((a, b) => b.total - a.total)
      const ranked = studentsWithMarks.map((student, index) => ({
        ...student,
        rank: index + 1,
      }))

      // Calculate top 10 overall, boys, and girls
      const top10Overall = ranked.slice(0, 10)
      const top10Boys = ranked.filter((s) => s.gender === "male").slice(0, 10)
      const top10Girls = ranked.filter((s) => s.gender === "female").slice(0, 10)

      setReportData({
        all: ranked,
        top10Overall,
        top10Boys,
        top10Girls,
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
          <Label>Class</Label>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.class_name}
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
          <div>
            <h3 className="text-lg font-semibold mb-3">Top 10 Overall</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Stream</TableHead>
                    <TableHead>Total Marks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.top10Overall.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.rank}</TableCell>
                      <TableCell>{student.full_name}</TableCell>
                      <TableCell>{student.current_stream?.stream_name}</TableCell>
                      <TableCell>{student.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold mb-3">Top 10 Boys</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.top10Boys.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.rank}</TableCell>
                        <TableCell>{student.full_name}</TableCell>
                        <TableCell>{student.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Top 10 Girls</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.top10Girls.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.rank}</TableCell>
                        <TableCell>{student.full_name}</TableCell>
                        <TableCell>{student.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
