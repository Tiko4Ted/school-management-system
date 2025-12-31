import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SubjectsManager } from "@/components/subjects/subjects-manager"

export default async function SubjectsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: subjects } = await supabase.from("subjects").select("*").order("subject_name")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Subjects</h2>
        <p className="text-muted-foreground">Manage subjects offered in your school</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Subjects</CardTitle>
          <CardDescription>View and add subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <SubjectsManager subjects={subjects || []} />
        </CardContent>
      </Card>
    </div>
  )
}
