import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TeacherForm } from "@/components/teachers/teacher-form"
import { notFound } from "next/navigation"

export default async function EditTeacherPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const supabase = await createClient()

  const { data: teacher } = await supabase.from("users").select("*").eq("id", id).single()

  if (!teacher) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Edit Teacher</h2>
        <p className="text-muted-foreground">Update teacher information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teacher Information</CardTitle>
          <CardDescription>Modify teacher details below</CardDescription>
        </CardHeader>
        <CardContent>
          <TeacherForm teacher={teacher} />
        </CardContent>
      </Card>
    </div>
  )
}
