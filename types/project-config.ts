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
  customLinks?: {
    id: string
    title: string
    url: string
    description?: string
    category?: string
  }[]
}

export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  projectName: "My Project"
}
