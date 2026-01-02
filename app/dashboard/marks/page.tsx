import { requireAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MarksEntryForm } from "@/components/marks/marks-entry-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

export default async function MarksPage({
  searchParams,
}: { searchParams: Promise<{ exam?: string; subject?: string; stream?: string }> }) {
  const user = await requireAuth()
  const params = await searchParams
  const supabase = await createClient()

  // Get teacher's assigned subjects
  const { data: assignments } = await supabase
    .from("subject_teachers")
    .select(
      `
      *,
      subject:subjects(*),
      stream:streams(*, class:classes(*)),
      academic_year:academic_years(*)
    `,
    )
    .eq("teacher_id", user.id)

  if (!assignments || assignments.length === 0) {
    return (
      <div className="space-y-6">
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>You have no subject assignments yet. Please contact an administrator.</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Get available exams for marks entry
  const { data: exams } = await supabase
    .from("exams")
    .select(
      `
      *,
      academic_year:academic_years(year_name),
      exam_subjects:exam_subjects(subject_id)
    `,
    )
    .in("status", ["open", "published"])
    .order("created_at", { ascending: false })

  const selectedExam = params.exam
  const selectedSubject = params.subject
  const selectedStream = params.stream

  // If exam, subject, and stream are selected, fetch students
  type Student = {
    id: string
    admission_number: string
    full_name: string
    current_stream_id: string
    is_graduated: boolean
  }
  type Mark = {
    id: string
    student_id: string
    exam_id: string
    subject_id: string
    score: number
    grade: string
  }
  let students: Student[] = []
  let marks: Mark[] = []

  if (selectedExam && selectedSubject && selectedStream) {
    const { data: studentsData } = await supabase
      .from("students")
      .select("*")
      .eq("current_stream_id", selectedStream)
      .eq("is_graduated", false)
      .order("full_name")

    students = studentsData || []

    const { data: marksData } = await supabase
      .from("marks")
      .select("*")
      .eq("exam_id", selectedExam)
      .eq("subject_id", selectedSubject)

    marks = marksData || []
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Marks Entry</h2>
        <p className="text-muted-foreground">Enter student marks for your assigned subjects</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enter Marks</CardTitle>
          <CardDescription>Select exam, subject, and stream to enter marks</CardDescription>
        </CardHeader>
        <CardContent>
          <MarksEntryForm
            assignments={assignments}
            exams={exams || []}
            students={students}
            existingMarks={marks}
            teacherId={user.id}
            selectedExam={selectedExam}
            selectedSubject={selectedSubject}
            selectedStream={selectedStream}
          />
        </CardContent>
      </Card>
    </div>
  )
}
