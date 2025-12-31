import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SchoolConfigForm } from "@/components/settings/school-config-form"
import { GradeBoundariesForm } from "@/components/settings/grade-boundaries-form"
import { AcademicYearForm } from "@/components/settings/academic-year-form"

export default async function SettingsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const [{ data: schoolConfig }, { data: gradeBoundaries }, { data: academicYears }] = await Promise.all([
    supabase.from("school_config").select("*").single(),
    supabase.from("grade_boundaries").select("*").order("min_score", { ascending: false }),
    supabase.from("academic_years").select("*").order("start_date", { ascending: false }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage school configuration and system settings</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>School Configuration</CardTitle>
            <CardDescription>Update basic school information and graduation settings</CardDescription>
          </CardHeader>
          <CardContent>
            <SchoolConfigForm config={schoolConfig} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grade Boundaries</CardTitle>
            <CardDescription>Configure grade boundaries for automatic grade calculation</CardDescription>
          </CardHeader>
          <CardContent>
            <GradeBoundariesForm boundaries={gradeBoundaries || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Academic Years</CardTitle>
            <CardDescription>Manage academic years and create new year rollover</CardDescription>
          </CardHeader>
          <CardContent>
            <AcademicYearForm years={academicYears || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
