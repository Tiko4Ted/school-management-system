"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { GraduationCap, Users, BookOpen, ClipboardList, BarChart3, Settings, School, UserCog } from "lucide-react"

const allNavItems = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: School,
    roles: ["administrator", "class_supervisor", "class_teacher", "subject_teacher"],
  },
  { href: "/dashboard/students", label: "Students", icon: GraduationCap, roles: ["administrator"] },
  { href: "/dashboard/teachers", label: "Teachers", icon: UserCog, roles: ["administrator"] },
  { href: "/dashboard/classes", label: "Classes & Streams", icon: Users, roles: ["administrator"] },
  { href: "/dashboard/subjects", label: "Subjects", icon: BookOpen, roles: ["administrator"] },
  { href: "/dashboard/exams", label: "Exams", icon: ClipboardList, roles: ["administrator", "subject_teacher"] },
  { href: "/dashboard/marks", label: "Marks Entry", icon: ClipboardList, roles: ["subject_teacher"] },
  {
    href: "/dashboard/reports",
    label: "Reports",
    icon: BarChart3,
    roles: ["administrator", "class_supervisor", "class_teacher", "subject_teacher"],
  },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["administrator"] },
]

export function DashboardNav({ userRole }: { userRole: string }) {
  const pathname = usePathname()

  const navItems = allNavItems.filter((item) => item.roles.includes(userRole))

  return (
    <nav className="flex items-center gap-1">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden lg:inline">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
