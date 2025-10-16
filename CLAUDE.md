# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) and other LLMs when working with code in this repository.

## Project Overview

MiniVault is a unified project management dashboard built with Next.js 14 (App Router) that integrates Notion, Google Drive, Gmail, and GitHub into a single interface for small teams. The app uses NextAuth.js for OAuth authentication and shadcn/ui components with Tailwind CSS in dark mode.

### Core Purpose
- **Unified Dashboard**: Single interface for all project resources (Notion, Drive, GitHub)
- **OAuth Integration**: Secure authentication with Google and GitHub
- **Modular Sections**: Collapsible dashboard sections for different project aspects
- **Configuration Management**: User-configurable project resources via localStorage

## Development Commands

```bash
# Development server (starts on http://localhost:3000)
# Note: First compilation takes ~1-2 seconds (optimized with optimizePackageImports)
npm run dev

# Production build
npm run build

# Production server
npm start

# Linting
npm run lint
```

## Architecture

### Authentication Flow

The app uses NextAuth.js with a custom authentication flow:

1. **Session Management**: `components/auth/session-provider.tsx` wraps the app with `SessionProvider` (client component)
2. **Auth Configuration**: `lib/auth.ts` exports authOptions with:
   - Google OAuth provider with extended scopes
   - GitHub OAuth provider
   - JWT callback to store access/refresh tokens
   - Session callback to expose tokens to client
3. **Auth Route**: `app/api/auth/[...nextauth]/route.ts` imports authOptions and creates NextAuth handler
4. **Session Extension**: `types/next-auth.d.ts` extends the default NextAuth session to include `accessToken`, `refreshToken`, and `provider`
5. **Protected Pages**: `components/dashboard/main-dashboard.tsx` redirects unauthenticated users to `/auth/signin`

**Key OAuth scopes**:
- Google: `openid`, `email`, `profile`, `gmail.readonly`, `drive.readonly`, `documents.readonly`
- GitHub: `read:user`, `user:email`, `repo`

**Token Flow**:
- OAuth provider returns `access_token` and `refresh_token`
- JWT callback stores tokens in JWT (server-side)
- Session callback exposes tokens to client via session object
- API routes use tokens to make authenticated requests

### Component Architecture

The dashboard follows a collapsible section pattern:

1. **DashboardSection** (`components/dashboard/dashboard-section.tsx`): Reusable wrapper component that provides:
   - Collapsible card interface with icon, title, and description
   - Optional `keyMetrics` slot for summary data (visible when collapsed)
   - Optional `detailedContent` slot for expanded view
   - State management for expand/collapse

2. **Section Components** (`components/dashboard/*-section.tsx`): Feature-specific sections that use `DashboardSection`:
   - `OverviewSection`: Project description, vision, and milestones
   - `GoalsMetricsSection`: Track objectives and KPIs
   - `UserFeedbackSection`: Feedback collection
   - `GuidesDocsSection`: Documentation and instructions

3. **Main Dashboard** (`components/dashboard/main-dashboard.tsx`): Orchestrates all sections and handles authentication state

### API Routes

The app includes three API routes for fetching external data:

**`/api/notion/database` (GET)**
- **Purpose**: Fetch Notion database metadata and pages
- **Authentication**: Uses `NOTION_TOKEN` from environment variables (server-side)
- **Query Parameters**: `databaseId` - The Notion database ID
- **Response**: Database info + array of pages with properties
- **Implementation**: `app/api/notion/database/route.ts`
- **Note**: Cleans database ID (removes hyphens), fetches up to 50 pages sorted by last_edited_time

**`/api/github/repo` (GET)**
- **Purpose**: Fetch GitHub repository info, commits, issues, and PRs
- **Authentication**: Uses `accessToken` from NextAuth session
- **Query Parameters**: `owner`, `repo` - GitHub owner and repository name
- **Response**: Repository metadata, recent commits (5), open issues (10), open PRs (10)
- **Implementation**: `app/api/github/repo/route.ts`
- **Error Handling**: Returns 401 if no access token

**`/api/drive/files` (GET)**
- **Purpose**: Fetch files from a Google Drive folder
- **Authentication**: Uses `accessToken` from NextAuth session
- **Query Parameters**: `folderId` - Google Drive folder ID
- **Response**: Folder metadata + array of files with type detection
- **Implementation**: `app/api/drive/files/route.ts`
- **Note**: Fetches up to 50 files, includes type flags (isFolder, isDocument, etc.)

### App Structure

```
/app
  /api
    /auth/[...nextauth]/route.ts   # NextAuth handler (imports from lib/auth.ts)
    /drive/files/route.ts          # Google Drive API proxy
    /github/repo/route.ts          # GitHub API proxy
    /notion/database/route.ts      # Notion API proxy
  /auth/signin/page.tsx            # Sign-in page with provider buttons
  globals.css                      # Tailwind base styles + CSS variables
  layout.tsx                       # Root layout with AuthProvider + ProjectConfigProvider
  page.tsx                         # Home page (renders MainDashboard)

/components
  /auth
    session-provider.tsx           # SessionProvider wrapper (client component)
  /dashboard
    dashboard-section.tsx          # Reusable collapsible section wrapper
    main-dashboard.tsx             # Main orchestrator with auth protection
    header.tsx                     # Dashboard header with settings and sign out
    *-section.tsx                  # Individual section components
  /settings
    project-settings-dialog.tsx    # Dialog for configuring project resources
  /ui                              # shadcn/ui primitives (button, card, badge, etc.)

/contexts
  project-config-context.tsx       # Project configuration context with localStorage

/lib
  auth.ts                          # NextAuth authOptions configuration
  utils.ts                         # cn() utility for Tailwind class merging

/types
  next-auth.d.ts                   # NextAuth session type extensions
  project-config.ts                # ProjectConfig interface and defaults
```

## Environment Variables

The `.env.local` file contains OAuth credentials and API keys. **Critical**: Ensure all environment variables are properly formatted as single-line key-value pairs.

**Known issue**: Multi-line JSON objects (like `GOOGLE_SERVICE_ACCOUNT_KEY`) must be escaped and formatted as a single line. The environment parser cannot handle unescaped newlines or multi-line values.

Required variables (see `.env.example`):
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GITHUB_ID`, `GITHUB_SECRET`
- `NOTION_TOKEN`, `NOTION_DATABASE_ID`

## Project Configuration System

The app uses a localStorage-based configuration system to store user preferences:

**Context Provider**: `contexts/project-config-context.tsx`
- **Storage Key**: `minivault_project_config`
- **Interface**: Defined in `types/project-config.ts`
- **Fields**:
  - `projectName`: String - Display name for the project
  - `github`: Object - `owner` and `repo` for GitHub integration
  - `googleDrive`: Object - `folderId` and optional `folderName`
  - `notion`: Object - `databaseId` and optional `databaseName`
  - `customLinks`: Array - Additional links (future feature)

**Usage**:
```typescript
import { useProjectConfig } from "@/contexts/project-config-context"

const { config, updateConfig, isLoaded } = useProjectConfig()

// Update configuration
updateConfig({
  github: { owner: "octocat", repo: "hello-world" }
})
```

**Configuration UI**: `components/settings/project-settings-dialog.tsx`
- Accessible from dashboard header
- Form fields for all configuration options
- Saves to localStorage on submit
- Validates and formats IDs (e.g., Notion database ID cleanup)

## Dashboard Sections

The dashboard is composed of modular, collapsible sections:

**Currently Active** (shown in `main-dashboard.tsx`):
- `OverviewSection` - Project description, vision, milestones (placeholder)
- `GuidesDocsSection` - Links to configured GitHub, Drive, Notion resources
- `GoalsMetricsSection` - Objectives and KPIs (placeholder)
- `UserFeedbackSection` - Feedback collection (placeholder)

**Available Sections** (can be added to dashboard):
- `NotionSection` - Live Notion database integration with page listing
- `DriveSection` - Live Google Drive folder browsing
- `GitHubSection` - Live GitHub repo stats, commits, issues, PRs
- `MetricsSection` - Performance metrics overview
- `ProjectTrackingSection` - Task tracking from Notion
- `ReportsSection` - Weekly report generation
- `KnowledgeSection` - Knowledge base management

**Adding a Section**:
1. Import the section component in `main-dashboard.tsx`
2. Add `<SectionName />` to the dashboard sections div
3. Section will automatically use `DashboardSection` wrapper
4. Configure keyMetrics and detailedContent as needed

## Key Development Notes

1. **Next.js App Router**: This project uses the App Router (not Pages Router). All pages are in `/app` directory.

2. **Client Components**: Most dashboard components require `"use client"` directive since they use React hooks (`useState`, `useEffect`, `useSession`).

3. **Dark Mode**: The app is locked to dark mode via `<html className="dark">` in `app/layout.tsx`. Tailwind dark mode classes are available throughout.

4. **shadcn/ui Components**: UI primitives are in `/components/ui`. Use the `cn()` utility from `lib/utils.ts` for conditional Tailwind classes.

5. **Console Logging**: The codebase includes extensive `console.log` statements prefixed with component names (e.g., `[MainDashboard]`, `[NextAuth]`) for debugging authentication flow. These are automatically removed in production by `next.config.js` (`removeConsole: true`).

6. **TypeScript Configuration**: `tsconfig.json` uses `"moduleResolution": "bundler"` and path aliases `@/*` map to the root directory.

7. **Performance Optimizations**: `next.config.js` uses `optimizePackageImports` for icon libraries (lucide-react, @radix-ui/react-icons) to dramatically reduce startup time by tree-shaking unused icons. This reduces first compilation from ~45s to ~1-2s.

8. **Session Token Access**: API routes that need to make authenticated requests should use `getServerSession(authOptions)` to retrieve the user's access token.

## Troubleshooting

**Authentication Issues**:
- Check that all OAuth credentials are set in `.env.local`
- Verify OAuth callback URLs match: `http://localhost:3000/api/auth/callback/[provider]`
- Review console logs prefixed with `[NextAuth]` for detailed flow information
- Ensure `NEXTAUTH_SECRET` is set (generate with `openssl rand -base64 32`)

**API Integration Issues**:
- **Notion**: Verify `NOTION_TOKEN` has access to the database, check database ID format
- **GitHub**: Ensure user signed in with GitHub (not Google), check token scopes
- **Google Drive**: Ensure user signed in with Google (not GitHub), verify folder ID and permissions

**Build Issues**:
- Run `npm run lint` to check for ESLint errors
- Ensure all environment variables are properly formatted (single-line, no unescaped newlines)
- Check that TypeScript errors are resolved with `npx tsc --noEmit`

**OAuth Scope Issues**:
- If APIs return 403, user may need to re-authenticate to grant new scopes
- Sign out and sign back in to trigger OAuth consent flow with updated scopes
