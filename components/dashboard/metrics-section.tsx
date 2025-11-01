"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardSection } from "./dashboard-section"
import { useProjectConfig } from "@/contexts/project-config-context"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Plus, Pencil, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Metrics {
  tasks: {
    total: number
    completed: number
    inProgress: number
    overdue: number
  }
  goals: {
    total: number
    completed: number
    onTrack: number
    atRisk: number
  }
  milestones: {
    total: number
    completed: number
  }
  documents: {
    total: number
  }
  sales: {
    total: number
    thisWeek: number
    totalRevenue: number
    avgOrderValue: number
  }
}

export function MetricsSection() {
  const { config, updateConfig } = useProjectConfig()
  const [metrics, setMetrics] = useState<Metrics>({
    tasks: { total: 0, completed: 0, inProgress: 0, overdue: 0 },
    goals: { total: 0, completed: 0, onTrack: 0, atRisk: 0 },
    milestones: { total: 0, completed: 0 },
    documents: { total: 0 },
    sales: { total: 0, thisWeek: 0, totalRevenue: 0, avgOrderValue: 0 }
  })
  const [loading, setLoading] = useState(false)
  const [projectMetricsOpen, setProjectMetricsOpen] = useState(true)
  const [customMetricsOpen, setCustomMetricsOpen] = useState(false)
  const [isAddMetricOpen, setIsAddMetricOpen] = useState(false)
  const [editingMetricId, setEditingMetricId] = useState<string | null>(null)
  const [metricForm, setMetricForm] = useState({
    name: "",
    value: "",
    description: "",
    color: "blue",
    icon: "📊"
  })

  const fetchAllMetrics = async () => {
    setLoading(true)
    try {
      const newMetrics: Metrics = {
        tasks: { total: 0, completed: 0, inProgress: 0, overdue: 0 },
        goals: { total: 0, completed: 0, onTrack: 0, atRisk: 0 },
        milestones: { total: 0, completed: 0 },
        documents: { total: 0 },
        sales: { total: 0, thisWeek: 0, totalRevenue: 0, avgOrderValue: 0 }
      }

      // Fetch tasks metrics
      if (config.notionDatabases?.tasks) {
        try {
          const tasksResponse = await fetch(`/api/notion/tasks?databaseId=${config.notionDatabases.tasks}`)
          if (tasksResponse.ok) {
            const tasksData = await tasksResponse.json()
            const tasks = tasksData.tasks || []
            newMetrics.tasks.total = tasks.length
            newMetrics.tasks.completed = tasks.filter((t: any) =>
              t.status === "Done" || t.status === "Completed"
            ).length
            newMetrics.tasks.inProgress = tasks.filter((t: any) =>
              t.status === "In Progress"
            ).length

            // Count overdue tasks
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            newMetrics.tasks.overdue = tasks.filter((t: any) => {
              if (!t.dueDate) return false
              const dueDate = new Date(t.dueDate)
              dueDate.setHours(0, 0, 0, 0)
              return dueDate < today && t.status !== "Done" && t.status !== "Completed"
            }).length
          }
        } catch (err) {
          console.error("Error fetching tasks metrics:", err)
        }
      }

      // Fetch goals metrics
      if (config.notionDatabases?.goals) {
        try {
          const goalsResponse = await fetch(`/api/notion/goals?databaseId=${config.notionDatabases.goals}`)
          if (goalsResponse.ok) {
            const goalsData = await goalsResponse.json()
            const goals = goalsData.goals || []
            newMetrics.goals.total = goals.length
            newMetrics.goals.completed = goals.filter((g: any) =>
              g.status.toLowerCase().includes("completed") || g.status.toLowerCase().includes("done")
            ).length
            newMetrics.goals.onTrack = goals.filter((g: any) =>
              g.status.toLowerCase().includes("track") || g.status.toLowerCase().includes("progress")
            ).length
            newMetrics.goals.atRisk = goals.filter((g: any) =>
              g.status.toLowerCase().includes("risk") || g.status.toLowerCase().includes("delayed")
            ).length
          }
        } catch (err) {
          console.error("Error fetching goals metrics:", err)
        }
      }

      // Fetch milestones metrics
      if (config.notionDatabases?.milestones) {
        try {
          const milestonesResponse = await fetch(`/api/notion/milestones?databaseId=${config.notionDatabases.milestones}`)
          if (milestonesResponse.ok) {
            const milestonesData = await milestonesResponse.json()
            const milestones = milestonesData.milestones || []
            newMetrics.milestones.total = milestones.length
            newMetrics.milestones.completed = milestones.filter((m: any) =>
              m.status?.toLowerCase().includes("completed") || m.status?.toLowerCase().includes("done")
            ).length
          }
        } catch (err) {
          console.error("Error fetching milestones metrics:", err)
        }
      }

      // Fetch documents metrics
      if (config.notionDatabases?.documents) {
        try {
          const docsResponse = await fetch(`/api/notion/documents?databaseId=${config.notionDatabases.documents}`)
          if (docsResponse.ok) {
            const docsData = await docsResponse.json()
            const documents = docsData.documents || []
            newMetrics.documents.total = documents.length
          }
        } catch (err) {
          console.error("Error fetching documents metrics:", err)
        }
      }

      // Fetch sales metrics
      if (config.notionDatabases?.sales) {
        try {
          const salesResponse = await fetch(`/api/notion/sales?databaseId=${config.notionDatabases.sales}`)
          if (salesResponse.ok) {
            const salesData = await salesResponse.json()
            const sales = salesData.sales || []
            newMetrics.sales.total = sales.length

            // Calculate this week's sales
            const oneWeekAgo = new Date()
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
            newMetrics.sales.thisWeek = sales.filter((s: any) => {
              if (!s.date) return false
              return new Date(s.date) >= oneWeekAgo
            }).length

            // Calculate total revenue and average order value
            const salesWithAmount = sales.filter((s: any) => s.amount !== null)
            newMetrics.sales.totalRevenue = salesWithAmount.reduce((sum: number, s: any) => sum + (s.amount || 0), 0)
            newMetrics.sales.avgOrderValue = salesWithAmount.length > 0
              ? Math.round(newMetrics.sales.totalRevenue / salesWithAmount.length)
              : 0
          }
        } catch (err) {
          console.error("Error fetching sales metrics:", err)
        }
      }

      setMetrics(newMetrics)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (config.notionDatabases) {
      fetchAllMetrics()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.notionDatabases?.tasks, config.notionDatabases?.goals, config.notionDatabases?.milestones, config.notionDatabases?.documents, config.notionDatabases?.sales])

  // Custom Metrics Management
  const resetForm = () => {
    setMetricForm({
      name: "",
      value: "",
      description: "",
      color: "blue",
      icon: "📊"
    })
    setEditingMetricId(null)
  }

  const handleAddMetric = () => {
    resetForm()
    setIsAddMetricOpen(true)
  }

  const handleEditMetric = (metricId: string) => {
    const metric = config.customMetrics?.find(m => m.id === metricId)
    if (metric) {
      setMetricForm({
        name: metric.name,
        value: metric.value.toString(),
        description: metric.description || "",
        color: metric.color || "blue",
        icon: metric.icon || "📊"
      })
      setEditingMetricId(metricId)
      setIsAddMetricOpen(true)
    }
  }

  const handleDeleteMetric = (metricId: string) => {
    const updatedMetrics = (config.customMetrics || []).filter(m => m.id !== metricId)
    updateConfig({ customMetrics: updatedMetrics })
  }

  const handleSaveMetric = () => {
    if (!metricForm.name || !metricForm.value) {
      alert("Name and value are required")
      return
    }

    const customMetrics = config.customMetrics || []
    const now = new Date().toISOString()

    if (editingMetricId) {
      // Create new entry instead of updating (to preserve history)
      const existingMetric = customMetrics.find(m => m.id === editingMetricId)
      const newMetric = {
        id: Date.now().toString(),
        name: metricForm.name,
        value: metricForm.value,
        date: now,
        description: metricForm.description,
        color: metricForm.color,
        icon: metricForm.icon
      }
      updateConfig({ customMetrics: [...customMetrics, newMetric] })
    } else {
      // Add new metric with current date
      const newMetric = {
        id: Date.now().toString(),
        name: metricForm.name,
        value: metricForm.value,
        date: now,
        description: metricForm.description,
        color: metricForm.color,
        icon: metricForm.icon
      }
      updateConfig({ customMetrics: [...customMetrics, newMetric] })
    }

    setIsAddMetricOpen(false)
    resetForm()
  }

  const getColorClasses = (color: string) => {
    switch (color) {
      case "green":
        return "border-green-200 bg-green-50/50 text-green-700"
      case "purple":
        return "border-purple-200 bg-purple-50/50 text-purple-700"
      case "orange":
        return "border-orange-200 bg-orange-50/50 text-orange-700"
      case "red":
        return "border-red-200 bg-red-50/50 text-red-700"
      case "yellow":
        return "border-yellow-200 bg-yellow-50/50 text-yellow-700"
      case "blue":
      default:
        return "border-blue-200 bg-blue-50/50 text-blue-700"
    }
  }

  // Group metrics by name and get the latest entry for each
  const getLatestMetrics = () => {
    if (!config.customMetrics || config.customMetrics.length === 0) return []

    const groupedByName = config.customMetrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = []
      }
      acc[metric.name].push(metric)
      return acc
    }, {} as Record<string, typeof config.customMetrics>)

    // Get the latest metric for each name
    return Object.values(groupedByName).map(metrics => {
      return metrics.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0]
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Calculate completion rate
  const totalItems = metrics.tasks.total + metrics.goals.total + metrics.milestones.total
  const completedItems = metrics.tasks.completed + metrics.goals.completed + metrics.milestones.completed
  const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  const keyMetrics = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
        <div className="text-2xl font-bold text-blue-700">{totalItems}</div>
        <div className="text-sm text-blue-600">Total Items</div>
      </div>
      <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
        <div className="text-2xl font-bold text-green-700">{completionRate}%</div>
        <div className="text-sm text-green-600">Completion Rate</div>
      </div>
      <div className="text-center p-3 rounded-lg bg-red-50 border border-red-200">
        <div className="text-2xl font-bold text-red-700">{metrics.tasks.overdue}</div>
        <div className="text-sm text-red-600">Overdue Tasks</div>
      </div>
    </div>
  )

  const detailedContent = (
    <div className="space-y-6">
      {/* Project Metrics Dropdown */}
      <div className="border rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setProjectMetricsOpen(!projectMetricsOpen)}
        >
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Project Metrics</h4>
            <span className="text-xs text-muted-foreground">
              ({totalItems} items total)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                fetchAllMetrics()
              }}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
            {projectMetricsOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>

        {projectMetricsOpen && (
          <div className="p-4 pt-0 space-y-6">
            {/* Tasks Metrics */}
            <div>
              <h5 className="text-sm font-medium mb-3 text-muted-foreground">📋 Tasks</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total</CardDescription>
                    <CardTitle className="text-2xl">{metrics.tasks.total}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Completed</CardDescription>
                    <CardTitle className="text-2xl text-green-600">{metrics.tasks.completed}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>In Progress</CardDescription>
                    <CardTitle className="text-2xl text-blue-600">{metrics.tasks.inProgress}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Overdue</CardDescription>
                    <CardTitle className="text-2xl text-red-600">{metrics.tasks.overdue}</CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </div>

            {/* Goals Metrics */}
            <div>
              <h5 className="text-sm font-medium mb-3 text-muted-foreground">🎯 Goals</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total</CardDescription>
                    <CardTitle className="text-2xl">{metrics.goals.total}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Completed</CardDescription>
                    <CardTitle className="text-2xl text-green-600">{metrics.goals.completed}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>On Track</CardDescription>
                    <CardTitle className="text-2xl text-blue-600">{metrics.goals.onTrack}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>At Risk</CardDescription>
                    <CardTitle className="text-2xl text-red-600">{metrics.goals.atRisk}</CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </div>

            {/* Milestones Metrics */}
            <div>
              <h5 className="text-sm font-medium mb-3 text-muted-foreground">🏁 Milestones</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total</CardDescription>
                    <CardTitle className="text-2xl">{metrics.milestones.total}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Completed</CardDescription>
                    <CardTitle className="text-2xl text-green-600">{metrics.milestones.completed}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Remaining</CardDescription>
                    <CardTitle className="text-2xl text-blue-600">
                      {metrics.milestones.total - metrics.milestones.completed}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </div>

            {/* Documents Metrics */}
            <div>
              <h5 className="text-sm font-medium mb-3 text-muted-foreground">📚 Resources</h5>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Documents & Links</CardDescription>
                    <CardTitle className="text-2xl">{metrics.documents.total}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Completion Rate</CardDescription>
                    <CardTitle className="text-2xl text-green-600">{completionRate}%</CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </div>

            {!config.notionDatabases?.tasks && !config.notionDatabases?.goals && !config.notionDatabases?.milestones && (
              <div className="p-8 border rounded-lg text-center border-dashed">
                <p className="text-sm text-muted-foreground">
                  Configure your Notion databases in Project Settings to see metrics.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom Metrics Dropdown */}
      <div className="border rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setCustomMetricsOpen(!customMetricsOpen)}
        >
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Custom Metrics</h4>
            <span className="text-xs text-muted-foreground">
              ({getLatestMetrics().length} metrics)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleAddMetric()
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Metric
            </Button>
            {customMetricsOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>

        {customMetricsOpen && (
          <div className="p-4 pt-0 space-y-4">
            {(() => {
              const latestMetrics = getLatestMetrics()
              return latestMetrics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {latestMetrics.map((metric) => {
                    const color = metric.color || "blue"
                    let cardClasses = "border-2 relative group "
                    let textClasses = "font-medium flex items-center gap-1 "
                    let titleClasses = "text-3xl "

                    if (color === "green") {
                      cardClasses += "border-green-200"
                      textClasses += "text-green-700"
                      titleClasses += "text-green-700"
                    } else if (color === "purple") {
                      cardClasses += "border-purple-200"
                      textClasses += "text-purple-700"
                      titleClasses += "text-purple-700"
                    } else if (color === "orange") {
                      cardClasses += "border-orange-200"
                      textClasses += "text-orange-700"
                      titleClasses += "text-orange-700"
                    } else if (color === "red") {
                      cardClasses += "border-red-200"
                      textClasses += "text-red-700"
                      titleClasses += "text-red-700"
                    } else if (color === "yellow") {
                      cardClasses += "border-yellow-200"
                      textClasses += "text-yellow-700"
                      titleClasses += "text-yellow-700"
                    } else {
                      cardClasses += "border-blue-200"
                      textClasses += "text-blue-700"
                      titleClasses += "text-blue-700"
                    }

                    return (
                      <Card key={metric.id} className={cardClasses}>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => handleEditMetric(metric.id)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteMetric(metric.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <CardHeader className="pb-2">
                          <CardDescription className={textClasses}>
                            {metric.icon} {metric.name}
                          </CardDescription>
                          <CardTitle className={titleClasses}>
                            {metric.value}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-muted-foreground mb-1">
                            {formatDate(metric.date)}
                          </p>
                          {metric.description && (
                            <p className="text-xs text-muted-foreground">
                              {metric.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 border rounded-lg text-center border-dashed">
                  <p className="text-sm text-muted-foreground mb-2">
                    No custom metrics yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Click &ldquo;Add Metric&rdquo; to create your first custom metric
                  </p>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      <DashboardSection
        title="Metrics Overview"
        description="Aggregate metrics from all your project databases"
        icon="📊"
        keyMetrics={keyMetrics}
        detailedContent={detailedContent}
      />

      {/* Add/Edit Custom Metric Dialog */}
      <Dialog open={isAddMetricOpen} onOpenChange={setIsAddMetricOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingMetricId ? "Update Metric Value" : "Add Custom Metric"}
            </DialogTitle>
            <DialogDescription>
              {editingMetricId
                ? "Add a new value for this metric. Previous values will be preserved in history."
                : "Create a custom metric to track any value you want"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="metric-name">Name *</Label>
              <Input
                id="metric-name"
                placeholder="e.g., Subscribers Substack"
                value={metricForm.name}
                onChange={(e) => setMetricForm({ ...metricForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metric-value">Value *</Label>
              <Input
                id="metric-value"
                placeholder="e.g., 150 or $1,200"
                value={metricForm.value}
                onChange={(e) => setMetricForm({ ...metricForm, value: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metric-description">Description (optional)</Label>
              <Textarea
                id="metric-description"
                placeholder="e.g., Number of newsletter subscribers"
                value={metricForm.description}
                onChange={(e) => setMetricForm({ ...metricForm, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="metric-color">Color</Label>
                <Select
                  value={metricForm.color}
                  onValueChange={(value) => setMetricForm({ ...metricForm, color: value })}
                >
                  <SelectTrigger id="metric-color">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="yellow">Yellow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metric-icon">Icon (emoji)</Label>
                <Input
                  id="metric-icon"
                  placeholder="📊"
                  value={metricForm.icon}
                  onChange={(e) => setMetricForm({ ...metricForm, icon: e.target.value })}
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setIsAddMetricOpen(false)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveMetric}>
              {editingMetricId ? "Add New Value" : "Add Metric"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
