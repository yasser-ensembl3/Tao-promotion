"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { ProjectConfig, DEFAULT_PROJECT_CONFIG } from "@/types/project-config"

interface ProjectConfigContextType {
  config: ProjectConfig
  updateConfig: (config: Partial<ProjectConfig>) => void
  isLoaded: boolean
}

const ProjectConfigContext = createContext<ProjectConfigContextType | undefined>(undefined)

const STORAGE_KEY = "minivault_project_config"

export function ProjectConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ProjectConfig>(DEFAULT_PROJECT_CONFIG)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load configuration from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedConfig = JSON.parse(stored)
        setConfig({ ...DEFAULT_PROJECT_CONFIG, ...parsedConfig })
      }
    } catch (error) {
      console.error("[ProjectConfig] Failed to load configuration:", error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save configuration to localStorage whenever it changes
  const updateConfig = (updates: Partial<ProjectConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
      } catch (error) {
        console.error("[ProjectConfig] Failed to save configuration:", error)
      }
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
