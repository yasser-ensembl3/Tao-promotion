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

interface Feedback {
  id: string
  user: string
  message: string
  date: string
  type: "feature-request" | "bug" | "improvement" | "praise" | "complaint"
  status: "new" | "reviewed" | "in-progress" | "resolved"
}

export function UserFeedbackSection() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    user: "",
    message: "",
    date: new Date().toISOString().split('T')[0],
    type: "feature-request" as Feedback["type"],
    status: "new" as Feedback["status"]
  })

  const handleOpenAdd = () => {
    setEditingId(null)
    setFormData({ user: "", message: "", date: new Date().toISOString().split('T')[0], type: "feature-request", status: "new" })
    setOpen(true)
  }

  const handleOpenEdit = (feedback: Feedback) => {
    setEditingId(feedback.id)
    setFormData({
      user: feedback.user,
      message: feedback.message,
      date: feedback.date,
      type: feedback.type,
      status: feedback.status
    })
    setOpen(true)
  }

  const handleSave = () => {
    if (!formData.user || !formData.message) return

    if (editingId) {
      setFeedbacks(feedbacks.map(feedback =>
        feedback.id === editingId ? { ...feedback, ...formData } : feedback
      ))
    } else {
      const newFeedback: Feedback = {
        id: Date.now().toString(),
        ...formData
      }
      setFeedbacks([...feedbacks, newFeedback])
    }

    setOpen(false)
    setFormData({ user: "", message: "", date: new Date().toISOString().split('T')[0], type: "feature-request", status: "new" })
    setEditingId(null)
  }

  const handleDelete = (feedbackId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce feedback ?")) {
      setFeedbacks(feedbacks.filter(feedback => feedback.id !== feedbackId))
    }
  }

  const getTypeBadge = (type: Feedback["type"]) => {
    const variants = {
      "feature-request": "default",
      "bug": "destructive",
      "improvement": "secondary",
      "praise": "secondary",
      "complaint": "destructive"
    }
    const labels = {
      "feature-request": "Feature Request",
      "bug": "Bug",
      "improvement": "Improvement",
      "praise": "Praise",
      "complaint": "Complaint"
    }
    return <Badge variant={variants[type] as any}>{labels[type]}</Badge>
  }

  const getStatusBadge = (status: Feedback["status"]) => {
    const variants = {
      "new": "default",
      "reviewed": "secondary",
      "in-progress": "outline",
      "resolved": "secondary"
    }
    const labels = {
      "new": "New",
      "reviewed": "Reviewed",
      "in-progress": "In Progress",
      "resolved": "Resolved"
    }
    return <Badge variant={variants[status] as any}>{labels[status]}</Badge>
  }

  const newCount = feedbacks.filter(f => f.status === "new").length
  const inProgressCount = feedbacks.filter(f => f.status === "in-progress").length
  const resolvedCount = feedbacks.filter(f => f.status === "resolved").length

  const keyMetrics = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold">{newCount}</div>
        <div className="text-sm text-muted-foreground">New</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{inProgressCount}</div>
        <div className="text-sm text-muted-foreground">In Progress</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{resolvedCount}</div>
        <div className="text-sm text-muted-foreground">Resolved</div>
      </div>
    </div>
  )

  const detailedContent = (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Feedback Items</h4>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleOpenAdd}>Add Feedback</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Feedback" : "Add New Feedback"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Update feedback information below." : "Add new user feedback to track."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="user">User Name</Label>
                  <Input
                    id="user"
                    placeholder="e.g., John Doe"
                    value={formData.user}
                    onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="message">Feedback Message</Label>
                  <Input
                    id="message"
                    placeholder="Describe the feedback..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as Feedback["type"] })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feature-request">Feature Request</SelectItem>
                      <SelectItem value="bug">Bug</SelectItem>
                      <SelectItem value="improvement">Improvement</SelectItem>
                      <SelectItem value="praise">Praise</SelectItem>
                      <SelectItem value="complaint">Complaint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as Feedback["status"] })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSave}>
                  {editingId ? "Save Changes" : "Add Feedback"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {feedbacks.length === 0 ? (
          <div className="p-8 border rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              No feedback recorded yet. Add feedback items to track user responses.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Click "Add Feedback" to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedbacks.map((feedback) => (
              <Card key={feedback.id}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium text-sm">{feedback.user}</h5>
                          <span className="text-xs text-muted-foreground">
                            {new Date(feedback.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{feedback.message}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getTypeBadge(feedback.type)}
                        {getStatusBadge(feedback.status)}
                        <Button size="sm" variant="outline" onClick={() => handleOpenEdit(feedback)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(feedback.id)}>
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
      title="User Feedback"
      description="Monitor and respond to user feedback and requests"
      icon="💬"
      keyMetrics={keyMetrics}
      detailedContent={detailedContent}
    />
  )
}
