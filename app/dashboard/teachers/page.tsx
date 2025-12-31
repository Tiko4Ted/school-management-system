import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { TeachersTable } from "@/components/teachers/teachers-table"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function TeachersPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: teachers } = await supabase.from("users").select("*").neq("role", "administrator").order("full_name")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Teachers</h2>
          <p className="text-muted-foreground">Manage teacher accounts and assignments</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/teachers/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Teacher
          </Link>
        </Button>
      </div>

      <TeachersTable teachers={teachers || []} />
    </div>
  )
}
