# MiniVault - Detailed Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Authentication System](#authentication-system)
4. [Data Flow & State Management](#data-flow--state-management)
5. [Dashboard System](#dashboard-system)
6. [Notion Integration](#notion-integration)
7. [API Routes](#api-routes)
8. [Component Patterns](#component-patterns)
9. [Adding New Features](#adding-new-features)
10. [Database Schema Patterns](#database-schema-patterns)

---

## Project Overview

MiniVault is a unified project management dashboard that brings together multiple productivity tools (Notion, Google Drive, Gmail, GitHub) into a single interface. It's built for small teams and solo entrepreneurs who need a centralized view of their project data.

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Authentication**: NextAuth.js v4
- **UI Components**: shadcn/ui (based on Radix UI)
- **Styling**: Tailwind CSS (Dark mode)
- **State Management**: React Context API + localStorage
- **API Integration**: Notion API, Google Drive API, GitHub API

### Key Features
- OAuth authentication with Google and GitHub
- Real-time data fetching from Notion databases
- Modular dashboard with collapsible sections
- Local storage fallback for offline functionality
- Project configuration management
- Custom metrics tracking
- Weekly report generation with AI
- User feedback collection

---

## Architecture Overview

### Directory Structure

```
/app
  /api                          # API routes (Next.js Route Handlers)
    /auth/[...nextauth]         # NextAuth.js authentication
    /notion                     # Notion API proxies
      /tasks, /goals, /milestones, /documents, /feedback, /sales
      /custom-metrics           # Custom metrics CRUD
      /duplicate-template       # Project template duplication
      /create-custom-metrics-db # Database creation
    /github/repo                # GitHub API proxy
    /drive/files                # Google Drive API proxy
  /auth/signin                  # Sign-in page
  layout.tsx                    # Root layout with providers
  page.tsx                      # Home page (main dashboard)
  globals.css                   # Global styles + CSS variables

/components
  /auth
    session-provider.tsx        # NextAuth SessionProvider wrapper
  /dashboard
    main-dashboard.tsx          # Main orchestrator
    header.tsx                  # Dashboard header with settings
    dashboard-section.tsx       # Reusable collapsible section wrapper
    overview-section.tsx        # Project overview
    metrics-section.tsx         # Metrics aggregation + custom metrics
    user-feedback-section.tsx   # User feedback collection
    reports-section.tsx         # Weekly reports with AI
    guides-docs-section.tsx     # Documentation links
    [other sections]
  /settings
    project-settings-dialog.tsx # Project configuration UI
  /ui                           # shadcn/ui primitives

/contexts
  project-config-context.tsx    # Global project configuration state

/lib
  auth.ts                       # NextAuth configuration
  utils.ts                      # Utilities (cn function)

/types
  next-auth.d.ts                # NextAuth type extensions
  project-config.ts             # ProjectConfig interface
```

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           React Components (Client)                   │   │
│  │  - Use Context for config (localStorage)             │   │
│  │  - Use Session for auth tokens                       │   │
│  │  - Fetch from API routes for external data           │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↕                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Next.js API Routes (Server-Side)             │   │
│  │  - Validate authentication                           │   │
│  │  - Proxy requests to external APIs                   │   │
│  │  - Transform data for frontend                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↕
        ┌──────────────────────────────────────┐
        │      External APIs                    │
        │  - Notion API (databases, pages)     │
        │  - Google Drive API (files)          │
        │  - GitHub API (repos, commits)       │
        └──────────────────────────────────────┘
```

---

## Authentication System

### How Authentication Works (Step by Step)

#### 1. NextAuth Configuration (`lib/auth.ts`)

```typescript
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/drive.readonly",
            "https://www.googleapis.com/auth/documents.readonly"
          ].join(" ")
        }
      }
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo"
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Store access token in JWT when user signs in
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.provider = account.provider
      }
      return token
    },
    async session({ session, token }) {
      // Expose tokens to client session
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      session.provider = token.provider
      return session
    }
  }
}
```

**What happens here:**
1. Two OAuth providers are configured (Google and GitHub)
2. Extended scopes are requested (Gmail, Drive, GitHub repos)
3. JWT callback stores the access token when user authenticates
4. Session callback exposes the token to the client-side session object

#### 2. Session Type Extension (`types/next-auth.d.ts`)

```typescript
declare module "next-auth" {
  interface Session {
    accessToken?: string
    refreshToken?: string
    provider?: string
  }
}
```

This extends the default NextAuth session type to include our custom fields.

#### 3. Authentication Route (`app/api/auth/[...nextauth]/route.ts`)

```typescript
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

This creates the API endpoints for NextAuth at `/api/auth/*`.

#### 4. Session Provider (`components/auth/session-provider.tsx`)

```typescript
"use client"
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
```

Wraps the app to provide session context to all components.

#### 5. Root Layout Integration (`app/layout.tsx`)

```typescript
<SessionProvider>
  <ProjectConfigProvider>
    {children}
  </ProjectConfigProvider>
</SessionProvider>
```

Both providers wrap the entire application, making session and config available everywhere.

#### 6. Protected Components

```typescript
// In main-dashboard.tsx
const { data: session, status } = useSession()

if (status === "loading") {
  return <div>Loading...</div>
}

if (status === "unauthenticated") {
  router.push("/auth/signin")
  return null
}
```

Components check session status and redirect if not authenticated.

#### 7. Using Tokens in API Routes

```typescript
// In API routes (e.g., /api/github/repo/route.ts)
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Use session.accessToken to make authenticated API calls
  const response = await fetch("https://api.github.com/...", {
    headers: {
      Authorization: `Bearer ${session.accessToken}`
    }
  })
}
```

---

## Data Flow & State Management

### 1. Project Configuration System

MiniVault uses a **Notion-first configuration system** with minimal localStorage usage for project settings.

#### Configuration Context (`contexts/project-config-context.tsx`)

```typescript
interface ProjectConfig {
  projectName: string
  github?: { owner: string; repo: string }
  googleDrive?: { folderId: string; folderName?: string }
  notion?: { databaseId: string; databaseName?: string }
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
  customLinks?: CustomLink[]
  customMetrics?: CustomMetric[]
  weeklyReports?: WeeklyReport[]
}
```

**How it works:**

1. **Initial Load**: On app load, user selects a project from Notion
2. **Database IDs**: All database IDs are loaded from Notion via `/api/notion/project-databases`
3. **localStorage Usage**: Only stores the last selected project ID (`minivault_last_project_id`)
4. **In-Memory State**: Configuration is kept in React Context (not persisted)
5. **Usage**: Any component can access via `useProjectConfig()` hook

```typescript
const { config, updateConfig, isLoaded } = useProjectConfig()

// Update configuration
updateConfig({
  github: { owner: "username", repo: "my-repo" }
})

// Access configuration
const tasksDbId = config.notionDatabases?.tasks
```

### 2. Notion-Only Pattern

All sections are **Notion-backed only**. There is no local-only fallback mode:

#### Example: User Feedback Section

```typescript
const handleSave = async () => {
  if (!config.notionDatabases?.feedback) {
    alert("Feedback database not configured in Project Settings")
    return
  }

  if (editingId) {
    // UPDATE: Patch existing entry in Notion
    const response = await fetch('/api/notion/feedback', {
      method: 'PATCH',
      body: JSON.stringify({
        pageId: editingId,
        ...formData
      })
    })
  } else {
    // CREATE: Create new entry in Notion
    const response = await fetch('/api/notion/feedback', {
      method: 'POST',
      body: JSON.stringify({
        databaseId: config.notionDatabases.feedback,
        ...formData
      })
    })
  }

  if (response.ok) {
    await fetchFeedbacks() // Refresh from Notion
  }
}

const handleDelete = async (feedbackId: string) => {
  // DELETE: Archive entry in Notion
  const response = await fetch(`/api/notion/feedback?pageId=${feedbackId}`, {
    method: 'DELETE'
  })

  if (response.ok) {
    await fetchFeedbacks() // Refresh from Notion
  }
}
```

**Why this pattern?**
- All data lives in Notion (single source of truth)
- Full CRUD operations (Create, Read, Update, Delete)
- Bidirectional sync: changes in app reflect in Notion instantly
- No data duplication or sync conflicts

### 3. Data Fetching Pattern

All Notion data fetching follows this pattern:

```typescript
const fetchData = async () => {
  if (!config.notionDatabases?.tasks) {
    return // Exit if not configured
  }

  setLoading(true)
  try {
    const response = await fetch(
      `/api/notion/tasks?databaseId=${config.notionDatabases.tasks}`
    )

    if (response.ok) {
      const data = await response.json()
      setTasks(data.tasks || [])
    } else {
      console.error("Failed to fetch tasks")
    }
  } catch (error) {
    console.error("Error fetching tasks:", error)
  } finally {
    setLoading(false)
  }
}

useEffect(() => {
  if (config.notionDatabases?.tasks) {
    fetchData()
  }
}, [config.notionDatabases?.tasks])
```

**Key points:**
- Only fetch if database is configured
- Loading states for UX
- Error handling with fallbacks
- Re-fetch when config changes

---

## Dashboard System

### Dashboard Section Pattern

The dashboard uses a **consistent collapsible section pattern** for all features.

#### Base Component: `DashboardSection`

Every section uses this wrapper component:

```typescript
<DashboardSection
  title="User Feedback"
  description="Monitor and respond to user feedback and requests"
  icon="💬"
  keyMetrics={keyMetrics}      // Always visible (collapsed view)
  detailedContent={detailedContent}  // Hidden when collapsed
/>
```

**How it works internally:**

```typescript
export function DashboardSection({
  title,
  description,
  icon,
  keyMetrics,
  detailedContent
}: DashboardSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <Card>
      <CardHeader onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{icon} {title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {isExpanded ? <ChevronUp /> : <ChevronDown />}
        </div>
      </CardHeader>

      <CardContent>
        {/* Key metrics always shown */}
        {keyMetrics}

        {/* Detailed content only when expanded */}
        {isExpanded && detailedContent}
      </CardContent>
    </Card>
  )
}
```

#### Creating a New Section

1. **Create the section file** (`components/dashboard/my-section.tsx`)
2. **Define data structure**
3. **Create keyMetrics** (summary view)
4. **Create detailedContent** (expanded view)
5. **Wrap with DashboardSection**

Example:

```typescript
export function MySection() {
  const { config } = useProjectConfig()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  // Key Metrics (always visible)
  const keyMetrics = (
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
        <div className="text-2xl font-bold text-blue-700">{data.length}</div>
        <div className="text-sm text-blue-600">Total Items</div>
      </div>
      {/* More metrics... */}
    </div>
  )

  // Detailed Content (expanded view)
  const detailedContent = (
    <div className="space-y-4">
      {/* Detailed view with actions, lists, etc. */}
    </div>
  )

  return (
    <DashboardSection
      title="My Feature"
      description="Description of the feature"
      icon="🎯"
      keyMetrics={keyMetrics}
      detailedContent={detailedContent}
    />
  )
}
```

### Main Dashboard Orchestration

`components/dashboard/main-dashboard.tsx` brings everything together:

```typescript
export function MainDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Authentication check
  if (status === "loading") return <LoadingSpinner />
  if (status === "unauthenticated") {
    router.push("/auth/signin")
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto p-6 space-y-6">
        <OverviewSection />
        <MetricsSection />
        <UserFeedbackSection />
        <ReportsSection />
        <GuidesDocsSection />
        {/* Add more sections as needed */}
      </main>
    </div>
  )
}
```

---

## Notion Integration

### How Notion Integration Works

#### 1. Authentication

Two types of Notion authentication are used:

**A. Internal Integration Token** (for server-side operations)
- Set in `.env.local` as `NOTION_TOKEN`
- Used for template duplication and database creation
- Has full access to workspace

**B. User's Notion databases** (for data operations)
- Users provide database IDs via Project Settings
- App queries these databases on behalf of the user
- Uses the same internal integration token (user must share databases with integration)

#### 2. Database ID Configuration

Users configure Notion databases in two ways:

**A. Project Settings Dialog**
```typescript
// User enters database IDs manually
updateConfig({
  notionDatabases: {
    tasks: "abc123...",
    goals: "def456...",
    // etc.
  }
})
```

**B. Template Duplication** (automatic)
```typescript
// When creating a new project, all databases are created and IDs are stored
const response = await fetch('/api/notion/duplicate-template', {
  method: 'POST',
  body: JSON.stringify({ projectName: "My Project" })
})

const { databases, projectPageId } = await response.json()
// databases = { tasks: "...", goals: "...", customMetrics: "...", etc. }

updateConfig({
  notionDatabases: databases,
  projectPageId
})
```

#### 3. API Route Pattern

All Notion API routes follow this pattern:

```typescript
// /app/api/notion/tasks/route.ts

export async function GET(request: NextRequest) {
  const notionToken = process.env.NOTION_TOKEN

  if (!notionToken) {
    return NextResponse.json(
      { error: "NOTION_TOKEN not configured" },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const databaseId = searchParams.get("databaseId")

  if (!databaseId) {
    return NextResponse.json(
      { error: "Missing databaseId parameter" },
      { status: 400 }
    )
  }

  // Clean database ID (remove hyphens)
  const cleanDatabaseId = databaseId.replace(/-/g, "")

  // Query Notion API
  const response = await fetch(
    `https://api.notion.com/v1/databases/${cleanDatabaseId}/query`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        page_size: 100,
        sorts: [{ property: "Date", direction: "descending" }]
      }),
      cache: 'no-store'
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Notion API error`)
  }

  const data = await response.json()

  // Transform Notion data to app format
  const tasks = data.results.map((page: any) => {
    return transformNotionPage(page)
  })

  return NextResponse.json({ tasks })
}
```

#### 4. Property Mapping Pattern

Notion properties are accessed with fallbacks for flexibility:

```typescript
function transformNotionPage(page: any) {
  const properties = page.properties

  // Try multiple property names (handles different schemas)
  const titleProp = properties.Name || properties.name || properties.Title
  const title = titleProp?.title?.[0]?.plain_text || "Untitled"

  const dateProp = properties.Date || properties.date || properties["Due Date"]
  const date = dateProp?.date?.start || page.created_time

  const statusProp = properties.Status || properties.status
  const status = statusProp?.select?.name || statusProp?.status?.name || "Unknown"

  return {
    id: page.id,
    title,
    date,
    status,
    url: page.url
  }
}
```

**Why this pattern?**
- Different Notion databases may use different property names
- Handles "Title" vs "Name", "Status" vs "State", etc.
- Provides sensible defaults

#### 5. Creating Notion Entries

POST endpoints follow this pattern:

```typescript
export async function POST(request: NextRequest) {
  const notionToken = process.env.NOTION_TOKEN
  const body = await request.json()
  const { databaseId, title, date, status } = body

  if (!databaseId || !title) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    )
  }

  const cleanDatabaseId = databaseId.replace(/-/g, "")

  // Build properties object
  const properties: any = {
    Name: {
      title: [{ text: { content: title } }]
    },
    Status: {
      select: { name: status }
    }
  }

  if (date) {
    properties.Date = {
      date: { start: date }
    }
  }

  // Create page in Notion
  const response = await fetch(
    `https://api.notion.com/v1/pages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        parent: {
          type: "database_id",
          database_id: cleanDatabaseId
        },
        properties
      })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    return NextResponse.json(
      { error: error.message || "Failed to create entry" },
      { status: response.status }
    )
  }

  const newPage = await response.json()

  return NextResponse.json({
    success: true,
    page: {
      id: newPage.id,
      url: newPage.url
    }
  })
}
```

---

## API Routes

### Complete API Route Reference

#### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js endpoints

#### Notion - Tasks
- `GET /api/notion/tasks?databaseId=xxx` - Fetch tasks from database
- `POST /api/notion/tasks` - Create new task
  ```json
  {
    "databaseId": "abc123",
    "title": "Task name",
    "status": "In Progress",
    "dueDate": "2024-01-15"
  }
  ```

#### Notion - Goals
- `GET /api/notion/goals?databaseId=xxx` - Fetch goals
- `POST /api/notion/goals` - Create new goal

#### Notion - Milestones
- `GET /api/notion/milestones?databaseId=xxx` - Fetch milestones
- `POST /api/notion/milestones` - Create new milestone

#### Notion - Documents
- `GET /api/notion/documents?databaseId=xxx` - Fetch documents

#### Notion - Feedback
- `GET /api/notion/feedback?databaseId=xxx` - Fetch user feedback
- `POST /api/notion/feedback` - Create new feedback
  ```json
  {
    "databaseId": "abc123",
    "title": "Feature request",
    "date": "2024-01-15",
    "feedback": "Would love to see dark mode",
    "userName": "John Doe"
  }
  ```
- `PATCH /api/notion/feedback` - Update existing feedback
  ```json
  {
    "pageId": "page-id-xxx",
    "title": "Updated title",
    "date": "2024-01-16",
    "feedback": "Updated feedback text",
    "userName": "John Doe"
  }
  ```
- `DELETE /api/notion/feedback?pageId=xxx` - Archive (soft delete) feedback

#### Notion - Custom Metrics
- `GET /api/notion/custom-metrics?databaseId=xxx` - Fetch custom metrics
- `POST /api/notion/custom-metrics` - Create new metric entry
  ```json
  {
    "databaseId": "abc123",
    "name": "Subscribers",
    "value": "150",
    "date": "2024-01-15",
    "description": "Newsletter subscribers",
    "color": "blue",
    "icon": "📊"
  }
  ```

#### Notion - Sales
- `GET /api/notion/sales?databaseId=xxx` - Fetch sales data
- `POST /api/notion/sales` - Create new sale

#### Notion - Project Management
- `POST /api/notion/duplicate-template` - Create new project from template
  ```json
  {
    "projectName": "My New Project"
  }
  ```
  Returns:
  ```json
  {
    "success": true,
    "projectPageId": "page-id-xxx",
    "databases": {
      "tasks": "db-id-1",
      "goals": "db-id-2",
      "milestones": "db-id-3",
      "documents": "db-id-4",
      "feedback": "db-id-5",
      "metrics": "db-id-6",
      "sales": "db-id-7",
      "customMetrics": "db-id-8"
    }
  }
  ```

- `POST /api/notion/create-custom-metrics-db` - Create Custom Metrics database
  ```json
  {
    "projectPageId": "page-id-xxx",
    "title": "Custom Metrics"
  }
  ```

#### GitHub
- `GET /api/github/repo?owner=xxx&repo=yyy` - Fetch repository data
  Returns: repo metadata, recent commits, open issues, open PRs

#### Google Drive
- `GET /api/drive/files?folderId=xxx` - Fetch files from folder
  Returns: folder metadata + array of files

---

## Component Patterns

### 1. Collapsible Dropdown Pattern

Used in all detail views (Feedback, Reports, Metrics):

```typescript
const [isOpen, setIsOpen] = useState(true)

<div className="border rounded-lg">
  {/* Header - always visible, clickable */}
  <div
    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
    onClick={() => setIsOpen(!isOpen)}
  >
    <div className="flex items-center gap-2">
      <h4 className="font-semibold">Section Title</h4>
      <span className="text-xs text-muted-foreground">
        ({items.length} items)
      </span>
    </div>

    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={(e) => {
          e.stopPropagation()  // Don't trigger collapse
          handleAction()
        }}
      >
        Action Button
      </Button>
      {isOpen ? <ChevronUp /> : <ChevronDown />}
    </div>
  </div>

  {/* Content - only shown when open */}
  {isOpen && (
    <div className="p-4 pt-0 space-y-4">
      {/* Detailed content here */}
    </div>
  )}
</div>
```

**Key points:**
- Header is always clickable to toggle
- Action buttons use `e.stopPropagation()` to prevent collapse
- Chevron icon indicates state
- Smooth transitions with Tailwind classes

### 2. Dialog Form Pattern

Used for Add/Edit operations:

```typescript
const [isOpen, setIsOpen] = useState(false)
const [editingId, setEditingId] = useState<string | null>(null)
const [formData, setFormData] = useState({
  title: "",
  date: new Date().toISOString().split('T')[0],
  // other fields
})

const handleOpenAdd = () => {
  setEditingId(null)
  setFormData({ /* reset to defaults */ })
  setIsOpen(true)
}

const handleOpenEdit = (item: Item) => {
  setEditingId(item.id)
  setFormData({
    title: item.title,
    date: item.date,
    // populate from item
  })
  setIsOpen(true)
}

const handleSave = async () => {
  // Validation
  if (!formData.title) {
    alert("Title is required")
    return
  }

  if (editingId) {
    // Update existing item
  } else {
    // Create new item
  }

  setIsOpen(false)
  setFormData({ /* reset */ })
  setEditingId(null)
}

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>
        {editingId ? "Edit Item" : "Add New Item"}
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>
      {/* More fields */}
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSave}>
        {editingId ? "Save Changes" : "Add Item"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 3. Loading States Pattern

```typescript
const [loading, setLoading] = useState(false)

const fetchData = async () => {
  setLoading(true)
  try {
    // Fetch operation
  } catch (error) {
    console.error("Error:", error)
  } finally {
    setLoading(false)  // Always reset loading
  }
}

// In UI
<Button onClick={fetchData} disabled={loading}>
  {loading ? "Loading..." : "Fetch Data"}
</Button>
```

### 4. Refresh Button Pattern

```typescript
<Button
  size="sm"
  onClick={(e) => {
    e.stopPropagation()  // Don't collapse parent
    fetchData()
  }}
  disabled={loading}
>
  {loading ? "Refreshing..." : "Refresh"}
</Button>
```

---

## Adding New Features

### Step-by-Step: Adding a New Notion-Backed Section

Let's add a "Team Members" section as an example.

#### Step 1: Create Notion Database Schema

First, understand what properties your Notion database will have:
- Name (title)
- Role (select)
- Email (email or text)
- Start Date (date)
- Photo (file)

#### Step 2: Create API Route

Create `/app/api/notion/team/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const notionToken = process.env.NOTION_TOKEN

    if (!notionToken) {
      return NextResponse.json(
        { error: "NOTION_TOKEN not configured" },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const databaseId = searchParams.get("databaseId")

    if (!databaseId) {
      return NextResponse.json(
        { error: "Missing databaseId parameter" },
        { status: 400 }
      )
    }

    const cleanDatabaseId = databaseId.replace(/-/g, "")

    // Query Notion
    const response = await fetch(
      `https://api.notion.com/v1/databases/${cleanDatabaseId}/query`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          page_size: 100,
          sorts: [{ property: "Start Date", direction: "descending" }]
        }),
        cache: 'no-store'
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || "Notion API error")
    }

    const data = await response.json()

    // Transform to app format
    const members = data.results.map((page: any) => {
      const properties = page.properties

      const nameProp = properties.Name || properties.name
      const name = nameProp?.title?.[0]?.plain_text || "Unnamed"

      const roleProp = properties.Role || properties.role
      const role = roleProp?.select?.name || "Member"

      const emailProp = properties.Email || properties.email
      const email = emailProp?.email || emailProp?.rich_text?.[0]?.plain_text || ""

      const dateProp = properties["Start Date"] || properties.startDate
      const startDate = dateProp?.date?.start || page.created_time

      return {
        id: page.id,
        name,
        role,
        email,
        startDate,
        url: page.url
      }
    })

    return NextResponse.json({ members })
  } catch (error: any) {
    console.error("[Notion Team API] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch team members" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const notionToken = process.env.NOTION_TOKEN

    if (!notionToken) {
      return NextResponse.json(
        { error: "Notion token not configured" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { databaseId, name, role, email, startDate } = body

    if (!databaseId || !name) {
      return NextResponse.json(
        { error: "Missing required fields: databaseId and name" },
        { status: 400 }
      )
    }

    const cleanDatabaseId = databaseId.replace(/-/g, "")

    const properties: any = {
      Name: {
        title: [{ text: { content: name } }]
      }
    }

    if (role) {
      properties.Role = {
        select: { name: role }
      }
    }

    if (email) {
      properties.Email = {
        email: email
      }
    }

    if (startDate) {
      properties["Start Date"] = {
        date: { start: startDate }
      }
    }

    const response = await fetch(
      `https://api.notion.com/v1/pages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          parent: {
            type: "database_id",
            database_id: cleanDatabaseId
          },
          properties
        })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.message || "Failed to create team member" },
        { status: response.status }
      )
    }

    const newMember = await response.json()

    return NextResponse.json({
      success: true,
      member: {
        id: newMember.id,
        url: newMember.url
      }
    })
  } catch (error: any) {
    console.error("[Notion Team API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

#### Step 3: Update Type Definitions

Update `/types/project-config.ts`:

```typescript
export interface ProjectConfig {
  // ... existing fields
  notionDatabases?: {
    // ... existing databases
    team?: string  // ADD THIS
  }
}
```

#### Step 4: Create Component

Create `/components/dashboard/team-section.tsx`:

```typescript
"use client"

import { useState, useEffect } from "react"
import { DashboardSection } from "./dashboard-section"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useProjectConfig } from "@/contexts/project-config-context"
import { ChevronDown, ChevronUp } from "lucide-react"

interface TeamMember {
  id: string
  name: string
  role: string
  email: string
  startDate: string
  url?: string
}

export function TeamSection() {
  const { config } = useProjectConfig()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    role: "Member",
    email: "",
    startDate: new Date().toISOString().split('T')[0]
  })

  const fetchMembers = async () => {
    if (!config.notionDatabases?.team) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `/api/notion/team?databaseId=${config.notionDatabases.team}`
      )
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
      } else {
        console.error("Failed to fetch team members")
      }
    } catch (error) {
      console.error("Error fetching team members:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (config.notionDatabases?.team) {
      fetchMembers()
    }
  }, [config.notionDatabases?.team])

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      alert("Name and email are required")
      return
    }

    if (config.notionDatabases?.team) {
      try {
        setLoading(true)
        const response = await fetch('/api/notion/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            databaseId: config.notionDatabases.team,
            ...formData
          })
        })

        if (response.ok) {
          await fetchMembers()
          setOpen(false)
          setFormData({
            name: "",
            role: "Member",
            email: "",
            startDate: new Date().toISOString().split('T')[0]
          })
        } else {
          alert("Failed to add team member")
        }
      } catch (error) {
        console.error("Error adding team member:", error)
        alert("Error adding team member")
      } finally {
        setLoading(false)
      }
    }
  }

  const keyMetrics = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
        <div className="text-2xl font-bold text-blue-700">{members.length}</div>
        <div className="text-sm text-blue-600">Team Members</div>
      </div>
      <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
        <div className="text-2xl font-bold text-green-700">
          {members.filter(m => m.role === "Admin").length}
        </div>
        <div className="text-sm text-green-600">Admins</div>
      </div>
    </div>
  )

  const detailedContent = (
    <div className="space-y-6">
      <div className="border rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setDetailsOpen(!detailsOpen)}
        >
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Team Members</h4>
            <span className="text-xs text-muted-foreground">
              ({members.length} members)
            </span>
          </div>
          <div className="flex items-center gap-2">
            {config.notionDatabases?.team && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  fetchMembers()
                }}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </Button>
            )}
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(true)
              }}
            >
              Add Member
            </Button>
            {detailsOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>

        {detailsOpen && (
          <div className="p-4 pt-0 space-y-4">
            {!config.notionDatabases?.team && (
              <div className="p-4 border border-dashed rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  Configure your Notion Team database in Project Settings.
                </p>
              </div>
            )}

            {members.length === 0 ? (
              <div className="p-8 border rounded-lg text-center border-dashed">
                <p className="text-sm text-muted-foreground">
                  No team members yet. Add your first team member.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-semibold">{member.name}</h5>
                            <Badge variant="outline">{member.role}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {member.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Joined: {new Date(member.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        {member.url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={member.url} target="_blank" rel="noopener noreferrer">
                              View in Notion
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      <DashboardSection
        title="Team"
        description="Manage your team members and roles"
        icon="👥"
        keyMetrics={keyMetrics}
        detailedContent={detailedContent}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new member to your team
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Member">Member</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Developer">Developer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

#### Step 5: Add to Main Dashboard

Update `/components/dashboard/main-dashboard.tsx`:

```typescript
import { TeamSection } from "./team-section"

// In the render:
<main className="container mx-auto p-6 space-y-6">
  <OverviewSection />
  <MetricsSection />
  <TeamSection />  {/* ADD THIS */}
  <UserFeedbackSection />
  <ReportsSection />
  <GuidesDocsSection />
</main>
```

#### Step 6: Update Project Settings (Optional)

If you want users to configure the database ID manually, update `/components/settings/project-settings-dialog.tsx`:

```typescript
// Add input field for Team database
<div className="grid gap-2">
  <Label htmlFor="notion-team">Team Database ID</Label>
  <Input
    id="notion-team"
    placeholder="abc123..."
    value={formData.notionDatabases?.team || ""}
    onChange={(e) => setFormData({
      ...formData,
      notionDatabases: {
        ...formData.notionDatabases,
        team: e.target.value
      }
    })}
  />
</div>
```

#### Step 7: Update Template Duplication (Optional)

If you want the Team database to be auto-created with new projects, update `/app/api/notion/duplicate-template/route.ts`:

```typescript
const TEMPLATE_DBS = {
  // ... existing
  TEAM: process.env.NOTION_TEMPLATE_TEAM,
}

// In the duplication logic:
if (TEMPLATE_DBS.TEAM) {
  duplicatedDbs.team = await duplicateDatabase(
    notionToken,
    TEMPLATE_DBS.TEAM,
    projectPageId,
    "Team"
  )
}
```

---

## Database Schema Patterns

### Standard Notion Database Schemas

#### Tasks Database
```
Properties:
- Name (title) - Task name
- Status (select) - Not Started, In Progress, Done, Blocked
- Due Date (date) - Deadline
- Priority (select) - Low, Medium, High, Urgent
- Assignee (person) - Who's responsible
- Description (rich_text) - Details
```

#### Goals Database
```
Properties:
- Name (title) - Goal name
- Status (select) - Not Started, On Track, At Risk, Completed
- Target Date (date) - Goal deadline
- Progress (number) - % completion
- Category (select) - Business, Product, Marketing, etc.
- Description (rich_text) - Details
```

#### Milestones Database
```
Properties:
- Name (title) - Milestone name
- Date (date) - Milestone date
- Status (select) - Upcoming, Completed, Missed
- Description (rich_text) - Details
```

#### Documents Database
```
Properties:
- Name (title) - Document name
- Type (select) - Guide, Documentation, Link, Resource
- URL (url) - Link to resource
- Category (select) - Technical, Business, Design, etc.
- Last Updated (date) - Last modification date
```

#### Feedback Database
```
Properties:
- Title (title) - Feedback title
- Date (date) - When received
- Feedback (rich_text) - Feedback content
- User Name (rich_text) - Who gave feedback

Supported Operations: Full CRUD (Create, Read, Update, Delete/Archive)
```

#### Metrics Database
```
Properties:
- Metric Name (title) - Type of metric (normalized: lowercase, no accents, no special chars)
- Number (number OR multi_select OR rich_text) - Metric value (auto-detected)
- Last Updated (date) - When recorded

Note: The API automatically detects property types and adapts.
Example metric types: "number of sales", "number of subscribers", "monthly revenue"
```

#### Sales Database
```
Properties:
- Name (title) - Sale description
- Date (date) - Sale date
- Amount (number) - Sale amount
- Customer (rich_text) - Customer name
- Status (select) - Lead, Closed, Lost
```

---

## Troubleshooting Common Issues

### Issue: "NOTION_TOKEN not configured"

**Cause**: Environment variable missing or not loaded

**Solution**:
1. Check `.env.local` exists and has `NOTION_TOKEN=xxx`
2. Restart dev server after adding env vars
3. Verify token is valid in Notion integration settings

### Issue: "Database not found" or 403 errors

**Cause**: Integration doesn't have access to database

**Solution**:
1. Go to Notion database
2. Click "..." menu → "Connections"
3. Add your integration to the database
4. Refresh the page

### Issue: Properties not found (undefined values)

**Cause**: Property names don't match what's in code

**Solution**:
Use flexible property mapping:
```typescript
const titleProp = properties.Name || properties.name || properties.Title
```

Or check exact property names in Notion and update code.

### Issue: "Module not found" errors

**Cause**: Missing dependencies

**Solution**:
```bash
npm install
```

### Issue: Session not persisting

**Cause**: `NEXTAUTH_SECRET` not set

**Solution**:
1. Generate secret: `openssl rand -base64 32`
2. Add to `.env.local`: `NEXTAUTH_SECRET=xxx`
3. Restart server

### Issue: localStorage data not loading

**Cause**: `useProjectConfig()` called before context loaded

**Solution**:
```typescript
const { config, isLoaded } = useProjectConfig()

if (!isLoaded) {
  return <div>Loading configuration...</div>
}
```

---

## Performance Optimizations

### 1. Package Import Optimization

`next.config.js` includes:
```javascript
experimental: {
  optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
}
```

This dramatically reduces first compilation time by tree-shaking unused icons.

### 2. API Route Caching

All Notion API routes use:
```typescript
export const dynamic = 'force-dynamic'
export const revalidate = 0
```

This ensures fresh data on every request (important for real-time dashboards).

### 3. Conditional Fetching

Data is only fetched when configured:
```typescript
useEffect(() => {
  if (config.notionDatabases?.tasks) {
    fetchTasks()
  }
}, [config.notionDatabases?.tasks])
```

Prevents unnecessary API calls.

### 4. Loading States

All data fetching operations use loading states to prevent duplicate requests:
```typescript
if (loading) return // Don't start another fetch
setLoading(true)
try {
  // fetch
} finally {
  setLoading(false)
}
```

---

## Security Considerations

### 1. Token Storage

- **OAuth tokens**: Stored in JWT (server-side), never exposed in client code
- **Notion token**: Server-side only (environment variable)
- **No sensitive data** in localStorage

### 2. API Route Protection

All API routes that use user tokens check authentication:
```typescript
const session = await getServerSession(authOptions)
if (!session?.accessToken) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
```

### 3. Environment Variables

Never commit `.env.local`:
```gitignore
.env*.local
.env.local
```

Use `.env.example` as template for required variables.

### 4. CORS and CSP

Next.js automatically handles CORS for API routes.

---

## Deployment Checklist

### Environment Variables Required

Production environment must have:
```
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GITHUB_ID=xxx
GITHUB_SECRET=xxx
NOTION_TOKEN=xxx
NOTION_PARENT_PAGE_ID=xxx (optional, for template duplication)
NOTION_TEMPLATE_TASKS=xxx (optional)
NOTION_TEMPLATE_GOALS=xxx (optional)
# ... other template IDs
```

### OAuth Callback URLs

Update OAuth app settings with production URLs:
- Google: `https://yourdomain.com/api/auth/callback/google`
- GitHub: `https://yourdomain.com/api/auth/callback/github`

### Build Command

```bash
npm run build
```

Check for:
- No TypeScript errors
- No ESLint errors
- Successful build

### Vercel Deployment (Recommended)

1. Connect GitHub repository
2. Add environment variables in Vercel dashboard
3. Deploy

Auto-deploys on push to main branch.

---

## Future Enhancements

### Planned Features
- Real-time sync with Notion (webhooks)
- Offline mode with service workers
- Export to PDF/CSV
- Dashboard customization (drag-and-drop sections)
- Multi-project support
- Team collaboration features
- Email notifications
- Analytics and insights

### Extension Points
- Add more OAuth providers (GitLab, Bitbucket)
- Integrate with more tools (Slack, Trello, Jira)
- Custom widgets system
- Plugin architecture
- API for third-party integrations

---

## Support and Resources

### Documentation
- Next.js: https://nextjs.org/docs
- NextAuth.js: https://next-auth.js.org
- Notion API: https://developers.notion.com
- shadcn/ui: https://ui.shadcn.com
- Tailwind CSS: https://tailwindcss.com

### Debugging
- Enable verbose logging in development
- Use React DevTools for component inspection
- Use Network tab to debug API calls
- Check Notion API logs for integration issues

---

**This document should be kept up to date as the project evolves. When adding new features, update the relevant sections to maintain accurate documentation.**
