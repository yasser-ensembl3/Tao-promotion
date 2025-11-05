"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { ProjectConfig, DEFAULT_PROJECT_CONFIG } from "@/types/project-config"

interface ProjectConfigContextType {
  config: ProjectConfig
  updateConfig: (config: Partial<ProjectConfig>) => void
  isLoaded: boolean
}

const ProjectConfigContext = createContext<ProjectConfigContextType | undefined>(undefined)

export function ProjectConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ProjectConfig>(DEFAULT_PROJECT_CONFIG)
  const [isLoaded, setIsLoaded] = useState(true)

  // Update configuration in memory only
  const updateConfig = (updates: Partial<ProjectConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates }
      return newConfig
    })
  }

  return (
    <ProjectConfigContext.Provider value={{ config, updateConfig, isLoaded }}>
      {children}
    </ProjectConfigContext.Provider>
  )
}

export function useProjectConfig() {
  const context = useContext(ProjectConfigContext)
  if (context === undefined) {
    throw new Error("useProjectConfig must be used within a ProjectConfigProvider")
  }
  return context
}
