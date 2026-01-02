import { requireAdmin } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TeacherForm } from "@/components/teachers/teacher-form"

export default async function NewTeacherPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Add New Teacher</h2>
        <p className="text-muted-foreground">Create a new teacher account</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teacher Information</CardTitle>
          <CardDescription>Enter teacher details and login credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <TeacherForm />
        </CardContent>
      </Card>
    </div>
  )
}
