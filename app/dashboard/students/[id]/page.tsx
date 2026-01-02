import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StudentForm } from "@/components/students/student-form"
import { notFound } from "next/navigation"

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const supabase = await createClient()

  const [{ data: student }, { data: streams }] = await Promise.all([
    supabase.from("students").select("*").eq("id", id).single(),
    supabase
      .from("streams")
      .select(
        `
        *,
        class:classes(*)
      `,
      )
      .order("class(class_level)"),
  ])

  if (!student) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Edit Student</h2>
        <p className="text-muted-foreground">Update student information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
          <CardDescription>Modify student details below</CardDescription>
        </CardHeader>
        <CardContent>
          <StudentForm streams={streams || []} student={student} />
        </CardContent>
      </Card>
    </div>
  )
}
