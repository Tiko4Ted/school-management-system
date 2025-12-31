"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

type AcademicYear = {
  id: string
  year_name: string
  start_date: string
  end_date: string
  is_current: boolean
}

export function AcademicYearForm({ years }: { years: AcademicYear[] }) {
  const [yearName, setYearName] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("academic_years")
        .insert({ year_name: yearName, start_date: startDate, end_date: endDate, is_current: false })

      if (error) throw error

      setMessage("Academic year created successfully")
      setYearName("")
      setStartDate("")
      setEndDate("")
      setShowForm(false)
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create academic year")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Year</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {years.map((year) => (
            <TableRow key={year.id}>
              <TableCell className="font-medium">{year.year_name}</TableCell>
              <TableCell>{new Date(year.start_date).toLocaleDateString()}</TableCell>
              <TableCell>{new Date(year.end_date).toLocaleDateString()}</TableCell>
              <TableCell>{year.is_current ? <Badge>Current</Badge> : <Badge variant="outline">Past</Badge>}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {!showForm ? (
        <Button onClick={() => setShowForm(true)} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add New Academic Year
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="yearName">Year Name</Label>
              <Input
                id="yearName"
                value={yearName}
                onChange={(e) => setYearName(e.target.value)}
                placeholder="2026"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          </div>

          {message && <div className={message.includes("success") ? "text-green-600" : "text-red-600"}>{message}</div>}

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Year"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
