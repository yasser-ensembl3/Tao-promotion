"use client"

import { useState, useEffect } from "react"
import { DashboardSection } from "./dashboard-section"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { useProjectConfig } from "@/contexts/project-config-context"

interface Goal {
  id: string
  name: string
  category: string | null
  currentProgress: string | null
  deadline: string | null
  status: string
  target: string | null
  url: string
}

export function GoalsMetricsSection() {
  const { config } = useProjectConfig()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    currentProgress: "",
    deadline: "",
    status: "",
    target: ""
  })

  const fetchGoals = async () => {
    if (!config.notionDatabases?.goals) {
      setError("Goals database not configured")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/notion/goals?databaseId=${config.notionDatabases.goals}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch goals")
      }

      setGoals(data.goals)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (config.notionDatabases?.goals) {
      fetchGoals()
    }
  }, [config.notionDatabases?.goals])

  const handleOpenAdd = () => {
    setFormData({
      name: "",
      category: "",
      currentProgress: "",
      deadline: "",
      status: "",
      target: ""
    })
    setOpen(true)
  }

  const handleCreateGoal = async () => {
    if (!formData.name || !config.notionDatabases?.goals) return

    try {
      const response = await fetch("/api/notion/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          databaseId: config.notionDatabases.goals,
          name: formData.name,
          category: formData.category || undefined,
          currentProgress: formData.currentProgress || undefined,
          deadline: formData.deadline || undefined,
          status: formData.status || undefined,
          target: formData.target || undefined,
        }),
      })

      if (response.ok) {
        setOpen(false)
        setFormData({
          name: "",
          category: "",
          currentProgress: "",
          deadline: "",
          status: "",
          target: ""
        })
        await fetchGoals()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to create goal")
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes("completed") || statusLower.includes("done")) {
      return "bg-green-100 text-green-700 border-green-300"
    } else if (statusLower.includes("progress") || statusLower.includes("track")) {
      return "bg-blue-100 text-blue-700 border-blue-300"
    } else if (statusLower.includes("risk") || statusLower.includes("delayed")) {
      return "bg-red-100 text-red-700 border-red-300"
    } else if (statusLower.includes("started") || statusLower.includes("planning")) {
      return "bg-gray-100 text-gray-700 border-gray-300"
    }
    return "bg-gray-100 text-gray-600 border-gray-300"
  }

  // Filter goals
  const filteredGoals = goals
    .filter(goal => {
      if (selectedStatus && goal.status !== selectedStatus) return false
      if (selectedCategory && goal.category !== selectedCategory) return false
      return true
    })
    .sort((a, b) => {
      // Sort by status priority first (At Risk -> On Track -> In Progress -> Completed)
      const statusPriority: Record<string, number> = {
        "At Risk": 1,
        "Delayed": 1,
        "On Track": 2,
        "In Progress": 3,
        "Planning": 4,
        "Not Started": 5,
        "Completed": 6,
        "Done": 6
      }

      const aPriority = statusPriority[a.status] || 99
      const bPriority = statusPriority[b.status] || 99

      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }

      // If same status, sort by deadline (soonest first)
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      }
      if (a.deadline) return -1
      if (b.deadline) return 1

      // Finally sort by name
      return a.name.localeCompare(b.name)
    })

  // Get unique categories
  const categories = Array.from(new Set(goals.map(g => g.category).filter(Boolean))) as string[]

  // Status options
  const statusOptions = [
    "Not Started",
    "Planning",
    "In Progress",
    "On Track",
    "At Risk",
    "Delayed",
    "Completed"
  ]

  const completedCount = goals.filter(g =>
    g.status.toLowerCase().includes("completed") || g.status.toLowerCase().includes("done")
  ).length
  const onTrackCount = goals.filter(g =>
    g.status.toLowerCase().includes("progress") || g.status.toLowerCase().includes("track")
  ).length
  const atRiskCount = goals.filter(g =>
    g.status.toLowerCase().includes("risk") || g.status.toLowerCase().includes("delayed")
  ).length

  const keyMetrics = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
        <div className="text-2xl font-bold text-green-700">{completedCount}</div>
        <div className="text-sm text-green-600">Completed</div>
      </div>
      <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
        <div className="text-2xl font-bold text-blue-700">{onTrackCount}</div>
        <div className="text-sm text-blue-600">On Track</div>
      </div>
      <div className="text-center p-3 rounded-lg bg-red-50 border border-red-200">
        <div className="text-2xl font-bold text-red-700">{atRiskCount}</div>
        <div className="text-sm text-red-600">At Risk</div>
      </div>
    </div>
  )

  const detailedContent = (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Goals & KPIs</h4>
          <div className="flex gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={handleOpenAdd} disabled={!config.notionDatabases?.goals}>
                  Add Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Add New Goal</DialogTitle>
                  <DialogDescription>
                    Add a new goal to your Notion goals database.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Increase user engagement"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Revenue">Revenue</SelectItem>
                        <SelectItem value="Growth">Growth</SelectItem>
                        <SelectItem value="Product">Product</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="Customer Success">Customer Success</SelectItem>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="currentProgress">Current Progress</Label>
                    <Input
                      id="currentProgress"
                      placeholder="e.g., 7,500 users or 75%"
                      value={formData.currentProgress}
                      onChange={(e) => setFormData({ ...formData, currentProgress: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.deadline ? (
                            format(new Date(formData.deadline), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.deadline ? new Date(formData.deadline) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setFormData({
                                ...formData,
                                deadline: format(date, "yyyy-MM-dd")
                              })
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Not Started">Not Started</SelectItem>
                        <SelectItem value="Planning">Planning</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="On Track">On Track</SelectItem>
                        <SelectItem value="At Risk">At Risk</SelectItem>
                        <SelectItem value="Delayed">Delayed</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="target">Target</Label>
                    <Input
                      id="target"
                      placeholder="e.g., 10,000 users or 100%"
                      value={formData.target}
                      onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleCreateGoal} disabled={!formData.name}>
                    Add Goal
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button size="sm" onClick={fetchGoals} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 border border-red-500 rounded-lg bg-red-500/10 mb-4">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="p-8 border rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Loading goals...</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="p-8 border rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              {config.notionDatabases?.goals
                ? "No goals available. Click 'Add Goal' to create your first goal."
                : "Goals database not configured. Configure it in Project Settings."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={selectedStatus === null && selectedCategory === null ? "default" : "outline"}
                  onClick={() => {
                    setSelectedStatus(null)
                    setSelectedCategory(null)
                  }}
                >
                  All ({goals.length})
                </Button>
              </div>

              {/* Status filters */}
              <div className="flex gap-2 border-l pl-2">
                {statusOptions.map((status) => {
                  const count = goals.filter(g => g.status === status).length
                  if (count === 0) return null
                  return (
                    <Button
                      key={status}
                      size="sm"
                      variant={selectedStatus === status ? "default" : "outline"}
                      onClick={() => {
                        setSelectedStatus(selectedStatus === status ? null : status)
                        setSelectedCategory(null)
                      }}
                      className={selectedStatus === status ? getStatusColor(status) : ""}
                    >
                      {status} ({count})
                    </Button>
                  )
                })}
              </div>

              {/* Category filters */}
              {categories.length > 0 && (
                <div className="flex gap-2 border-l pl-2">
                  {categories.map((category) => {
                    const count = goals.filter(g => g.category === category).length
                    return (
                      <Button
                        key={category}
                        size="sm"
                        variant={selectedCategory === category ? "default" : "outline"}
                        onClick={() => {
                          setSelectedCategory(selectedCategory === category ? null : category)
                          setSelectedStatus(null)
                        }}
                      >
                        {category} ({count})
                      </Button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGoals.map((goal) => (
              <Card key={goal.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-semibold text-sm mb-1">{goal.name}</h5>
                      {goal.category && (
                        <Badge variant="outline" className="text-xs mb-2">
                          {goal.category}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {goal.target && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Target:</span>
                          <span className="font-medium">{goal.target}</span>
                        </div>
                      )}
                      {goal.currentProgress && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current:</span>
                          <span className="font-medium">{goal.currentProgress}</span>
                        </div>
                      )}
                      {goal.deadline && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Deadline:</span>
                          <span className="font-medium">
                            {new Date(goal.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <Badge variant="outline" className={`text-xs ${getStatusColor(goal.status)}`}>
                        {goal.status}
                      </Badge>
                      <a
                        href={goal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-500 hover:underline"
                      >
                        View in Notion →
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>

            {filteredGoals.length === 0 && goals.length > 0 && (
              <div className="p-8 border rounded-lg text-center border-dashed">
                <p className="text-sm text-muted-foreground">
                  No goals match the selected filters.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <DashboardSection
      title="Goals & Metrics"
      description="Track progress toward objectives and measure key performance indicators"
      icon="🎯"
      keyMetrics={keyMetrics}
      detailedContent={detailedContent}
    />
  )
}
