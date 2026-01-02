import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { StudentsTable } from "@/components/students/students-table"
import { CSVUpload } from "@/components/students/csv-upload"
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

  const [studentsResult, streamsResult] = await Promise.all([
    supabase
      .from("students")
      .select(
        `
        *,
        current_stream:streams(id, stream_name, class:classes(class_name))
      `
      )
      .order("full_name"),
    supabase
      .from("streams")
      .select(
        `
        id,
        stream_name,
        class:classes(id, class_name)
      `
      )
      .order("stream_name"),
  ])

  let students = studentsResult.data || []
  const streams = streamsResult.data || []

  if (params.search) {
    students = students.filter(
      (s) =>
        s.full_name.toLowerCase().includes(params.search!.toLowerCase()) ||
        s.admission_number.toLowerCase().includes(params.search!.toLowerCase())
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Students</h2>
          <p className="text-muted-foreground">Manage student records and assignments</p>
        </div>
        <div className="flex gap-2">
          <CSVUpload streams={streams} />
          <Button asChild>
            <Link href="/dashboard/students/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Link>
          </Button>
        </div>
      </div>

      <StudentsTable students={students} />
    </div>
  )
}
