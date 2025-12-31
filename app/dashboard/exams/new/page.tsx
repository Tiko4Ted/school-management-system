import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExamForm } from "@/components/exams/exam-form"

export default async function NewExamPage() {
  await requireAdmin()
  const supabase = await createClient()

  const [{ data: academicYears }, { data: subjects }] = await Promise.all([
    supabase.from("academic_years").select("*").order("start_date", { ascending: false }),
    supabase.from("subjects").select("*").order("subject_name"),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create New Exam</h2>
        <p className="text-muted-foreground">Set up a new exam period</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exam Details</CardTitle>
          <CardDescription>Configure exam settings and select subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <ExamForm academicYears={academicYears || []} subjects={subjects || []} />
        </CardContent>
      </Card>
    </div>
  )
}
