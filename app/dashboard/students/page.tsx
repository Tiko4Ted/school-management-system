import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { StudentsTable } from "@/components/students/students-table"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  await requireAdmin()
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("students")
    .select(
      `
      *,
      current_stream:streams(id, stream_name, class:classes(class_name))
    `,
    )
    .order("full_name")

  if (params.search) {
    query = query.or(`full_name.ilike.%${params.search}%,admission_number.ilike.%${params.search}%`)
  }

  const { data: students } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Students</h2>
          <p className="text-muted-foreground">Manage student records and assignments</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/students/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Link>
        </Button>
      </div>

      <StudentsTable students={students || []} />
    </div>
  )
}
