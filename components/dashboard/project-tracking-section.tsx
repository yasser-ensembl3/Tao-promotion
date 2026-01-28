"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { PageSection } from "./page-section"
import { useProjectConfig } from "@/lib/project-config"
import { useCachedFetch } from "@/lib/use-cached-fetch"

interface Task {
  id: string
  title: string
  description: string | null
  assignee: string | null
  status: string
  dueDate: string | null
  priority: string | null
  tags: string[]
  url: string
}

export function OneTimeTasksSection() {
  const config = useProjectConfig()
  const [open, setOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [expanded, setExpanded] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignee: "",
    dueDate: "",
    priority: "",
    status: "",
    tags: ""
  })

  // Status options with colors
  const statusOptions = [
    { value: "To Do", label: "To Do", color: "slate", emoji: "📋" },
    { value: "In Progress", label: "In Progress", color: "blue", emoji: "🔄" },
    { value: "Review", label: "Review", color: "purple", emoji: "👀" },
    { value: "Done", label: "Done", color: "green", emoji: "✅" },
  ]

  // Fetch tasks with 60s cache
  const apiUrl = config?.notionDatabases?.tasks
    ? `/api/notion/tasks?databaseId=${config.notionDatabases.tasks}`
    : null
  const { data: tasksData, isLoading: loading, refresh: fetchTasks, error } = useCachedFetch<{ tasks: Task[] }>(apiUrl)
  const tasks = tasksData?.tasks || []

  // Sort tasks: To Do and In Progress first, then by due date
  const sortedTasks = [...tasks].sort((a, b) => {
    // Priority statuses first
    const priorityStatuses = ["In Progress", "To Do"]
    const aIsPriority = priorityStatuses.includes(a.status)
    const bIsPriority = priorityStatuses.includes(b.status)

    if (aIsPriority && !bIsPriority) return -1
    if (!aIsPriority && bIsPriority) return 1

    // Within priority, In Progress before To Do
    if (aIsPriority && bIsPriority) {
      if (a.status === "In Progress" && b.status !== "In Progress") return -1
      if (a.status !== "In Progress" && b.status === "In Progress") return 1
    }

    // Then sort by due date
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    }
    if (a.dueDate) return -1
    if (b.dueDate) return 1
    return 0
  })

  // Handle card click: toggle if same status, otherwise open with new status
  const handleStatusClick = (status: string) => {
    if (selectedStatus === status) {
      setExpanded(!expanded)
    } else {
      setSelectedStatus(status)
      setExpanded(true)
    }
  }

  // Group tasks by status
  const tasksByStatus = statusOptions.reduce((acc, option) => {
    acc[option.value] = sortedTasks.filter(task => task.status === option.value)
    return acc
  }, {} as Record<string, Task[]>)

  // Get filtered tasks based on selection
  const getFilteredTasks = () => {
    if (selectedStatus === "all") {
      return sortedTasks
    }
    return tasksByStatus[selectedStatus] || []
  }

  // Priority colors
  const getPriorityColor = (priority: string | null) => {
    if (!priority) return "bg-gray-100 text-gray-600"
    switch (priority.toLowerCase()) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-300"
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-300"
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "low":
        return "bg-blue-100 text-blue-600 border-blue-300"
      default:
        return "bg-gray-100 text-gray-600 border-gray-300"
    }
  }

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "To Do": return "bg-slate-100 text-slate-700"
      case "In Progress": return "bg-blue-100 text-blue-700"
      case "Review": return "bg-purple-100 text-purple-700"
      case "Done": return "bg-green-100 text-green-700"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  const handleCreateTask = async () => {
    if (!formData.title || !config?.notionDatabases?.tasks) return

    try {
      const tagsArray = formData.tags
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const response = await fetch("/api/notion/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          databaseId: config?.notionDatabases.tasks,
          title: formData.title,
          description: formData.description || undefined,
          assignee: formData.assignee || undefined,
          status: formData.status || undefined,
          dueDate: formData.dueDate || undefined,
          priority: formData.priority || undefined,
          tags: tagsArray,
        }),
      })

      if (response.ok) {
        setOpen(false)
        setFormData({
          title: "",
          description: "",
          assignee: "",
          dueDate: "",
          priority: "",
          status: "",
          tags: ""
        })
        await fetchTasks()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to create task")
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const selectedStatusInfo = statusOptions.find(s => s.value === selectedStatus)
  const filteredTasks = getFilteredTasks()

  const keyMetrics = tasks.length > 0 ? (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {statusOptions.map((option) => {
        const count = tasksByStatus[option.value]?.length || 0
        const isSelected = selectedStatus === option.value

        return (
          <button
            key={option.value}
            onClick={() => handleStatusClick(option.value)}
            className={`p-2 rounded-lg border text-center transition-all cursor-pointer hover:shadow-md ${
              isSelected
                ? option.color === 'slate' ? 'ring-2 ring-slate-400 bg-slate-100 border-slate-400 dark:bg-slate-800' :
                  option.color === 'blue' ? 'ring-2 ring-blue-400 bg-blue-100 border-blue-400 dark:bg-blue-900' :
                  option.color === 'purple' ? 'ring-2 ring-purple-400 bg-purple-100 border-purple-400 dark:bg-purple-900' :
                  'ring-2 ring-green-400 bg-green-100 border-green-400 dark:bg-green-900'
                : 'bg-muted/50 border-border hover:bg-muted'
            }`}
          >
            <div className="text-xl">{option.emoji}</div>
            <div className={`text-lg font-bold ${
              count > 0
                ? option.color === 'slate' ? 'text-slate-600 dark:text-slate-400' :
                  option.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                  option.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                  'text-green-600 dark:text-green-400'
                : 'text-gray-400'
            }`}>
              {count}
            </div>
            <div className="text-[10px] text-muted-foreground truncate">
              {option.label}
            </div>
          </button>
        )
      })}
    </div>
  ) : (
    <div className="text-center p-4 rounded-lg bg-muted/50 border border-dashed">
      <p className="text-sm text-muted-foreground">No tasks yet</p>
    </div>
  )

  const detailedContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">
          {selectedStatusInfo?.emoji} {selectedStatusInfo?.label || "All Tasks"} ({filteredTasks.length})
        </h4>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={fetchTasks} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={!config?.notionDatabases?.tasks}>
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Add a new task to your Notion database.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Name *</Label>
                  <Input
                    id="title"
                    placeholder="Task name"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Task description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.emoji} {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dueDate ? format(new Date(formData.dueDate), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.dueDate ? new Date(formData.dueDate) : undefined}
                        onSelect={(date) => {
                          if (date) setFormData({ ...formData, dueDate: format(date, "yyyy-MM-dd") })
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assignee">Assignee</Label>
                  <Input
                    id="assignee"
                    placeholder="e.g., John Doe"
                    value={formData.assignee}
                    onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    placeholder="ex: frontend, bug, urgent"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleCreateTask} disabled={!formData.title}>
                  Create Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="p-4 border border-red-500 rounded-lg bg-red-500/10">
          <p className="text-sm text-red-500">{error.message || String(error)}</p>
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <div className="p-8 border rounded-lg text-center border-dashed">
          <p className="text-sm text-muted-foreground">
            {!config?.notionDatabases?.tasks
              ? "Tasks database not configured."
              : "No tasks in this category."}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="p-3 space-y-2">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 text-sm p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
              >
                {/* Status indicator */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  task.status === "Done" ? "bg-green-500" :
                  task.status === "In Progress" ? "bg-blue-500" :
                  task.status === "Review" ? "bg-purple-500" :
                  "bg-slate-400"
                }`} />

                {/* Task info */}
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium truncate">{task.title}</h5>
                  {task.description && (
                    <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                  )}
                </div>

                {/* Due date */}
                {task.dueDate && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 hidden sm:flex">
                    <CalendarIcon className="h-3 w-3" />
                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                )}

                {/* Priority badge */}
                {task.priority && (
                  <Badge variant="outline" className={`text-xs flex-shrink-0 ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </Badge>
                )}

                {/* Status badge */}
                <Badge variant="outline" className={`text-xs flex-shrink-0 ${getStatusBadgeColor(task.status)}`}>
                  {task.status}
                </Badge>

                {/* Tags */}
                {task.tags.length > 0 && (
                  <div className="hidden md:flex gap-1 flex-shrink-0">
                    {task.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <a
                  href={task.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded hover:bg-muted flex-shrink-0"
                >
                  <ExternalLink className="h-4 w-4 text-blue-500" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <PageSection
      title="Tasks"
      description="Track tasks and projects from Notion"
      icon="✅"
      keyMetrics={keyMetrics}
      detailedContent={detailedContent}
      expanded={expanded}
      onExpandedChange={setExpanded}
    />
  )
}