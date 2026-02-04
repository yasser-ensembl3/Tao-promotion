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

interface RecurringTask {
  id: string
  title: string
  description: string | null
  assignee: string | null
  status: string
  dueDate: string | null
  frequency: string | null
  lastCompleted: string | null
  url: string
}

export function RecurringTasksSection() {
  const config = useProjectConfig()
  const [open, setOpen] = useState(false)
  const [selectedFrequency, setSelectedFrequency] = useState<string>("all")
  const [expanded, setExpanded] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignee: "",
    dueDate: "",
    status: "",
    frequency: ""
  })

  // Frequency options
  const frequencyOptions = [
    { value: "Daily", label: "Daily", color: "gray", emoji: "" },
    { value: "Weekly", label: "Weekly", color: "gray", emoji: "" },
    { value: "Monthly", label: "Monthly", color: "gray", emoji: "" },
    { value: "Quarterly", label: "Quarterly", color: "gray", emoji: "" },
    { value: "Custom", label: "Custom", color: "gray", emoji: "" },
  ]

  // Fetch tasks with 60s cache
  const apiUrl = config?.notionDatabases?.recurringTasks
    ? `/api/notion/recurring-tasks?databaseId=${config.notionDatabases.recurringTasks}`
    : null
  const { data: tasksData, isLoading: loading, refresh: fetchTasks, error } = useCachedFetch<{ tasks: RecurringTask[] }>(apiUrl)
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

  // Handle card click: toggle if same frequency, otherwise open with new frequency
  const handleFrequencyClick = (frequency: string) => {
    if (selectedFrequency === frequency) {
      setExpanded(!expanded)
    } else {
      setSelectedFrequency(frequency)
      setExpanded(true)
    }
  }

  // Group tasks by frequency
  const tasksByFrequency = frequencyOptions.reduce((acc, option) => {
    acc[option.value] = sortedTasks.filter(task => task.frequency === option.value)
    return acc
  }, {} as Record<string, RecurringTask[]>)

  // Get filtered tasks based on selection
  const getFilteredTasks = () => {
    if (selectedFrequency === "all") {
      return sortedTasks
    }
    return tasksByFrequency[selectedFrequency] || []
  }

  // Get frequency badge color
  const getFrequencyBadgeColor = (frequency: string | null) => {
    return "bg-muted text-muted-foreground"
  }

  const handleCreateTask = async () => {
    if (!formData.title || !config?.notionDatabases?.recurringTasks) return

    try {
      const response = await fetch("/api/notion/recurring-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          databaseId: config?.notionDatabases.recurringTasks,
          title: formData.title,
          description: formData.description || undefined,
          assignee: formData.assignee || undefined,
          status: formData.status || undefined,
          dueDate: formData.dueDate || undefined,
          frequency: formData.frequency || undefined,
        }),
      })

      if (response.ok) {
        setOpen(false)
        setFormData({
          title: "",
          description: "",
          assignee: "",
          dueDate: "",
          status: "",
          frequency: ""
        })
        await fetchTasks()
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to create recurring task")
      }
    } catch (err: any) {
      alert(err.message || "Failed to create recurring task")
    }
  }

  const selectedFrequencyInfo = frequencyOptions.find(f => f.value === selectedFrequency)
  const filteredTasks = getFilteredTasks()

  const keyMetrics = tasks.length > 0 ? (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
      {frequencyOptions.map((option) => {
        const count = tasksByFrequency[option.value]?.length || 0
        const isSelected = selectedFrequency === option.value

        return (
          <button
            key={option.value}
            onClick={() => handleFrequencyClick(option.value)}
            className={`p-2 rounded-lg border text-center transition-all cursor-pointer hover:shadow-md ${
              isSelected
                ? 'bg-foreground text-background ring-1 ring-foreground'
                : 'bg-muted/50 border-border hover:bg-muted'
            }`}
          >
            <div className={`text-sm font-bold ${
              isSelected ? 'text-background' : count > 0 ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {count}
            </div>
            <div className={`text-[10px] truncate ${isSelected ? 'text-background/70' : 'text-muted-foreground'}`}>
              {option.label}
            </div>
          </button>
        )
      })}
    </div>
  ) : (
    <div className="text-center p-2 rounded-lg bg-muted/50 border border-dashed">
      <p className="text-sm text-muted-foreground">No recurring tasks yet</p>
    </div>
  )

  const detailedContent = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">
          {selectedFrequencyInfo?.label || "All Recurring Tasks"} ({filteredTasks.length})
        </h4>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={fetchTasks} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={!config?.notionDatabases?.recurringTasks}>
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Create Recurring Task</DialogTitle>
                <DialogDescription>
                  Add a new recurring task to your Notion database.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 py-4">
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
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="frequency">Frequency *</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                    >
                      <SelectTrigger id="frequency">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                        <SelectItem value="To Do">To Do</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dueDate">Next Date</Label>
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
        <div className="p-2 border border-border rounded-lg bg-muted/30">
          <p className="text-sm text-muted-foreground">{error.message || String(error)}</p>
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <div className="p-3 border rounded-lg text-center border-dashed">
          <p className="text-sm text-muted-foreground">
            {!config?.notionDatabases?.recurringTasks
              ? "Recurring tasks database not configured."
              : "No recurring tasks in this category."}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="p-3 space-y-2">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
              >
                {/* Frequency indicator */}
                <div className="w-2 h-2 rounded-full flex-shrink-0 bg-muted-foreground" />

                {/* Task info */}
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium truncate">{task.title}</h5>
                  {task.description && (
                    <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                  )}
                </div>

                {/* Next date */}
                {task.dueDate && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 hidden sm:flex">
                    <CalendarIcon className="h-3 w-3" />
                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                )}

                {/* Last completed */}
                {task.lastCompleted && (
                  <div className="text-xs text-muted-foreground flex-shrink-0 hidden md:block">
                    ✓ {new Date(task.lastCompleted).toLocaleDateString()}
                  </div>
                )}

                {/* Frequency badge */}
                <Badge variant="outline" className={`text-xs flex-shrink-0 ${getFrequencyBadgeColor(task.frequency)}`}>
                  {task.frequency || "Custom"}
                </Badge>

                {/* Status badge */}
                {task.status && (
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {task.status}
                  </Badge>
                )}

                {/* Actions */}
                <a
                  href={task.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded hover:bg-muted flex-shrink-0"
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
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
      title="Recurring Tasks"
      description="Track recurring tasks from Notion"
      icon=""
      keyMetrics={keyMetrics}
      detailedContent={detailedContent}
      expanded={expanded}
      onExpandedChange={setExpanded}
    />
  )
}
