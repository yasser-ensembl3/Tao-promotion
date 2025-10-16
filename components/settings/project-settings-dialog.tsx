"use client"

import { useState } from "react"
import { Settings } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useProjectConfig } from "@/contexts/project-config-context"

export function ProjectSettingsDialog() {
  const { config, updateConfig } = useProjectConfig()
  const [isOpen, setIsOpen] = useState(false)

  // Local form state
  const [formData, setFormData] = useState({
    projectName: config.projectName,
    githubOwner: config.github?.owner || "",
    githubRepo: config.github?.repo || "",
    driveFolderId: config.googleDrive?.folderId || "",
    driveFolderName: config.googleDrive?.folderName || "",
    notionDatabaseId: config.notion?.databaseId || "",
    notionDatabaseName: config.notion?.databaseName || "",
  })

  const handleSave = () => {
    updateConfig({
      projectName: formData.projectName,
      github: formData.githubOwner && formData.githubRepo
        ? { owner: formData.githubOwner, repo: formData.githubRepo }
        : undefined,
      googleDrive: formData.driveFolderId
        ? { folderId: formData.driveFolderId, folderName: formData.driveFolderName }
        : undefined,
      notion: formData.notionDatabaseId
        ? { databaseId: formData.notionDatabaseId, databaseName: formData.notionDatabaseName }
        : undefined,
    })
    setIsOpen(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Reset form data when opening
      setFormData({
        projectName: config.projectName,
        githubOwner: config.github?.owner || "",
        githubRepo: config.github?.repo || "",
        driveFolderId: config.googleDrive?.folderId || "",
        driveFolderName: config.googleDrive?.folderName || "",
        notionDatabaseId: config.notion?.databaseId || "",
        notionDatabaseName: config.notion?.databaseName || "",
      })
    }
    setIsOpen(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Project Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Project Configuration</DialogTitle>
          <DialogDescription>
            Configure your project resources and integrations. These settings help MiniVault connect to your GitHub repo, Google Drive, and Notion.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              placeholder="My Awesome Project"
              value={formData.projectName}
              onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
            />
          </div>

          {/* GitHub Configuration */}
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-2">GitHub Repository</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Connect to a GitHub repository to track issues, PRs, and commits
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="githubOwner">Owner/Organization</Label>
                <Input
                  id="githubOwner"
                  placeholder="octocat"
                  value={formData.githubOwner}
                  onChange={(e) => setFormData({ ...formData, githubOwner: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="githubRepo">Repository Name</Label>
                <Input
                  id="githubRepo"
                  placeholder="hello-world"
                  value={formData.githubRepo}
                  onChange={(e) => setFormData({ ...formData, githubRepo: e.target.value })}
                />
              </div>
            </div>
            {formData.githubOwner && formData.githubRepo && (
              <p className="text-xs text-muted-foreground">
                Will connect to: github.com/{formData.githubOwner}/{formData.githubRepo}
              </p>
            )}
          </div>

          {/* Google Drive Configuration */}
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-2">Google Drive Folder</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Link a Google Drive folder containing project documentation. Find the folder ID in the URL: drive.google.com/drive/folders/[FOLDER_ID]
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="driveFolderId">Folder ID</Label>
              <Input
                id="driveFolderId"
                placeholder="1a2b3c4d5e6f7g8h9i0j"
                value={formData.driveFolderId}
                onChange={(e) => setFormData({ ...formData, driveFolderId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driveFolderName">Folder Name (optional)</Label>
              <Input
                id="driveFolderName"
                placeholder="Project Docs"
                value={formData.driveFolderName}
                onChange={(e) => setFormData({ ...formData, driveFolderName: e.target.value })}
              />
            </div>
          </div>

          {/* Notion Configuration */}
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-2">Notion Database</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Connect a Notion database for tasks and project tracking. Find the database ID in the URL or use the database ID from your .env file
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notionDatabaseId">Database ID</Label>
              <Input
                id="notionDatabaseId"
                placeholder="28c58fe731b18014b9b4f0a6e0b6a576"
                value={formData.notionDatabaseId}
                onChange={(e) => setFormData({ ...formData, notionDatabaseId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notionDatabaseName">Database Name (optional)</Label>
              <Input
                id="notionDatabaseName"
                placeholder="Project Tasks"
                value={formData.notionDatabaseName}
                onChange={(e) => setFormData({ ...formData, notionDatabaseName: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
