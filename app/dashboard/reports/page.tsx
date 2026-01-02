import { requireAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StreamReportGenerator } from "@/components/reports/stream-report-generator"
import { ClassReportGenerator } from "@/components/reports/class-report-generator"
import { StudentReportGenerator } from "@/components/reports/student-report-generator"
import { PerformanceAnalytics } from "@/components/reports/performance-analytics"

export default async function ReportsPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  // Fetch data needed for reports
  const [{ data: exams }, { data: streams }, { data: classes }] = await Promise.all([
    supabase
      .from("exams")
      .select(
        `
      *,
      academic_year:academic_years(*)
    `,
      )
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    supabase
      .from("streams")
      .select(
        `
      *,
      class:classes(*)
    `,
      )
      .order("class(class_level)"),
    supabase.from("classes").select("*").order("class_level"),
  ])

  const _isAdmin = user.role === "administrator"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
        <p className="text-muted-foreground">Generate reports and view performance analytics</p>
      </div>

      <Tabs defaultValue="stream" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stream">Stream Reports</TabsTrigger>
          <TabsTrigger value="class">Class Reports</TabsTrigger>
          <TabsTrigger value="student">Student Reports</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="stream" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stream-Level Reports</CardTitle>
              <CardDescription>
                Generate reports for a specific stream showing all students and their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StreamReportGenerator exams={exams || []} streams={streams || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="class" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Class-Level Reports</CardTitle>
              <CardDescription>Generate combined reports for all streams in a class with rankings</CardDescription>
            </CardHeader>
            <CardContent>
              <ClassReportGenerator exams={exams || []} classes={classes || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="student" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Individual Student Reports</CardTitle>
              <CardDescription>Generate detailed PDF reports for individual students</CardDescription>
            </CardHeader>
            <CardContent>
              <StudentReportGenerator exams={exams || []} streams={streams || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>View historical performance trends and comparisons</CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceAnalytics streams={streams || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
