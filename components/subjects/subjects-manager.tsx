"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Plus, Edit, Trash2 } from "lucide-react"

type Subject = {
  id: string
  subject_name: string
  subject_code: string
  max_score: number
}

export function SubjectsManager({ subjects }: { subjects: Subject[] }) {
  const [showForm, setShowForm] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [deleteSubject, setDeleteSubject] = useState<Subject | null>(null)
  const [formData, setFormData] = useState({
    subject_name: "",
    subject_code: "",
    max_score: 100,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const resetForm = () => {
    setFormData({ subject_name: "", subject_code: "", max_score: 100 })
    setEditingSubject(null)
    setShowForm(false)
  }

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject)
    setFormData({
      subject_name: subject.subject_name,
      subject_code: subject.subject_code,
      max_score: subject.max_score,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    const supabase = createClient()

    try {
      if (editingSubject) {
        // Update existing subject
        const { error } = await supabase.from("subjects").update(formData).eq("id", editingSubject.id)
        if (error) throw error
        setMessage("Subject updated successfully")
      } else {
        // Create new subject
        const { error } = await supabase.from("subjects").insert(formData)
        if (error) throw error
        setMessage("Subject created successfully")
      }

      resetForm()
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save subject")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteSubject) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("subjects").delete().eq("id", deleteSubject.id)
      if (error) throw error

      setMessage("Subject deleted successfully")
      setDeleteSubject(null)
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to delete subject")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Max Score</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subjects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No subjects found
              </TableCell>
            </TableRow>
          ) : (
            subjects.map((subject) => (
              <TableRow key={subject.id}>
                <TableCell className="font-medium">{subject.subject_name}</TableCell>
                <TableCell>{subject.subject_code}</TableCell>
                <TableCell>{subject.max_score}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(subject)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteSubject(subject)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {message && !showForm && (
        <div className={message.includes("success") ? "text-green-600" : "text-red-600"}>{message}</div>
      )}

      {!showForm ? (
        <Button onClick={() => setShowForm(true)} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Subject
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4">
          <h4 className="font-medium">{editingSubject ? "Edit Subject" : "Add New Subject"}</h4>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="subject_name">Subject Name</Label>
              <Input
                id="subject_name"
                value={formData.subject_name}
                onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                placeholder="e.g., Mathematics"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject_code">Subject Code</Label>
              <Input
                id="subject_code"
                value={formData.subject_code}
                onChange={(e) => setFormData({ ...formData, subject_code: e.target.value.toUpperCase() })}
                placeholder="e.g., MATH"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="max_score">Max Score</Label>
              <Input
                id="max_score"
                type="number"
                min="1"
                max="1000"
                value={formData.max_score}
                onChange={(e) => setFormData({ ...formData, max_score: Number.parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          {message && <div className={message.includes("success") ? "text-green-600" : "text-red-600"}>{message}</div>}

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : editingSubject ? "Update Subject" : "Create Subject"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <AlertDialog open={!!deleteSubject} onOpenChange={() => setDeleteSubject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subject</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteSubject?.subject_name}&quot;? This action cannot be undone
              and may affect existing marks and exam data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
