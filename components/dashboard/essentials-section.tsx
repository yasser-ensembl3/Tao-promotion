"use client"

import { useState } from "react"
import { useProjectConfig } from "@/lib/project-config"
import { useCachedFetch } from "@/lib/use-cached-fetch"
import { PageSection } from "./page-section"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, ExternalLink, Calendar, Sparkles } from "lucide-react"

interface Essential {
  id: string
  title: string
  description: string | null
  type: string
  priority: string | null
  url: string | null
  dateAdded: string
  notionUrl: string
}

const ESSENTIAL_TYPES = [
  { value: "Tool", label: "🛠️ Tool", emoji: "🛠️", color: "emerald" },
  { value: "Milestone", label: "🎯 Milestone", emoji: "🎯", color: "blue" },
  { value: "Strategy", label: "📊 Strategy", emoji: "📊", color: "purple" },
  { value: "Resource", label: "📚 Resource", emoji: "📚", color: "amber" },
  { value: "Partnership", label: "🤝 Partnership", emoji: "🤝", color: "pink" },
  { value: "Achievement", label: "🏆 Achievement", emoji: "🏆", color: "yellow" },
]

const PRIORITIES = [
  { value: "Critical", label: "Critical", color: "bg-red-100 text-red-700 border-red-300" },
  { value: "High", label: "High", color: "bg-orange-100 text-orange-700 border-orange-300" },
  { value: "Medium", label: "Medium", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
]

export function EssentialsSection() {
  const config = useProjectConfig()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<string>("all")
  const [expanded, setExpanded] = useState(false)

  // Form state
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newType, setNewType] = useState("Resource")
  const [newPriority, setNewPriority] = useState("Medium")
  const [newUrl, setNewUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const essentialsDbId = config.notionDatabases.essentials

  // Fetch essentials with 60s cache
  const apiUrl = essentialsDbId ? `/api/notion/essentials?databaseId=${essentialsDbId}` : null
  const { data: essentialsData, isLoading: loading, refresh: fetchEssentials } = useCachedFetch<{ essentials: Essential[] }>(apiUrl)
  const essentials = essentialsData?.essentials || []

  // Handle card click: toggle if same type, otherwise open with new type
  const handleTypeClick = (type: string) => {
    if (selectedType === type) {
      setExpanded(!expanded)
    } else {
      setSelectedType(type)
      setExpanded(true)
    }
  }

  // Group essentials by type
  const essentialsByType = ESSENTIAL_TYPES.reduce((acc, type) => {
    acc[type.value] = essentials.filter(e => e.type === type.value)
    return acc
  }, {} as Record<string, Essential[]>)

  // Get filtered essentials based on selection
  const getFilteredEssentials = () => {
    if (selectedType === "all") {
      return essentials
    }
    return essentialsByType[selectedType] || []
  }

  const handleAddEssential = async () => {
    if (!essentialsDbId || !newTitle.trim()) return

    try {
      setSubmitting(true)
      const response = await fetch("/api/notion/essentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          databaseId: essentialsDbId,
          title: newTitle,
          description: newDescription,
          type: newType,
          priority: newPriority,
          url: newUrl || undefined,
        }),
      })

      if (response.ok) {
        // Reset form
        setNewTitle("")
        setNewDescription("")
        setNewType("Resource")
        setNewPriority("Medium")
        setNewUrl("")
        setDialogOpen(false)

        // Refresh list
        fetchEssentials()
      } else {
        const error = await response.json()
        console.error("[Essentials Section] Error creating essential:", error)
        alert(`Failed to create essential: ${error.error}`)
      }
    } catch (error) {
      console.error("[Essentials Section] Error:", error)
      alert("Failed to create essential")
    } finally {
      setSubmitting(false)
    }
  }

  const getTypeConfig = (type: string) => {
    return ESSENTIAL_TYPES.find(t => t.value === type) || ESSENTIAL_TYPES[3]
  }

  const getPriorityConfig = (priority: string | null) => {
    return PRIORITIES.find(p => p.value === priority) || PRIORITIES[2]
  }

  if (!essentialsDbId) {
    return (
      <PageSection
        icon="⭐"
        title="Essentials"
        description="Configure NEXT_PUBLIC_NOTION_DB_ESSENTIALS to use this section"
      />
    )
  }

  if (loading) {
    return (
      <PageSection
        icon="⭐"
        title="Essentials"
        description="Loading essential items..."
      />
    )
  }

  const selectedTypeInfo = ESSENTIAL_TYPES.find(t => t.value === selectedType)
  const filteredEssentials = getFilteredEssentials()

  const keyMetrics = essentials.length > 0 ? (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
      {ESSENTIAL_TYPES.map((type) => {
        const count = essentialsByType[type.value]?.length || 0
        const isSelected = selectedType === type.value

        return (
          <button
            key={type.value}
            onClick={() => handleTypeClick(type.value)}
            className={`p-2 rounded-lg border text-center transition-all cursor-pointer hover:shadow-md ${
              isSelected
                ? type.color === 'emerald' ? 'ring-2 ring-emerald-400 bg-emerald-100 border-emerald-400 dark:bg-emerald-900' :
                  type.color === 'blue' ? 'ring-2 ring-blue-400 bg-blue-100 border-blue-400 dark:bg-blue-900' :
                  type.color === 'purple' ? 'ring-2 ring-purple-400 bg-purple-100 border-purple-400 dark:bg-purple-900' :
                  type.color === 'amber' ? 'ring-2 ring-amber-400 bg-amber-100 border-amber-400 dark:bg-amber-900' :
                  type.color === 'pink' ? 'ring-2 ring-pink-400 bg-pink-100 border-pink-400 dark:bg-pink-900' :
                  'ring-2 ring-yellow-400 bg-yellow-100 border-yellow-400 dark:bg-yellow-900'
                : 'bg-muted/50 border-border hover:bg-muted'
            }`}
          >
            <div className="text-xl">{type.emoji}</div>
            <div className={`text-lg font-bold ${
              count > 0
                ? type.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                  type.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                  type.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                  type.color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                  type.color === 'pink' ? 'text-pink-600 dark:text-pink-400' :
                  'text-yellow-600 dark:text-yellow-400'
                : 'text-gray-400'
            }`}>
              {count}
            </div>
            <div className="text-[10px] text-muted-foreground truncate">
              {type.label.replace(type.emoji, "").trim()}
            </div>
          </button>
        )
      })}
    </div>
  ) : (
    <div className="text-center p-4 rounded-lg bg-muted/50 border border-dashed">
      <p className="text-sm text-muted-foreground">No essentials yet</p>
    </div>
  )

  const detailedContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">
          {selectedTypeInfo?.emoji} {selectedTypeInfo?.label.replace(selectedTypeInfo.emoji, "").trim()} ({filteredEssentials.length})
        </h4>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={fetchEssentials} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Essential
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Add Essential Item
                </DialogTitle>
                <DialogDescription>
                  Add a critical tool, milestone, or resource to your project essentials.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Substack Post Creator Tool"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="What makes this essential to your project?"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={newType} onValueChange={setNewType}>
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ESSENTIAL_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newPriority} onValueChange={setNewPriority}>
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url">URL (optional)</Label>
                  <Input
                    id="url"
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddEssential} disabled={submitting || !newTitle.trim()}>
                  {submitting ? "Adding..." : "Add Essential"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {filteredEssentials.length === 0 ? (
        <div className="p-8 border rounded-lg text-center border-dashed">
          <Sparkles className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No essentials in this category. Click &ldquo;Add Essential&rdquo; to add one.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="p-3 space-y-2">
            {filteredEssentials.map((essential) => {
              const typeConfig = getTypeConfig(essential.type)
              const priorityConfig = getPriorityConfig(essential.priority)

              return (
                <div
                  key={essential.id}
                  className="flex items-center gap-3 text-sm p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                >
                  <span className="text-2xl flex-shrink-0">{typeConfig.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium truncate">{essential.title}</h5>
                    {essential.description && (
                      <p className="text-xs text-muted-foreground truncate">{essential.description}</p>
                    )}
                  </div>
                  {essential.priority && (
                    <Badge variant="outline" className={`text-xs flex-shrink-0 ${priorityConfig.color}`}>
                      {essential.priority}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 hidden sm:flex">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(essential.dateAdded).toLocaleDateString()}</span>
                  </div>
                  {essential.url && (
                    <a
                      href={essential.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded hover:bg-muted flex-shrink-0"
                    >
                      <ExternalLink className="h-4 w-4 text-blue-500" />
                    </a>
                  )}
                  <a
                    href={essential.notionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline flex-shrink-0"
                  >
                    View
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <PageSection
      icon="⭐"
      title="Essentials"
      description="Most important tools, milestones, and resources for this project"
      keyMetrics={keyMetrics}
      detailedContent={detailedContent}
      expanded={expanded}
      onExpandedChange={setExpanded}
    />
  )
}
