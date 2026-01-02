"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Upload, FileText, AlertCircle, CheckCircle2, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Stream = {
  id: string
  stream_name: string
  class?: {
    id: string
    class_name: string
  }
}

type ParsedStudent = {
  admission_number: string
  assessment_number: string
  full_name: string
  gender: string
  date_of_birth: string
  parent_name: string
  parent_phone: string
  parent_email: string
  stream_name: string
  class_name: string
}

type ValidationError = {
  row: number
  field: string
  message: string
}

export function CSVUpload({ streams }: { streams: Stream[] }) {
  const [open, setOpen] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([])
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const parseCSV = (text: string): ParsedStudent[] => {
    const lines = text.trim().split("\n")
    if (lines.length < 2) return []

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"))
    const students: ParsedStudent[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.length !== headers.length) continue

      const student: Record<string, string> = {}
      headers.forEach((header, index) => {
        student[header] = values[index].trim()
      })

      students.push({
        admission_number: student.admission_number || "",
        assessment_number: student.assessment_number || "",
        full_name: student.full_name || "",
        gender: (student.gender || "").toLowerCase(),
        date_of_birth: student.date_of_birth || "",
        parent_name: student.parent_name || "",
        parent_phone: student.parent_phone || "",
        parent_email: student.parent_email || "",
        stream_name: student.stream_name || "",
        class_name: student.class_name || "",
      })
    }

    return students
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        result.push(current)
        current = ""
      } else {
        current += char
      }
    }
    result.push(current)

    return result.map((s) => s.trim().replace(/^"|"$/g, ""))
  }

  const validateData = (data: ParsedStudent[]): ValidationError[] => {
    const validationErrors: ValidationError[] = []

    data.forEach((student, index) => {
      const row = index + 2 // +2 because row 1 is header, and we're 0-indexed

      if (!student.admission_number) {
        validationErrors.push({ row, field: "admission_number", message: "Admission number is required" })
      }
      if (!student.full_name) {
        validationErrors.push({ row, field: "full_name", message: "Full name is required" })
      }
      if (!student.gender || !["male", "female"].includes(student.gender)) {
        validationErrors.push({ row, field: "gender", message: "Gender must be male or female" })
      }
      if (!student.date_of_birth) {
        validationErrors.push({ row, field: "date_of_birth", message: "Date of birth is required" })
      }
      if (!student.parent_name) {
        validationErrors.push({ row, field: "parent_name", message: "Parent name is required" })
      }
      if (!student.parent_phone) {
        validationErrors.push({ row, field: "parent_phone", message: "Parent phone is required" })
      }

      // Validate stream/class combination exists
      if (student.stream_name && student.class_name) {
        const streamExists = streams.some(
          (s) =>
            s.stream_name.toLowerCase() === student.stream_name.toLowerCase() &&
            s.class?.class_name.toLowerCase() === student.class_name.toLowerCase()
        )
        if (!streamExists) {
          validationErrors.push({
            row,
            field: "stream",
            message: `Class "${student.class_name}" with stream "${student.stream_name}" not found`,
          })
        }
      }
    })

    return validationErrors
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadResult(null)
    setErrors([])

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const data = parseCSV(text)
      setParsedData(data)
      const validationErrors = validateData(data)
      setErrors(validationErrors)
    }
    reader.readAsText(file)
  }

  const findStreamId = (className: string, streamName: string): string | null => {
    const stream = streams.find(
      (s) =>
        s.stream_name.toLowerCase() === streamName.toLowerCase() &&
        s.class?.class_name.toLowerCase() === className.toLowerCase()
    )
    return stream?.id || null
  }

  const handleUpload = async () => {
    if (errors.length > 0 || parsedData.length === 0) return

    setIsLoading(true)
    const supabase = createClient()
    let successCount = 0
    let failCount = 0

    for (const student of parsedData) {
      const streamId = findStreamId(student.class_name, student.stream_name)

      const insertData = {
        admission_number: student.admission_number,
        assessment_number: student.assessment_number || student.admission_number,
        full_name: student.full_name,
        gender: student.gender,
        date_of_birth: student.date_of_birth,
        parent_name: student.parent_name,
        parent_phone: student.parent_phone,
        parent_email: student.parent_email || null,
        current_stream_id: streamId,
      }

      const { error } = await supabase.from("students").insert(insertData)

      if (error) {
        failCount++
      } else {
        successCount++
      }
    }

    setUploadResult({ success: successCount, failed: failCount })
    setIsLoading(false)

    if (failCount === 0) {
      setTimeout(() => {
        setOpen(false)
        setParsedData([])
        setErrors([])
        setUploadResult(null)
        router.refresh()
      }, 2000)
    }
  }

  const downloadTemplate = () => {
    const headers = [
      "admission_number",
      "assessment_number",
      "full_name",
      "gender",
      "date_of_birth",
      "parent_name",
      "parent_phone",
      "parent_email",
      "class_name",
      "stream_name",
    ]
    const example = [
      "ADM001",
      "ASS001",
      "John Doe",
      "male",
      "2010-05-15",
      "Jane Doe",
      "0712345678",
      "parent@email.com",
      "Grade 1",
      "East",
    ]

    const csvContent = [headers.join(","), example.join(",")].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "students_template.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const resetDialog = () => {
    setParsedData([])
    setErrors([])
    setUploadResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) resetDialog()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Upload CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Students from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with student data. Download the template to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </div>

          {parsedData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">{parsedData.length} students found in file</span>
              </div>

              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="mt-2 space-y-1">
                      {errors.slice(0, 5).map((error, i) => (
                        <div key={i} className="text-sm">
                          Row {error.row}: {error.message}
                        </div>
                      ))}
                      {errors.length > 5 && (
                        <div className="text-sm">...and {errors.length - 5} more errors</div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {errors.length === 0 && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>All data validated successfully. Ready to upload.</AlertDescription>
                </Alert>
              )}

              {uploadResult && (
                <Alert variant={uploadResult.failed > 0 ? "destructive" : "default"}>
                  <AlertDescription>
                    Uploaded: {uploadResult.success} successful, {uploadResult.failed} failed
                  </AlertDescription>
                </Alert>
              )}

              <div className="rounded-md border max-h-64 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admission #</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>DOB</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Stream</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 10).map((student, i) => (
                      <TableRow key={i}>
                        <TableCell>{student.admission_number}</TableCell>
                        <TableCell>{student.full_name}</TableCell>
                        <TableCell className="capitalize">{student.gender}</TableCell>
                        <TableCell>{student.date_of_birth}</TableCell>
                        <TableCell>{student.class_name}</TableCell>
                        <TableCell>{student.stream_name}</TableCell>
                      </TableRow>
                    ))}
                    {parsedData.length > 10 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          ...and {parsedData.length - 10} more students
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isLoading || errors.length > 0 || parsedData.length === 0}>
            {isLoading ? "Uploading..." : "Upload Students"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
