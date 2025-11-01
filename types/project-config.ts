export interface ProjectConfig {
  projectName: string
  github?: {
    owner: string
    repo: string
  }
  googleDrive?: {
    folderId: string
    folderName?: string
  }
  notion?: {
    databaseId: string
    databaseName?: string
  }
  notionDatabases?: {
    tasks?: string
    goals?: string
    milestones?: string
    documents?: string
    feedback?: string
    metrics?: string
    sales?: string
    customMetrics?: string
  }
  projectPageId?: string
  customLinks?: {
    id: string
    title: string
    url: string
    description?: string
    category?: string
  }[]
  customMetrics?: {
    id: string
    name: string
    value: number | string
    date: string  // ISO date string
    description?: string
    color?: string
    icon?: string
  }[]
  weeklyReports?: {
    id: string
    date: string  // ISO date string
    content: string
    title?: string
  }[]
}

export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  projectName: "My Project"
}
