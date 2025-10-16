"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardSection } from "./dashboard-section"

interface Link {
  id: string
  title: string
  description: string
  url: string
  type: string
}

const LINK_TYPES = [
  { value: "notion", label: "Notion" },
  { value: "drive", label: "Google Drive" },
  { value: "github", label: "GitHub" },
  { value: "slack", label: "Slack" },
  { value: "figma", label: "Figma" },
  { value: "jira", label: "Jira" },
  { value: "confluence", label: "Confluence" },
  { value: "trello", label: "Trello" },
  { value: "asana", label: "Asana" },
  { value: "miro", label: "Miro" },
  { value: "docs", label: "Documentation" },
  { value: "api", label: "API" },
  { value: "other", label: "Other" },
]

export function GuidesDocsSection() {
  const [customLinks, setCustomLinks] = useState<Link[]>([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    description: "",
    type: "other"
  })

  // Default links that can be edited
  const [defaultLinks, setDefaultLinks] = useState({
    googleDrive: {
      title: "Google Drive Folder",
      url: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_URL || "",
      description: "Main project documentation",
      type: "drive"
    },
    notion: {
      title: "Notion Database",
      url: process.env.NEXT_PUBLIC_NOTION_DATABASE_ID
        ? `https://notion.so/${process.env.NEXT_PUBLIC_NOTION_DATABASE_ID}`
        : "",
      description: "Project tracking and tasks",
      type: "notion"
    },
    github: {
      title: "GitHub Repository",
      url: "https://github.com/GuillaumeRacine/MiniVault",
      description: "Source code repository",
      type: "github"
    }
  })

  const handleOpenAdd = () => {
    setEditingId(null)
    setFormData({ title: "", url: "", description: "", type: "other" })
    setOpen(true)
  }

  const handleOpenEdit = (link: Link) => {
    setEditingId(link.id)
    const typeValue = LINK_TYPES.find(t => t.label === link.type)?.value || "other"
    setFormData({
      title: link.title,
      url: link.url,
      description: link.description,
      type: typeValue
    })
    setOpen(true)
  }

  const handleOpenEditDefault = (linkKey: "googleDrive" | "notion" | "github") => {
    setEditingId(linkKey)
    const link = defaultLinks[linkKey]
    setFormData({
      title: link.title,
      url: link.url,
      description: link.description,
      type: link.type
    })
    setOpen(true)
  }

  const handleSaveLink = () => {
    if (!formData.title || !formData.url) return

    // Check if editing a default link
    if (editingId === "googleDrive" || editingId === "notion" || editingId === "github") {
      setDefaultLinks({
        ...defaultLinks,
        [editingId]: {
          title: formData.title,
          url: formData.url,
          description: formData.description,
          type: formData.type
        }
      })
    } else {
      const linkData = {
        title: formData.title,
        description: formData.description,
        url: formData.url,
        type: LINK_TYPES.find(t => t.value === formData.type)?.label || "Other"
      }

      if (editingId) {
        // Update existing custom link
        setCustomLinks(customLinks.map(link =>
          link.id === editingId ? { ...link, ...linkData } : link
        ))
      } else {
        // Add new link
        const newLink: Link = {
          id: Date.now().toString(),
          ...linkData
        }
        setCustomLinks([...customLinks, newLink])
      }
    }

    setOpen(false)
    setFormData({ title: "", url: "", description: "", type: "other" })
    setEditingId(null)
  }

  const handleViewLink = (url: string) => {
    if (url && url !== "Not configured") {
      window.open(url, "_blank")
    }
  }

  const handleDeleteLink = (linkId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce lien ?")) {
      setCustomLinks(customLinks.filter(link => link.id !== linkId))
    }
  }

  const handleDeleteDefaultLink = (linkKey: "googleDrive" | "notion" | "github") => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce lien ?")) {
      setDefaultLinks({
        ...defaultLinks,
        [linkKey]: {
          ...defaultLinks[linkKey],
          url: "",
          title: defaultLinks[linkKey].title,
          description: defaultLinks[linkKey].description,
          type: defaultLinks[linkKey].type
        }
      })
    }
  }

  const detailedContent = (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Important Links & References</h4>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleOpenAdd}>Add Link</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Link" : "Add New Link"}</DialogTitle>
                <DialogDescription>
                  {editingId
                    ? "Update the link information below."
                    : "Add a new link to your project resources. Choose a type and enter the URL."
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select link type" />
                    </SelectTrigger>
                    <SelectContent>
                      {LINK_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Project Documentation"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    placeholder="https://..."
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="Brief description..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSaveLink}>
                  {editingId ? "Save Changes" : "Add Link"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-3">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">{defaultLinks.googleDrive.title}</h5>
                    <p className="text-xs text-muted-foreground">{defaultLinks.googleDrive.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">Drive</Badge>
                    <Button size="sm" variant="outline" onClick={() => handleOpenEditDefault("googleDrive")}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleViewLink(defaultLinks.googleDrive.url || "Not configured")}>
                      View
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteDefaultLink("googleDrive")}>
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="p-2 bg-muted/50 rounded text-xs font-mono text-muted-foreground">
                  {defaultLinks.googleDrive.url || "Not configured"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">{defaultLinks.notion.title}</h5>
                    <p className="text-xs text-muted-foreground">{defaultLinks.notion.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">Notion</Badge>
                    <Button size="sm" variant="outline" onClick={() => handleOpenEditDefault("notion")}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewLink(defaultLinks.notion.url || "Not configured")}
                    >
                      View
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteDefaultLink("notion")}>
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="p-2 bg-muted/50 rounded text-xs font-mono text-muted-foreground">
                  {defaultLinks.notion.url || "Not configured"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">{defaultLinks.github.title}</h5>
                    <p className="text-xs text-muted-foreground">{defaultLinks.github.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">GitHub</Badge>
                    <Button size="sm" variant="outline" onClick={() => handleOpenEditDefault("github")}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleViewLink(defaultLinks.github.url)}>
                      View
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteDefaultLink("github")}>
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="p-2 bg-muted/50 rounded text-xs font-mono text-muted-foreground">
                  {defaultLinks.github.url}
                </div>
              </div>
            </CardContent>
          </Card>

          {customLinks.map((link) => (
            <Card key={link.id}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">{link.title}</h5>
                      <p className="text-xs text-muted-foreground">{link.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{link.type}</Badge>
                      <Button size="sm" variant="outline" onClick={() => handleOpenEdit(link)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleViewLink(link.url)}>
                        View
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteLink(link.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="p-2 bg-muted/50 rounded text-xs font-mono text-muted-foreground break-all">
                    {link.url}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-3">Quick Reference</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="space-y-1">
              <div className="text-sm font-medium">Project Workspace</div>
              <div className="text-xs text-muted-foreground">Notion workspace link</div>
            </div>
          </Card>
          <Card className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="space-y-1">
              <div className="text-sm font-medium">Shared Documents</div>
              <div className="text-xs text-muted-foreground">Google Drive shared folder</div>
            </div>
          </Card>
          <Card className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="space-y-1">
              <div className="text-sm font-medium">API Documentation</div>
              <div className="text-xs text-muted-foreground">External API docs</div>
            </div>
          </Card>
          <Card className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="space-y-1">
              <div className="text-sm font-medium">Meeting Notes</div>
              <div className="text-xs text-muted-foreground">Notion meeting archive</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )

  return (
    <DashboardSection
      title="Guides and Docs"
      description="Important links and references for project resources"
      icon="📚"
      detailedContent={detailedContent}
    />
  )
}
