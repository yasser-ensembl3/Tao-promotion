"use client"

import { useState, useEffect } from "react"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProjectSettingsDialog } from "@/components/settings/project-settings-dialog"
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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useProjectConfig } from "@/contexts/project-config-context"
import { RefreshCw } from "lucide-react"

interface NotionProject {
  id: string
  url: string
  properties: {
    Name?: string
    [key: string]: any
  }
}

export function DashboardHeader() {
  const { data: session } = useSession()
  const { config, updateConfig } = useProjectConfig()
  const [projects, setProjects] = useState<NotionProject[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")

  // Charger les projets depuis Notion
  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch("/api/notion/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects)

        // Sélectionner le premier projet par défaut si aucun n'est sélectionné
        if (data.projects.length > 0 && !selectedProject) {
          const firstProject = data.projects[0]
          setSelectedProject(firstProject.id)

          // Charger les databases du premier projet
          try {
            const dbResponse = await fetch(`/api/notion/project-databases?projectPageId=${firstProject.id}`)
            if (dbResponse.ok) {
              const dbData = await dbResponse.json()
              updateConfig({
                projectName: firstProject.properties.Name || "Projet sans nom",
                projectPageId: firstProject.id,
                notionDatabases: dbData.databases,
              })
            }
          } catch (error) {
            console.error("Error loading first project databases:", error)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleProjectChange = async (value: string) => {
    if (value === "new") {
      setIsNewProjectDialogOpen(true)
    } else {
      setSelectedProject(value)

      // Mettre à jour le config avec le nom du projet sélectionné
      const project = projects.find(p => p.id === value)
      if (project) {
        // Charger les databases du projet
        try {
          const response = await fetch(`/api/notion/project-databases?projectPageId=${value}`)
          if (response.ok) {
            const data = await response.json()
            updateConfig({
              projectName: project.properties.Name || "Projet sans nom",
              projectPageId: value,
              notionDatabases: data.databases,
            })
          } else {
            // Si pas de databases trouvées, mettre à jour seulement le nom
            updateConfig({
              projectName: project.properties.Name || "Projet sans nom",
              projectPageId: value,
            })
          }
        } catch (error) {
          console.error("Error loading project databases:", error)
          updateConfig({
            projectName: project.properties.Name || "Projet sans nom",
            projectPageId: value,
          })
        }
      }
    }
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/notion/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName: newProjectName,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        // Fermer le dialog immédiatement
        setIsNewProjectDialogOpen(false)
        setNewProjectName("")

        // Recharger la liste des projets
        await fetchProjects()

        // Sélectionner le nouveau projet
        setSelectedProject(data.project.id)

        // Mettre à jour le config avec le nom du projet et les databases créées
        updateConfig({
          projectName: newProjectName,
          projectPageId: data.project.projectPageId,
          notionDatabases: data.project.databases,
        })
      } else {
        console.error("Failed to create project")
      }
    } catch (error) {
      console.error("Error creating project:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">MiniVault Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Welcome back, {session?.user?.name || "User"}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span>Connected: {session?.provider === "google" ? "Google" : "GitHub"}</span>
                <span>•</span>
                <button
                  onClick={() => signOut()}
                  className="hover:underline"
                >
                  Sign Out
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedProject} onValueChange={handleProjectChange}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.properties.Name || "Projet sans nom"}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">+ Nouveau projet</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchProjects}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
              <ProjectSettingsDialog />
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau projet</DialogTitle>
            <DialogDescription>
              Le projet sera créé dans votre base Notion MiniVault Projects
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Nom du projet</Label>
              <Input
                id="project-name"
                placeholder="Mon nouveau projet"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) {
                    handleCreateProject()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewProjectDialogOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button onClick={handleCreateProject} disabled={isLoading || !newProjectName.trim()}>
              {isLoading ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}