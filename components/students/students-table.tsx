"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Search } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Student = {
  id: string
  admission_number: string
  full_name: string
  gender: string
  is_graduated: boolean
  current_stream?: {
    id: string
    stream_name: string
    class?: {
      class_name: string
    }
  }
}

export function StudentsTable({ students }: { students: Student[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  const filteredStudents = students.filter(
    (student) =>
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admission_number.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or admission number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Admission Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.admission_number}</TableCell>
                  <TableCell>{student.full_name}</TableCell>
                  <TableCell className="capitalize">{student.gender}</TableCell>
                  <TableCell>
                    {student.current_stream
                      ? `${student.current_stream.class?.class_name} ${student.current_stream.stream_name}`
                      : "Unassigned"}
                  </TableCell>
                  <TableCell>
                    {student.is_graduated ? <Badge variant="secondary">Graduated</Badge> : <Badge>Active</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/dashboard/students/${student.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
