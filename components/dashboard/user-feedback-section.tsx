"use client"

import { useState, useEffect } from "react"
import { PageSection } from "./page-section"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useProjectConfig } from "@/lib/project-config"
import { ChevronDown, ChevronUp } from "lucide-react"

interface Feedback {
  id: string
  title: string
  date: string
  feedback: string
  userName: string
  url?: string
}

type FilterType = "all" | "week" | "month"

export function UserFeedbackSection() {
  const config = useProjectConfig()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all")
  const [expanded, setExpanded] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().split('T')[0],
    feedback: "",
    userName: ""
  })
  const [detailsOpen, setDetailsOpen] = useState(true)

  // Handle card click: toggle if same filter, otherwise open with new filter
  const handleCardClick = (filter: FilterType) => {
    if (selectedFilter === filter) {
      setExpanded(!expanded)
    } else {
      setSelectedFilter(filter)
      setExpanded(true)
    }
  }

  const fetchFeedbacks = async () => {
    if (!config?.notionDatabases?.feedback) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/notion/feedback?databaseId=${config?.notionDatabases.feedback}`)
      if (response.ok) {
        const data = await response.json()
        setFeedbacks(data.feedbacks || [])
      } else {
        console.error("Failed to fetch feedbacks from Notion")
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (config?.notionDatabases?.feedback) {
      fetchFeedbacks()
    }
  }, [config?.notionDatabases?.feedback])

  const handleOpenAdd = () => {
    setEditingId(null)
    setFormData({ title: "", date: new Date().toISOString().split('T')[0], feedback: "", userName: "" })
    setOpen(true)
  }

  const handleOpenEdit = (feedback: Feedback) => {
    setEditingId(feedback.id)
    setFormData({
      title: feedback.title,
      date: feedback.date,
      feedback: feedback.feedback,
      userName: feedback.userName
    })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.feedback || !formData.userName) {
      alert("Title, Feedback, and User Name are required")
      return
    }

    if (!config?.notionDatabases?.feedback) {
      alert("Feedback database not configured in Project Settings")
      return
    }

    setLoading(true)
    try {
      if (editingId) {
        // Update existing feedback
        const response = await fetch("/api/notion/feedback", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pageId: editingId,
            title: formData.title,
            date: formData.date,
            feedback: formData.feedback,
            userName: formData.userName,
          }),
        })

        if (response.ok) {
          setOpen(false)
          setFormData({ title: "", date: new Date().toISOString().split('T')[0], feedback: "", userName: "" })
          setEditingId(null)
          await fetchFeedbacks()
        } else {
          const errorData = await response.json()
          alert(`Failed to update feedback: ${errorData.error}`)
        }
      } else {
        // Create new feedback
        const response = await fetch("/api/notion/feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            databaseId: config?.notionDatabases.feedback,
            title: formData.title,
            date: formData.date,
            feedback: formData.feedback,
            userName: formData.userName,
          }),
        })

        if (response.ok) {
          setOpen(false)
          setFormData({ title: "", date: new Date().toISOString().split('T')[0], feedback: "", userName: "" })
          setEditingId(null)
          await fetchFeedbacks()
        } else {
          const errorData = await response.json()
          alert(`Failed to create feedback: ${errorData.error}`)
        }
      }
    } catch (error: any) {
      console.error("Error saving feedback:", error)
      alert(`Error saving feedback: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (feedbackId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce feedback ?")) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/notion/feedback?pageId=${feedbackId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchFeedbacks()
      } else {
        const errorData = await response.json()
        alert(`Failed to delete feedback: ${errorData.error}`)
      }
    } catch (error: any) {
      console.error("Error deleting feedback:", error)
      alert(`Error deleting feedback: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Filter feedbacks by period
  const getThisWeekFeedbacks = () => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    return feedbacks.filter(f => new Date(f.date) >= oneWeekAgo)
  }

  const getThisMonthFeedbacks = () => {
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    return feedbacks.filter(f => new Date(f.date) >= oneMonthAgo)
  }

  const getFilteredFeedbacks = () => {
    switch (selectedFilter) {
      case "week":
        return getThisWeekFeedbacks()
      case "month":
        return getThisMonthFeedbacks()
      case "all":
      default:
        return feedbacks
    }
  }

  const getFilterTitle = () => {
    switch (selectedFilter) {
      case "week":
        return "This Week"
      case "month":
        return "This Month"
      case "all":
      default:
        return "All Feedbacks"
    }
  }

  const totalCount = feedbacks.length
  const thisWeekCount = getThisWeekFeedbacks().length
  const thisMonthCount = getThisMonthFeedbacks().length
  const filteredFeedbacks = getFilteredFeedbacks()

  const keyMetrics = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      <button
        onClick={() => handleCardClick("all")}
        className={`text-center p-2 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
          selectedFilter === "all"
            ? "bg-foreground text-background ring-1 ring-foreground"
            : "bg-muted/50 border-border hover:bg-muted"
        }`}
      >
        <div className={`text-base font-bold ${selectedFilter === "all" ? "text-background" : "text-foreground"}`}>{totalCount}</div>
        <div className={`text-sm ${selectedFilter === "all" ? "text-background/70" : "text-muted-foreground"}`}>Total</div>
      </button>
      <button
        onClick={() => handleCardClick("week")}
        className={`text-center p-2 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
          selectedFilter === "week"
            ? "bg-foreground text-background ring-1 ring-foreground"
            : "bg-muted/50 border-border hover:bg-muted"
        }`}
      >
        <div className={`text-base font-bold ${selectedFilter === "week" ? "text-background" : "text-foreground"}`}>{thisWeekCount}</div>
        <div className={`text-sm ${selectedFilter === "week" ? "text-background/70" : "text-muted-foreground"}`}>This Week</div>
      </button>
      <button
        onClick={() => handleCardClick("month")}
        className={`text-center p-2 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
          selectedFilter === "month"
            ? "bg-foreground text-background ring-1 ring-foreground"
            : "bg-muted/50 border-border hover:bg-muted"
        }`}
      >
        <div className={`text-base font-bold ${selectedFilter === "month" ? "text-background" : "text-foreground"}`}>{thisMonthCount}</div>
        <div className={`text-sm ${selectedFilter === "month" ? "text-background/70" : "text-muted-foreground"}`}>This Month</div>
      </button>
    </div>
  )

  const detailedContent = (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold">{getFilterTitle()} ({filteredFeedbacks.length})</h4>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchFeedbacks}
            disabled={loading || !config?.notionDatabases?.feedback}
          >
            {loading ? "..." : "Refresh"}
          </Button>
          <Button
            size="sm"
            onClick={handleOpenAdd}
            disabled={!config?.notionDatabases?.feedback}
          >
            Add Feedback
          </Button>
        </div>
      </div>

      {!config?.notionDatabases?.feedback ? (
        <div className="p-3 border rounded-lg text-center border-dashed bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Feedback database not configured. Configure it in Project Settings.
          </p>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="p-3 border rounded-lg text-center border-dashed">
          <p className="text-sm text-muted-foreground">
            {selectedFilter === "all"
              ? "No feedback recorded yet. Add feedback items to track user responses."
              : `No feedback for ${getFilterTitle().toLowerCase()}.`}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="p-3 space-y-2">
            {filteredFeedbacks.map((feedback) => (
                  <Card key={feedback.id}>
                    <CardContent className="p-3 sm:p-2">
                      <div className="space-y-3">
                        {/* Header with title and date */}
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-semibold text-sm sm:text-base">{feedback.title}</h5>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {new Date(feedback.date).toLocaleDateString()}
                          </Badge>
                        </div>

                        {/* Content */}
                        <p className="text-sm text-muted-foreground">{feedback.feedback}</p>

                        {/* Footer with author and actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">By:</span> {feedback.userName}
                          </p>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleOpenEdit(feedback)} className="h-7 text-xs">
                              Edit
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(feedback.id)} className="h-7 text-xs">
                              Delete
                            </Button>
                            {feedback.url && (
                              <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                                <a href={feedback.url} target="_blank" rel="noopener noreferrer">
                                  View
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
    </div>
  )

  // Don't show full section if no feedbacks
  if (feedbacks.length === 0) {
    return (
      <>
        <div className="border rounded-lg p-2 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <h3 className="font-semibold text-sm">User Feedback</h3>
                <p className="text-xs text-muted-foreground">Track and manage user feedback</p>
              </div>
            </div>
            <Button size="sm" onClick={handleOpenAdd} disabled={!config?.notionDatabases?.feedback}>
              Add Feedback
            </Button>
          </div>
        </div>

        {/* Add/Edit Feedback Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Feedback" : "Add New Feedback"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Update feedback information below." : "Add new user feedback to track."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Feature request for dark mode"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="feedback">Feedback *</Label>
                <Input
                  id="feedback"
                  placeholder="Describe the feedback..."
                  value={formData.feedback}
                  onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="userName">User Name *</Label>
                <Input
                  id="userName"
                  placeholder="e.g., John Doe"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : (editingId ? "Save Changes" : "Add Feedback")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      <PageSection
        title="User Feedback"
        description="Monitor and respond to user feedback and requests"
        icon=""
        keyMetrics={keyMetrics}
        detailedContent={detailedContent}
        expanded={expanded}
        onExpandedChange={setExpanded}
      />

      {/* Add/Edit Feedback Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Feedback" : "Add New Feedback"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update feedback information below." : "Add new user feedback to track."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Feature request for dark mode"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feedback">Feedback *</Label>
              <Input
                id="feedback"
                placeholder="Describe the feedback..."
                value={formData.feedback}
                onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="userName">User Name *</Label>
              <Input
                id="userName"
                placeholder="e.g., John Doe"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : (editingId ? "Save Changes" : "Add Feedback")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
