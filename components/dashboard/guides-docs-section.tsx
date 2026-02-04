"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageSection } from "./page-section"
import { useProjectConfig } from "@/lib/project-config"
import { useNotionData } from "@/lib/use-cached-fetch"
import { ExternalLink } from "lucide-react"
import { DocumentPreviewModal, canPreviewUrl } from "./document-preview-modal"

interface Link {
  id: string
  title: string
  description: string
  url: string
  type: string
  category?: string
}

const LINK_TYPES = [
  { value: "notion", label: "Notion", icon: "", color: "bg-muted text-muted-foreground" },
  { value: "drive", label: "Google Drive", icon: "", color: "bg-muted text-muted-foreground" },
  { value: "github", label: "GitHub", icon: "", color: "bg-muted text-muted-foreground" },
  { value: "slack", label: "Slack", icon: "", color: "bg-muted text-muted-foreground" },
  { value: "figma", label: "Figma", icon: "", color: "bg-muted text-muted-foreground" },
  { value: "jira", label: "Jira", icon: "", color: "bg-muted text-muted-foreground" },
  { value: "confluence", label: "Confluence", icon: "", color: "bg-muted text-muted-foreground" },
  { value: "trello", label: "Trello", icon: "", color: "bg-muted text-muted-foreground" },
  { value: "asana", label: "Asana", icon: "", color: "bg-muted text-muted-foreground" },
  { value: "miro", label: "Miro", icon: "", color: "bg-muted text-muted-foreground" },
  { value: "docs", label: "Documentation", icon: "", color: "bg-muted text-muted-foreground" },
  { value: "api", label: "API", icon: "", color: "bg-muted text-muted-foreground" },
  { value: "other", label: "Other", icon: "", color: "bg-muted text-muted-foreground" },
]

const CATEGORIES = [
  { value: "database", label: "Databases", emoji: "", notionLabel: "Databases" },
  { value: "tool", label: "Tools", emoji: "", notionLabel: "Tools" },
  { value: "website", label: "Apps & Websites", emoji: "", notionLabel: "Apps & Websites" },
  { value: "social", label: "Social Media", emoji: "", notionLabel: "Social Media" },
  { value: "document", label: "Documentation", emoji: "", notionLabel: "Documentation" },
  { value: "other", label: "Other Links", emoji: "", notionLabel: "Other Links" },
]

export function GuidesDocsSection() {
  const config = useProjectConfig()
  const [syncAttempted, setSyncAttempted] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingConfigType, setEditingConfigType] = useState<"drive" | "notion" | "github" | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [expanded, setExpanded] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    description: "",
    type: "other",
    category: "other"
  })

  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLink, setPreviewLink] = useState<Link | null>(null)

  // Gère le clic sur une carte catégorie : toggle si même, sinon ouvrir
  const handleCategoryClick = (category: string) => {
    if (selectedCategory === category) {
      setExpanded(!expanded)
    } else {
      setSelectedCategory(category)
      setExpanded(true)
    }
  }

  // Fetch documents with 60s cache
  const { data: documentsData, refresh: fetchDocuments } = useNotionData<{ documents: Link[] }>(
    "documents",
    config?.notionDatabases?.documents
  )
  const customLinks = documentsData?.documents || []
  const documentsLoaded = !!documentsData

  // Helper function to get link type info
  const getLinkTypeInfo = (type: string) => {
    const linkType = LINK_TYPES.find(t => t.label === type || t.value === type)
    return linkType || { icon: "", color: "bg-muted text-muted-foreground", label: type }
  }

  // Helper function to extract domain from URL
  const getDomainFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  // Sync configured links to documents database on initialization
  useEffect(() => {
    const syncConfiguredLinks = async () => {
      // Only sync once after documents have been loaded
      if (!config?.notionDatabases?.documents || !documentsLoaded || syncAttempted) return

      console.log("[GuidesDocsSection] Starting sync check with", customLinks.length, "existing documents")

      // Check if there are any configured links to sync
      const hasDrive = config?.googleDrive?.folderId && config?.googleDrive.folderId.trim() !== ""
      const hasGitHub = config?.github?.owner && config?.github.owner.trim() !== "" &&
                       config?.github?.repo && config?.github.repo.trim() !== ""

      if (!hasDrive && !hasGitHub) {
        setSyncAttempted(true)
        return
      }

      try {
        let needsRefresh = false

        // Check and sync Google Drive link
        if (hasDrive && config?.googleDrive) {
          // Check by URL to avoid duplicates
          const driveUrl = `https://drive.google.com/drive/folders/${config?.googleDrive.folderId}`
          const existingDriveDoc = customLinks.find(link =>
            link.url === driveUrl || link.type === "Google Drive"
          )
          if (!existingDriveDoc) {
            console.log("[GuidesDocsSection] Syncing Drive link to documents database")
            await fetch("/api/notion/documents", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                databaseId: config?.notionDatabases.documents,
                title: config?.googleDrive.folderName || "Google Drive Folder",
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

        // Check and sync GitHub repository link
        if (hasGitHub && config?.github) {
          // Check by URL to avoid duplicates
          const githubUrl = `https://github.com/${config?.github.owner}/${config?.github.repo}`
          const existingGitHubDoc = customLinks.find(link =>
            link.url === githubUrl || link.type === "GitHub"
          )
          if (!existingGitHubDoc) {
            console.log("[GuidesDocsSection] Syncing GitHub link to documents database")
            await fetch("/api/notion/documents", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                databaseId: config?.notionDatabases.documents,
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
  }, [documentsLoaded, syncAttempted, config?.notionDatabases?.documents, config?.googleDrive?.folderId, config?.github?.owner, config?.github?.repo, customLinks])

  const handleOpenAdd = () => {
    setEditingId(null)
    setEditingConfigType(null)
    setFormData({ title: "", url: "", description: "", type: "other", category: "other" })
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
      type: typeValue,
      category: link.category || "other"
    })
    setOpen(true)
  }

  const handleEditConfigLink = (type: "drive" | "notion" | "github") => {
    setEditingId(null)
    setEditingConfigType(type)

    if (type === "drive") {
      setFormData({
        title: config?.googleDrive?.folderName || "Google Drive Folder",
        url: config?.googleDrive?.folderId || "",
        description: "Main project documentation",
        type: "drive",
        category: "document"
      })
    } else if (type === "github") {
      setFormData({
        title: "GitHub Repository",
        url: `${config?.github?.owner || ""}/${config?.github?.repo || ""}`,
        description: "Source code repository",
        type: "github",
        category: "tool"
      })
    }

    setOpen(true)
  }

  const handleSaveLink = async () => {
    if (!formData.title || !formData.url || !config) return

    // Config links (Drive, GitHub) cannot be edited in new architecture, they come from .env
    // This function now only handles custom link documents

    // Map category internal value to Notion-friendly label
    const getCategoryNotionLabel = (value: string): string => {
      const cat = CATEGORIES.find(c => c.value === value)
      return cat?.notionLabel || "Other Links"
    }

    // Handle custom links with Notion sync
    if (!config?.notionDatabases?.documents) {
      alert("Documents database not configured in Project Settings")
      return
    }

    // Sync with Notion
    try {
      const typeLabel = LINK_TYPES.find(t => t.value === formData.type)?.label || "Other"
      const categoryLabel = getCategoryNotionLabel(formData.category)

      console.log("[GuidesDocsSection] Saving link with category:", formData.category, "→", categoryLabel)

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
            category: categoryLabel,
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
            databaseId: config?.notionDatabases.documents,
            title: formData.title,
            url: formData.url,
            description: formData.description,
            type: typeLabel,
            category: categoryLabel,
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
    setFormData({ title: "", url: "", description: "", type: "other", category: "other" })
    setEditingId(null)
    setEditingConfigType(null)
  }

  const handleViewLink = (link: Link) => {
    if (!link.url || link.url === "Not configured") return

    // Check if URL can be previewed in-app (Notion, Google Docs, Drive)
    if (canPreviewUrl(link.url)) {
      setPreviewLink(link)
      setPreviewOpen(true)
    } else {
      // Open externally for other URLs
      window.open(link.url, "_blank")
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce lien ?")) return

    if (!config?.notionDatabases?.documents) {
      alert("Documents database not configured in Project Settings")
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

  // Config links (Drive, GitHub) are read-only from .env in new architecture
  // No delete functionality needed for config links

  // Collect all links for keyMetrics
  const getAllLinks = (): Link[] => {
    const allLinks: Link[] = []

    if (config?.googleDrive?.folderId && config?.googleDrive.folderId.trim() !== "") {
      allLinks.push({
        id: "drive-config",
        title: config?.googleDrive?.folderName || "Google Drive",
        description: "Main project documentation",
        url: `https://drive.google.com/drive/folders/${config?.googleDrive?.folderId}`,
        type: "Drive",
        category: "document"
      })
    }

    if (config?.projectPageId) {
      allLinks.push({
        id: "notion-config",
        title: "Project Page",
        description: "Main project Notion page",
        url: `https://notion.so/${config?.projectPageId?.replace(/-/g, "")}`,
        type: "Notion",
        category: "database"
      })
    }

    if (config?.github?.owner && config?.github.owner.trim() !== "" && config?.github?.repo && config?.github.repo.trim() !== "") {
      allLinks.push({
        id: "github-config",
        title: "GitHub Repo",
        description: "Source code repository",
        url: `https://github.com/${config?.github?.owner}/${config?.github?.repo}`,
        type: "GitHub",
        category: "tool"
      })
    }

    allLinks.push(...customLinks)
    return allLinks
  }

  const allLinks = getAllLinks()
  const linksByCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat.value] = allLinks.filter(link => (link.category || "other") === cat.value)
    return acc
  }, {} as Record<string, Link[]>)

  // Get filtered links based on selection
  const getFilteredLinks = () => {
    if (selectedCategory === "all") {
      return allLinks
    }
    return linksByCategory[selectedCategory] || []
  }

  const keyMetrics = allLinks.length > 0 ? (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
      {CATEGORIES.map((cat) => {
        const count = linksByCategory[cat.value]?.length || 0
        const isSelected = selectedCategory === cat.value

        return (
          <button
            key={cat.value}
            onClick={() => handleCategoryClick(cat.value)}
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
              {cat.label}
            </div>
          </button>
        )
      })}
    </div>
  ) : (
    <div className="text-center p-2 rounded-lg bg-muted/50 border border-dashed">
      <p className="text-sm text-muted-foreground">No links yet</p>
    </div>
  )

  const filteredLinks = getFilteredLinks()
  const selectedCategoryInfo = CATEGORIES.find(c => c.value === selectedCategory)

  const detailedContent = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">
          {selectedCategoryInfo?.label} ({filteredLinks.length})
        </h4>
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
            <div className="grid gap-2 py-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  disabled={!!editingConfigType}
                >
                  <SelectTrigger id="type">
                    {formData.type ? (
                      <span className="flex items-center gap-2">
                        <span>{LINK_TYPES.find(t => t.value === formData.type)?.icon}</span>
                        <span>{LINK_TYPES.find(t => t.value === formData.type)?.label}</span>
                      </span>
                    ) : (
                      <SelectValue placeholder="Select link type" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {LINK_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </span>
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

      {filteredLinks.length === 0 ? (
        <div className="p-3 border rounded-lg text-center border-dashed">
          <p className="text-sm text-muted-foreground">
            No links in this category. Click &ldquo;Add Link&rdquo; to add one.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="p-3 space-y-2">
            {filteredLinks.map((link) => {
              const isConfigLink = link.id.endsWith("-config")
              const typeInfo = getLinkTypeInfo(link.type)
              const domain = getDomainFromUrl(link.url)

              return (
                <div
                  key={link.id}
                  className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border cursor-pointer"
                  onClick={() => handleViewLink(link)}
                >
                  <div className={`text-xs flex-shrink-0 p-1.5 rounded ${typeInfo.color}`}>
                    {typeInfo.label.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium truncate">{link.title}</h5>
                    <p className="text-xs text-muted-foreground truncate">{link.description || domain}</p>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono hidden sm:block flex-shrink-0">
                    {domain}
                  </span>
                  <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(link.url, "_blank")}
                      className="h-8 w-8 p-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    {isConfigLink && link.id !== "notion-config" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditConfigLink(link.id === "drive-config" ? "drive" : "github")}
                        className="h-8 w-8 p-0 text-xs"
                      >
                        Edit
                      </Button>
                    )}
                    {!isConfigLink && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(link)}
                          className="h-8 w-8 p-0 text-xs"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteLink(link.id)}
                          className="h-8 w-8 p-0 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Del
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      <PageSection
        title="Guides and Docs"
        description="Important links and references for project resources"
        icon=""
        keyMetrics={keyMetrics}
        detailedContent={detailedContent}
        expanded={expanded}
        onExpandedChange={setExpanded}
      />

      {/* Preview Modal for Notion, Google Docs, Drive */}
      {previewLink && (
        <DocumentPreviewModal
          isOpen={previewOpen}
          onClose={() => {
            setPreviewOpen(false)
            setPreviewLink(null)
          }}
          title={previewLink.title}
          url={previewLink.url}
          type={previewLink.type}
        />
      )}
    </>
  )
}
