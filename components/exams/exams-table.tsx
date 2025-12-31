"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Eye } from "lucide-react"
import Link from "next/link"

type Exam = {
  id: string
  exam_name: string
  term: string
  status: string
  academic_year?: {
    year_name: string
  }
}

export function ExamsTable({ exams, isAdmin }: { exams: Exam[]; isAdmin: boolean }) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "draft":
        return "secondary"
      case "open":
        return "default"
      case "published":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getTermLabel = (term: string) => {
    const labels: Record<string, string> = {
      term_1: "Term 1",
      term_2: "Term 2",
      term_3: "Term 3",
    }
    return labels[term] || term
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Exam Name</TableHead>
            <TableHead>Academic Year</TableHead>
            <TableHead>Term</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exams.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No exams found
              </TableCell>
            </TableRow>
          ) : (
            exams.map((exam) => (
              <TableRow key={exam.id}>
                <TableCell className="font-medium">{exam.exam_name}</TableCell>
                <TableCell>{exam.academic_year?.year_name}</TableCell>
                <TableCell>{getTermLabel(exam.term)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(exam.status)} className="capitalize">
                    {exam.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {isAdmin ? (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/exams/${exam.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/marks?exam=${exam.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Enter Marks
                        </Link>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
