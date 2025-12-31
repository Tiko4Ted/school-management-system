import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClassesManager } from "@/components/classes/classes-manager"
import { StreamsManager } from "@/components/classes/streams-manager"

export default async function ClassesPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: classes } = await supabase.from("classes").select("*").order("class_level")

  const { data: streams } = await supabase
    .from("streams")
    .select(
      `
      *,
      class:classes(*)
    `,
    )
    .order("class(class_level)")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Classes & Streams</h2>
        <p className="text-muted-foreground">Manage class levels and their streams</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Classes</CardTitle>
            <CardDescription>Grade levels in your school</CardDescription>
          </CardHeader>
          <CardContent>
            <ClassesManager classes={classes || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Streams</CardTitle>
            <CardDescription>Divisions within each class</CardDescription>
          </CardHeader>
          <CardContent>
            <StreamsManager streams={streams || []} classes={classes || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
