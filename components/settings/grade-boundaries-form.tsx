"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type GradeBoundary = {
  id: string
  grade: string
  min_score: number
  max_score: number
}

export function GradeBoundariesForm({ boundaries }: { boundaries: GradeBoundary[] }) {
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Grade</TableHead>
            <TableHead>Min Score</TableHead>
            <TableHead>Max Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {boundaries.map((boundary) => (
            <TableRow key={boundary.id}>
              <TableCell className="font-medium">{boundary.grade}</TableCell>
              <TableCell>{boundary.min_score}</TableCell>
              <TableCell>{boundary.max_score}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-sm text-muted-foreground">
        Grade boundaries are used for automatic grade calculation based on marks
      </p>
    </div>
  )
}
