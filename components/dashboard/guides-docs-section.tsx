"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardSection } from "./dashboard-section"
import { useProjectConfig } from "@/contexts/project-config-context"
import { ExternalLink } from "lucide-react"

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
  const { config, updateConfig } = useProjectConfig()
  const [customLinks, setCustomLinks] = useState<Link[]>([])
  const [documentsLoaded, setDocumentsLoaded] = useState(false)
  const [syncAttempted, setSyncAttempted] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingConfigType, setEditingConfigType] = useState<"drive" | "notion" | "github" | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    description: "",
    type: "other"
  })

  // Load custom links from Notion documents database
  useEffect(() => {
    if (config.notionDatabases?.documents) {
      setDocumentsLoaded(false)
      setSyncAttempted(false)
      fetchDocuments()
    }
  }, [config.notionDatabases?.documents])

  // Sync configured links to documents database on initialization
  useEffect(() => {
    const syncConfiguredLinks = async () => {
      // Only sync once after documents have been loaded
      if (!config.notionDatabases?.documents || !documentsLoaded || syncAttempted) return

      console.log("[GuidesDocsSection] Starting sync check with", customLinks.length, "existing documents")

      // Check if there are any configured links to sync
      const hasDrive = config.googleDrive?.folderId && config.googleDrive.folderId.trim() !== ""
      const hasNotion = config.notion?.databaseId && config.notion.databaseId.trim() !== ""
      const hasGitHub = config.github?.owner && config.github.owner.trim() !== "" &&
                       config.github?.repo && config.github.repo.trim() !== ""

      if (!hasDrive && !hasNotion && !hasGitHub) {
        setSyncAttempted(true)
        return
      }

      try {
        let needsRefresh = false

        // Check and sync Google Drive link
        if (hasDrive && config.googleDrive) {
          // Check by URL to avoid duplicates
          const driveUrl = `https://drive.google.com/drive/folders/${config.googleDrive.folderId}`
          const existingDriveDoc = customLinks.find(link =>
            link.url === driveUrl || link.type === "Google Drive"
          )
          if (!existingDriveDoc) {
            console.log("[GuidesDocsSection] Syncing Drive link to documents database")
            await fetch("/api/notion/documents", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                databaseId: config.notionDatabases.documents,
                title: config.googleDrive.folderName || "Google Drive Folder",
                url: driveUrl,
                description: "Main project documentation",
                type: "Google Drive",
              }),
            })
            needsRefresh = true
          } else {
            console.log("[GuidesDocsSection] Drive link already exists")
          }
        }

        // Check and sync Notion database link
        if (hasNotion && config.notion) {
          // Check by URL to avoid duplicates
          const notionUrl = `https://notion.so/${config.notion.databaseId.replace(/-/g, "")}`
          const existingNotionDoc = customLinks.find(link =>
            link.url === notionUrl || (link.type === "Notion" && link.title === (config.notion?.databaseName || "Notion Database"))
          )
          if (!existingNotionDoc) {
            console.log("[GuidesDocsSection] Syncing Notion link to documents database")
            await fetch("/api/notion/documents", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                databaseId: config.notionDatabases.documents,
                title: config.notion.databaseName || "Notion Database",
                url: notionUrl,
                description: "Project tracking and tasks",
                type: "Notion",
              }),
            })
            needsRefresh = true
          } else {
            console.log("[GuidesDocsSection] Notion link already exists")
          }
        }

        // Check and sync GitHub repository link
        if (hasGitHub && config.github) {
          // Check by URL to avoid duplicates
          const githubUrl = `https://github.com/${config.github.owner}/${config.github.repo}`
          const existingGitHubDoc = customLinks.find(link =>
            link.url === githubUrl || link.type === "GitHub"
          )
          if (!existingGitHubDoc) {
            console.log("[GuidesDocsSection] Syncing GitHub link to documents database")
            await fetch("/api/notion/documents", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                databaseId: config.notionDatabases.documents,
                title: "GitHub Repository",
                url: githubUrl,
                description: "Source code repository",
                type: "GitHub",
              }),
            })
            needsRefresh = true
          } else {
            console.log("[GuidesDocsSection] GitHub link already exists")
          }
        }

        // Mark sync as attempted to prevent running again
        setSyncAttempted(true)

        // Refresh documents only if we created new ones
        if (needsRefresh) {
          console.log("[GuidesDocsSection] Refreshing documents after sync")
          await fetchDocuments()
        }
      } catch (error) {
        console.error("[GuidesDocsSection] Error syncing configured links:", error)
        setSyncAttempted(true) // Mark as attempted even on error
      }
    }

    // Run sync when documents are first loaded
    if (documentsLoaded && !syncAttempted) {
      syncConfiguredLinks()
    }
  }, [documentsLoaded, syncAttempted, config.notionDatabases?.documents, config.googleDrive?.folderId, config.notion?.databaseId, config.github?.owner, config.github?.repo, customLinks])

  const fetchDocuments = async () => {
    if (!config.notionDatabases?.documents) return

    try {
      const response = await fetch(`/api/notion/documents?databaseId=${config.notionDatabases.documents}`)
      if (response.ok) {
        const data = await response.json()
        const documents = data.documents || []

        // Remove duplicates by URL (keep the first one)
        const uniqueDocuments: Link[] = []
        const seenUrls = new Set<string>()

        for (const doc of documents) {
          if (!seenUrls.has(doc.url)) {
            seenUrls.add(doc.url)
            uniqueDocuments.push(doc)
          } else {
            // Delete duplicate from Notion
            console.log("[GuidesDocsSection] Removing duplicate document:", doc.title, doc.url)
            try {
              await fetch(`/api/notion/documents?documentId=${doc.id}`, {
                method: "DELETE",
              })
            } catch (err) {
              console.error("[GuidesDocsSection] Error removing duplicate:", err)
            }
          }
        }

        setCustomLinks(uniqueDocuments)
        setDocumentsLoaded(true)
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
      setDocumentsLoaded(true) // Mark as loaded even on error to avoid blocking
    }
  }

  const handleOpenAdd = () => {
    setEditingId(null)
    setEditingConfigType(null)
    setFormData({ title: "", url: "", description: "", type: "other" })
    setOpen(true)
  }

  const handleOpenEdit = (link: Link) => {
    setEditingId(link.id)
    setEditingConfigType(null)
    const typeValue = LINK_TYPES.find(t => t.label === link.type)?.value || "other"
    setFormData({
      title: link.title,
      url: link.url,
      description: link.description,
      type: typeValue
    })
    setOpen(true)
  }

  const handleEditConfigLink = (type: "drive" | "notion" | "github") => {
    setEditingId(null)
    setEditingConfigType(type)

    if (type === "drive") {
      setFormData({
        title: config.googleDrive?.folderName || "Google Drive Folder",
        url: config.googleDrive?.folderId || "",
        description: "Main project documentation",
        type: "drive"
      })
    } else if (type === "notion") {
      setFormData({
        title: config.notion?.databaseName || "Notion Database",
        url: config.notion?.databaseId || "",
        description: "Project tracking and tasks",
        type: "notion"
      })
    } else if (type === "github") {
      setFormData({
        title: "GitHub Repository",
        url: `${config.github?.owner || ""}/${config.github?.repo || ""}`,
        description: "Source code repository",
        type: "github"
      })
    }

    setOpen(true)
  }

  const handleSaveLink = async () => {
    if (!formData.title || !formData.url) return

    // Handle config link updates
    if (editingConfigType) {
      if (editingConfigType === "drive") {
        updateConfig({
          googleDrive: {
            folderId: formData.url,
            folderName: formData.title
          }
        })
      } else if (editingConfigType === "notion") {
        updateConfig({
          notion: {
            databaseId: formData.url,
            databaseName: formData.title
          }
        })
      } else if (editingConfigType === "github") {
        const [owner, repo] = formData.url.split("/")
        if (owner && repo) {
          updateConfig({
            github: {
              owner: owner.trim(),
              repo: repo.trim()
            }
          })
        }
      }

      // Also sync to documents database if available
      if (config.notionDatabases?.documents) {
        try {
          const typeLabel = editingConfigType === "drive" ? "Google Drive" :
                          editingConfigType === "notion" ? "Notion" : "GitHub"

          let fullUrl = formData.url
          if (editingConfigType === "drive") {
            fullUrl = `https://drive.google.com/drive/folders/${formData.url}`
          } else if (editingConfigType === "notion") {
            fullUrl = `https://notion.so/${formData.url.replace(/-/g, "")}`
          } else if (editingConfigType === "github") {
            fullUrl = `https://github.com/${formData.url}`
          }

          // Check if a document already exists for this config type
          const existingDoc = customLinks.find(link =>
            (editingConfigType === "drive" && link.type === "Google Drive") ||
            (editingConfigType === "notion" && link.type === "Notion" && link.title === formData.title) ||
            (editingConfigType === "github" && link.type === "GitHub")
          )

          if (existingDoc) {
            // Update existing
            await fetch("/api/notion/documents", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                documentId: existingDoc.id,
                title: formData.title,
                url: fullUrl,
                description: formData.description,
                type: typeLabel,
              }),
            })
          } else {
            // Create new
            await fetch("/api/notion/documents", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                databaseId: config.notionDatabases.documents,
                title: formData.title,
                url: fullUrl,
                description: formData.description,
                type: typeLabel,
              }),
            })
          }
          await fetchDocuments()
        } catch (error) {
          console.error("Error syncing config link to documents:", error)
        }
      }

      setOpen(false)
      setFormData({ title: "", url: "", description: "", type: "other" })
      setEditingId(null)
      setEditingConfigType(null)
      return
    }

    // Handle custom links with Notion sync
    if (!config.notionDatabases?.documents) {
      // Fallback to local state if no Notion database
      const linkData = {
        title: formData.title,
        description: formData.description,
        url: formData.url,
        type: LINK_TYPES.find(t => t.value === formData.type)?.label || "Other"
      }

      if (editingId) {
        setCustomLinks(customLinks.map(link =>
          link.id === editingId ? { ...link, ...linkData } : link
        ))
      } else {
        const newLink: Link = {
          id: Date.now().toString(),
          ...linkData
        }
        setCustomLinks([...customLinks, newLink])
      }
      setOpen(false)
      setFormData({ title: "", url: "", description: "", type: "other" })
      setEditingId(null)
      return
    }

    // Sync with Notion
    try {
      const typeLabel = LINK_TYPES.find(t => t.value === formData.type)?.label || "Other"

      if (editingId) {
        // Update existing document
        const response = await fetch("/api/notion/documents", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentId: editingId,
            title: formData.title,
            url: formData.url,
            description: formData.description,
            type: typeLabel,
          }),
        })

        if (response.ok) {
          await fetchDocuments()
        } else {
          console.error("Failed to update document")
        }
      } else {
        // Create new document
        const response = await fetch("/api/notion/documents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            databaseId: config.notionDatabases.documents,
            title: formData.title,
            url: formData.url,
            description: formData.description,
            type: typeLabel,
          }),
        })

        if (response.ok) {
          await fetchDocuments()
        } else {
          const errorData = await response.json()
          console.error("Failed to create document:", errorData)
          alert(`Failed to create document: ${errorData.error}\n\nDetails: ${JSON.stringify(errorData.details, null, 2)}`)
        }
      }
    } catch (error) {
      console.error("Error saving document:", error)
    }

    setOpen(false)
    setFormData({ title: "", url: "", description: "", type: "other" })
    setEditingId(null)
    setEditingConfigType(null)
  }

  const handleViewLink = (url: string) => {
    if (url && url !== "Not configured") {
      window.open(url, "_blank")
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce lien ?")) return

    if (!config.notionDatabases?.documents) {
      // Fallback to local state
      setCustomLinks(customLinks.filter(link => link.id !== linkId))
      return
    }

    // Sync with Notion
    try {
      const response = await fetch(`/api/notion/documents?documentId=${linkId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchDocuments()
      } else {
        console.error("Failed to delete document")
      }
    } catch (error) {
      console.error("Error deleting document:", error)
    }
  }

  const handleDeleteConfigLink = (type: "drive" | "notion" | "github") => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce lien ?")) return

    if (type === "drive") {
      updateConfig({
        googleDrive: {
          folderId: "",
          folderName: ""
        }
      })
    } else if (type === "notion") {
      updateConfig({
        notion: {
          databaseId: "",
          databaseName: ""
        }
      })
    } else if (type === "github") {
      updateConfig({
        github: {
          owner: "",
          repo: ""
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
                <DialogTitle>
                  {editingConfigType ? "Edit Configured Link" : editingId ? "Edit Link" : "Add New Link"}
                </DialogTitle>
                <DialogDescription>
                  {editingConfigType
                    ? "Update the configured link information. This will sync with Project Settings."
                    : editingId
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
                    disabled={!!editingConfigType}
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
                  <Label htmlFor="url">
                    {editingConfigType === "drive" && "Folder ID"}
                    {editingConfigType === "notion" && "Database ID"}
                    {editingConfigType === "github" && "Repository (owner/repo)"}
                    {!editingConfigType && "URL"}
                  </Label>
                  <Input
                    id="url"
                    placeholder={
                      editingConfigType === "drive" ? "1a2b3c4d5e6f..." :
                      editingConfigType === "notion" ? "abc123def456..." :
                      editingConfigType === "github" ? "owner/repo" :
                      "https://..."
                    }
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
          {config.googleDrive?.folderId && config.googleDrive.folderId.trim() !== "" && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">
                        {config.googleDrive?.folderName || "Google Drive Folder"}
                      </h5>
                      <p className="text-xs text-muted-foreground">Main project documentation</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Drive</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditConfigLink("drive")}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.open(
                            `https://drive.google.com/drive/folders/${config.googleDrive?.folderId}`,
                            "_blank"
                          )
                        }
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteConfigLink("drive")}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="p-2 bg-muted/50 rounded text-xs font-mono text-muted-foreground">
                    {config.googleDrive?.folderId}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {config.notion?.databaseId && config.notion.databaseId.trim() !== "" && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">
                        {config.notion?.databaseName || "Notion Database"}
                      </h5>
                      <p className="text-xs text-muted-foreground">Project tracking and tasks</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Notion</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditConfigLink("notion")}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.open(
                            `https://notion.so/${config.notion?.databaseId.replace(/-/g, "")}`,
                            "_blank"
                          )
                        }
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteConfigLink("notion")}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="p-2 bg-muted/50 rounded text-xs font-mono text-muted-foreground truncate">
                    {config.notion?.databaseId}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {config.projectPageId && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">Project Page</h5>
                      <p className="text-xs text-muted-foreground">Main project Notion page</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Notion</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.open(
                            `https://notion.so/${config.projectPageId?.replace(/-/g, "")}`,
                            "_blank"
                          )
                        }
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                  <div className="p-2 bg-muted/50 rounded text-xs font-mono text-muted-foreground truncate">
                    {config.projectPageId}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {config.github?.owner && config.github.owner.trim() !== "" && config.github?.repo && config.github.repo.trim() !== "" && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">GitHub Repository</h5>
                      <p className="text-xs text-muted-foreground">Source code repository</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">GitHub</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditConfigLink("github")}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.open(
                            `https://github.com/${config.github?.owner}/${config.github?.repo}`,
                            "_blank"
                          )
                        }
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteConfigLink("github")}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="p-2 bg-muted/50 rounded text-xs font-mono text-muted-foreground">
                    {config.github.owner}/{config.github.repo}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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

          {customLinks.length === 0 &&
           !(config.googleDrive?.folderId && config.googleDrive.folderId.trim() !== "") &&
           !(config.notion?.databaseId && config.notion.databaseId.trim() !== "") &&
           !(config.github?.owner && config.github.owner.trim() !== "" && config.github?.repo && config.github.repo.trim() !== "") &&
           !config.projectPageId && (
            <div className="p-8 border rounded-lg text-center border-dashed">
              <p className="text-sm text-muted-foreground">
                No links added yet. Click &ldquo;Add Link&rdquo; to add your first resource link.
              </p>
            </div>
          )}
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
      defaultOpen={true}
    />
  )
}
