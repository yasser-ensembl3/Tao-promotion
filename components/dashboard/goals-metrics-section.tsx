"use client"

import { useState } from "react"
import { DashboardSection } from "./dashboard-section"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Goal {
  id: string
  title: string
  target: string
  current: string
  deadline: string
  status: "on-track" | "at-risk" | "completed" | "not-started"
}

export function GoalsMetricsSection() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    target: "",
    current: "",
    deadline: "",
    status: "not-started" as Goal["status"]
  })

  const handleOpenAdd = () => {
    setEditingId(null)
    setFormData({ title: "", target: "", current: "", deadline: "", status: "not-started" })
    setOpen(true)
  }

  const handleOpenEdit = (goal: Goal) => {
    setEditingId(goal.id)
    setFormData({
      title: goal.title,
      target: goal.target,
      current: goal.current,
      deadline: goal.deadline,
      status: goal.status
    })
    setOpen(true)
  }

  const handleSave = () => {
    if (!formData.title || !formData.target) return

    if (editingId) {
      setGoals(goals.map(goal =>
        goal.id === editingId ? { ...goal, ...formData } : goal
      ))
    } else {
      const newGoal: Goal = {
        id: Date.now().toString(),
        ...formData
      }
      setGoals([...goals, newGoal])
    }

    setOpen(false)
    setFormData({ title: "", target: "", current: "", deadline: "", status: "not-started" })
    setEditingId(null)
  }

  const handleDelete = (goalId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet objectif ?")) {
      setGoals(goals.filter(goal => goal.id !== goalId))
    }
  }

  const getStatusBadge = (status: Goal["status"]) => {
    const variants = {
      "on-track": "default",
      "at-risk": "destructive",
      "completed": "secondary",
      "not-started": "outline"
    }
    const labels = {
      "on-track": "On Track",
      "at-risk": "At Risk",
      "completed": "Completed",
      "not-started": "Not Started"
    }
    return <Badge variant={variants[status] as any}>{labels[status]}</Badge>
  }

  const completedCount = goals.filter(g => g.status === "completed").length
  const onTrackCount = goals.filter(g => g.status === "on-track").length
  const atRiskCount = goals.filter(g => g.status === "at-risk").length

  const keyMetrics = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold">{completedCount}</div>
        <div className="text-sm text-muted-foreground">Completed</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{onTrackCount}</div>
        <div className="text-sm text-muted-foreground">On Track</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{atRiskCount}</div>
        <div className="text-sm text-muted-foreground">At Risk</div>
      </div>
    </div>
  )

  const detailedContent = (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Goals & KPIs</h4>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleOpenAdd}>Add Goal</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Goal" : "Add New Goal"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Update goal information below." : "Add a new goal to track progress."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="goal-title">Goal Title</Label>
                  <Input
                    id="goal-title"
                    placeholder="e.g., Increase user engagement"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="target">Target</Label>
                  <Input
                    id="target"
                    placeholder="e.g., 10,000 users"
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="current">Current Progress</Label>
                  <Input
                    id="current"
                    placeholder="e.g., 7,500 users"
                    value={formData.current}
                    onChange={(e) => setFormData({ ...formData, current: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as Goal["status"] })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-started">Not Started</SelectItem>
                      <SelectItem value="on-track">On Track</SelectItem>
                      <SelectItem value="at-risk">At Risk</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSave}>
                  {editingId ? "Save Changes" : "Add Goal"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {goals.length === 0 ? (
          <div className="p-8 border rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              No goals defined yet. Create your first goal to start tracking progress.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Click "Add Goal" to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => (
              <Card key={goal.id}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-sm">{goal.title}</h5>
                        <p className="text-xs text-muted-foreground mt-1">
                          Target: {goal.target} | Current: {goal.current || "Not set"}
                        </p>
                        {goal.deadline && (
                          <p className="text-xs text-muted-foreground">
                            Deadline: {new Date(goal.deadline).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(goal.status)}
                        <Button size="sm" variant="outline" onClick={() => handleOpenEdit(goal)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(goal.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
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
      title="Goals & Metrics"
      description="Track progress toward objectives and measure key performance indicators"
      icon="🎯"
      keyMetrics={keyMetrics}
      detailedContent={detailedContent}
    />
  )
}
