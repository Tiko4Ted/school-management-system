"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

type Stream = {
  id: string
  stream_name: string
  class?: {
    class_name: string
  }
}

type Class = {
  id: string
  class_name: string
}

export function StreamsManager({ streams, classes }: { streams: Stream[]; classes: Class[] }) {
  const [showForm, setShowForm] = useState(false)
  const [streamName, setStreamName] = useState("")
  const [classId, setClassId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    const supabase = createClient()

    try {
      const { error } = await supabase.from("streams").insert({ stream_name: streamName, class_id: classId })

      if (error) throw error

      setMessage("Stream created successfully")
      setStreamName("")
      setClassId("")
      setShowForm(false)
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create stream")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Class</TableHead>
            <TableHead>Stream Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {streams.map((stream) => (
            <TableRow key={stream.id}>
              <TableCell>{stream.class?.class_name}</TableCell>
              <TableCell className="font-medium">{stream.stream_name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {!showForm ? (
        <Button onClick={() => setShowForm(true)} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Stream
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="classId">Class</Label>
              <Select value={classId} onValueChange={setClassId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="streamName">Stream Name</Label>
              <Input
                id="streamName"
                value={streamName}
                onChange={(e) => setStreamName(e.target.value)}
                placeholder="e.g., East, West"
                required
              />
            </div>
          </div>

          {message && <div className={message.includes("success") ? "text-green-600" : "text-red-600"}>{message}</div>}

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading} size="sm">
              {isLoading ? "Creating..." : "Create Stream"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
