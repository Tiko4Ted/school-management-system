import { requireAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Users, BookOpen, ClipboardList } from "lucide-react"

export default async function DashboardPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  // Fetch statistics
  const [studentsCount, teachersCount, examsCount, subjectsCount] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }).neq("role", "administrator"),
    supabase.from("exams").select("id", { count: "exact", head: true }),
    supabase.from("subjects").select("id", { count: "exact", head: true }),
  ])

  const stats = [
    {
      title: "Total Students",
      value: studentsCount.count || 0,
      description: "Active students enrolled",
      icon: GraduationCap,
    },
    {
      title: "Total Teachers",
      value: teachersCount.count || 0,
      description: "Teaching staff members",
      icon: Users,
    },
    {
      title: "Active Exams",
      value: examsCount.count || 0,
      description: "Exams this academic year",
      icon: ClipboardList,
    },
    {
      title: "Subjects",
      value: subjectsCount.count || 0,
      description: "Subjects offered",
      icon: BookOpen,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {user.full_name}</h2>
        <p className="text-muted-foreground">Here's an overview of your school management system</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
