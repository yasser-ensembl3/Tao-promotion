"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardSection } from "./dashboard-section"

interface Task {
  id: string
  title: string
  status: string
  dueDate: string | null
  priority: string | null
  tags: string[]
  url: string
}

export function ProjectTrackingSection() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/notion/tasks")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tasks")
      }

      setTasks(data.tasks)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const inProgressCount = tasks.filter(t => t.status === "In Progress").length
  const reviewNeededCount = tasks.filter(t => t.status === "Review").length
  const completedCount = tasks.filter(t => t.status === "Done" || t.status === "Completed").length

  const keyMetrics = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold">{inProgressCount}</div>
        <div className="text-sm text-muted-foreground">In Progress</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{reviewNeededCount}</div>
        <div className="text-sm text-muted-foreground">Review Needed</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{completedCount}</div>
        <div className="text-sm text-muted-foreground">Completed</div>
      </div>
    </div>
  )

  const detailedContent = (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Recent Tasks from Notion</h4>
          <Button size="sm" onClick={fetchTasks} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {error && (
          <div className="p-4 border border-red-500 rounded-lg bg-red-500/10 mb-4">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="p-8 border rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-8 border rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              No tasks available. Data will be fetched from Notion API.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Configure NOTION_TOKEN and NOTION_DATABASE_ID to see real tasks.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{task.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {task.dueDate && `Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{task.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex gap-2 flex-wrap">
                    {task.priority && (
                      <Badge variant="secondary">{task.priority}</Badge>
                    )}
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                  <a
                    href={task.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline mt-2 inline-block"
                  >
                    View in Notion →
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <DashboardSection
      title="Project Tracking"
      description="Monitor tasks and sub-projects from Notion with filters and tags"
      icon="📋"
      keyMetrics={keyMetrics}
      detailedContent={detailedContent}
    />
  )
}