import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExamForm } from "@/components/exams/exam-form"
import { notFound } from "next/navigation"

export default async function EditExamPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const supabase = await createClient()

  const [{ data: exam }, { data: academicYears }, { data: subjects }, { data: examSubjects }] = await Promise.all([
    supabase.from("exams").select("*").eq("id", id).single(),
    supabase.from("academic_years").select("*").order("start_date", { ascending: false }),
    supabase.from("subjects").select("*").order("subject_name"),
    supabase.from("exam_subjects").select("subject_id").eq("exam_id", id),
  ])

  if (!exam) {
    notFound()
  }

  // Add the selected subjects to the exam object
  const examWithSubjects = {
    ...exam,
    subjects: examSubjects?.map((es) => es.subject_id) || [],
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Edit Exam</h2>
        <p className="text-muted-foreground">Update exam details and settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exam Details</CardTitle>
          <CardDescription>Modify exam configuration and subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <ExamForm academicYears={academicYears || []} subjects={subjects || []} exam={examWithSubjects} />
        </CardContent>
      </Card>
    </div>
  )
}
