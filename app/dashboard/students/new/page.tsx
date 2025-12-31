import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StudentForm } from "@/components/students/student-form"

export default async function NewStudentPage() {
  await requireAdmin()
  const supabase = await createClient()

  const [{ data: streams }] = await Promise.all([
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Add New Student</h2>
        <p className="text-muted-foreground">Enter student information and assign to a class</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
          <CardDescription>Fill in all required fields</CardDescription>
        </CardHeader>
        <CardContent>
          <StudentForm streams={streams || []} />
        </CardContent>
      </Card>
    </div>
  )
}
