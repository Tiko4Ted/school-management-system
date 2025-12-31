import { requireAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ExamsTable } from "@/components/exams/exams-table"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function ExamsPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: exams } = await supabase
    .from("exams")
    .select(
      `
      *,
      academic_year:academic_years(year_name)
    `,
    )
    .order("created_at", { ascending: false })

  const isAdmin = user.role === "administrator"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Exams</h2>
          <p className="text-muted-foreground">Manage exams and assessment periods</p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/dashboard/exams/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Exam
            </Link>
          </Button>
        )}
      </div>

      <ExamsTable exams={exams || []} isAdmin={isAdmin} />
    </div>
  )
}
