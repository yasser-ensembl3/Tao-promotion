# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) and other LLMs when working with code in this repository.

## Project Overview

MiniVault is a unified project management dashboard built with Next.js 14 (App Router) that integrates Notion, Google Drive, Gmail, and GitHub into a single interface for small teams. The app uses NextAuth.js for OAuth authentication and shadcn/ui components with Tailwind CSS in dark mode.

### Core Architecture: One Repo = One Project

**Important**: MiniVault follows a **one repository = one project** architecture. Each deployment is dedicated to a single project, configured via environment variables in `.env.local`. This means:
- No project switching or dropdowns in the UI
- All configuration (Notion databases, GitHub repo, Drive folder) is set via environment variables
- Each project gets its own forked/cloned MiniVault repository
- Simple, focused dashboard experience for a single project

### Core Purpose
- **Unified Dashboard**: Single interface for all project resources (Notion, Drive, GitHub)
- **OAuth Integration**: Secure authentication with Google and GitHub
- **Modular Sections**: Collapsible dashboard sections for different project aspects
- **Mobile-Optimized**: Fully responsive design for mobile, tablet, and desktop
- **Metrics Tracking**: Separate input (actions) and output (results) metrics with interactive charts
- **Environment-Based Config**: All project settings configured via .env variables

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

The dashboard follows a collapsible section pattern with responsive design:

1. **DashboardSection** (`components/dashboard/dashboard-section.tsx`): Reusable wrapper component that provides:
   - Collapsible card interface with icon, title, and description
   - Optional `keyMetrics` slot for summary data (visible when collapsed)
   - Optional `detailedContent` slot for expanded view
   - State management for expand/collapse
   - Mobile-responsive padding, text sizes, and layout

2. **Section Components** (`components/dashboard/*-section.tsx`): Feature-specific sections that use `DashboardSection`:
   - `GoalsMetricsSection` (renamed to "Goals"): Track output metrics (sales, subscribers, reviews) with clickable cards and charts
   - `MetricsSection` (renamed to "Metrics"): Track input metrics (posts, interactions) with clickable cards and charts
   - `GuidesDocsSection`: Compact card grid layout for documentation links
   - `ProjectTrackingSection` (renamed to "Projects & Tasks"): Kanban board for task management
   - `ReportsSection`: AI-powered weekly report generation (collapsed when empty)
   - `UserFeedbackSection`: Feedback collection (collapsed when empty)
   - `OverviewSection`: Project description and milestones

3. **Main Dashboard** (`components/dashboard/main-dashboard.tsx`): Orchestrates all sections with mobile-responsive spacing

### Dashboard Sections Order

Sections appear in priority order:
1. **Goals** 🎯 - Output metrics (results)
2. **Metrics** 💪 - Input metrics (actions)
3. **Guides & Docs** 📚 - Documentation links
4. **Overview** 📋 - Project information
5. **Projects & Tasks** 📋 - Task management
6. **Weekly Reports** 📊 - AI summaries (compact when empty)
7. **User Feedback** 💬 - Feedback tracking (compact when empty)

### Metrics System

The app uses a dual metrics approach:

**Goals (Outputs)** - Track results:
- Database: `config.notionDatabases.goals`
- Examples: # of sales, # of subscribers, # of Amazon reviews
- Color scheme: Green (success/results)
- Interactive: Click metric cards to view detailed charts
- API: `/api/notion/metrics` with goals database ID

**Metrics (Inputs)** - Track actions:
- Database: `config.notionDatabases.metrics`
- Examples: # of posts, # of interactions, marketing ROI
- Color scheme: Blue (actions/efforts)
- Interactive: Click metric cards to view detailed charts
- API: `/api/notion/metrics` with metrics database ID

Both sections share the same structure:
- Clickable metric cards with selected state (ring + darker color)
- Line charts with Recharts library
- Date-based tracking with most recent values displayed
- Normalized metric names (lowercase, no accents)

### API Routes

The app includes comprehensive API routes for Notion integration:

**`/api/notion/metrics` (GET/POST)**
- **Purpose**: Fetch and create metric entries
- **Authentication**: Uses `NOTION_TOKEN` from environment variables
- **Query Parameters**: `databaseId` - The Notion database ID
- **POST Body**: `{ databaseId, type, value, date }`
- **Response**: Array of metrics with `{ id, type, value, date, url }`
- **Note**: Supports different property types (number, multi_select, rich_text)

**`/api/notion/goals` (GET/POST)**
- **Purpose**: Fetch and create goal entries (outputs)
- **Authentication**: Uses `NOTION_TOKEN`
- **Similar structure to metrics API**

**`/api/notion/tasks` (GET/POST)**
- **Purpose**: Task management from Notion
- **Returns**: Tasks with assignee, status, priority, tags, due date

**`/api/notion/documents` (GET/POST/PATCH/DELETE)**
- **Purpose**: Manage documentation links
- **Supports**: CRUD operations for link management

**`/api/notion/feedback` (GET/POST/PATCH/DELETE)**
- **Purpose**: User feedback tracking
- **Returns**: Feedback items with user name, date, content

**`/api/github/repo` (GET)**
- **Purpose**: Fetch GitHub repository info, commits, issues, and PRs
- **Authentication**: Uses `accessToken` from NextAuth session
- **Query Parameters**: `owner`, `repo` - GitHub owner and repository name
- **Response**: Repository metadata, recent commits (5), open issues (10), open PRs (10)

**`/api/drive/files` (GET)**
- **Purpose**: Fetch files from a Google Drive folder
- **Authentication**: Uses `accessToken` from NextAuth session
- **Query Parameters**: `folderId` - Google Drive folder ID
- **Response**: Folder metadata + array of files with type detection

### Mobile Optimization

The app is fully optimized for mobile devices:

**Viewport Configuration**:
- `width: device-width` for proper scaling
- `initialScale: 1` for correct zoom level
- `maximumScale: 5` to allow user zoom

**Responsive Layout**:
- Adaptive padding: `p-4 sm:p-6` throughout
- Flexible spacing: `space-y-4 sm:space-y-6`
- Mobile-first grid layouts: `grid-cols-2 md:grid-cols-3 lg:grid-cols-5`
- Text sizing: `text-base sm:text-xl` for headers
- Container padding: `px-3 sm:px-4` for proper margins

**Interactive Elements**:
- Touch-friendly button sizes
- Truncated text to prevent overflow: `truncate`, `line-clamp-1`
- Flex layouts that stack on mobile: `flex-col sm:flex-row`
- Full-width selects on mobile: `w-full sm:w-[250px]`

## App Structure

```
/app
  /api
    /auth/[...nextauth]/route.ts   # NextAuth handler (imports from lib/auth.ts)
    /drive/files/route.ts          # Google Drive API proxy
    /github/repo/route.ts          # GitHub API proxy
    /notion
      /metrics/route.ts            # Metrics CRUD (inputs)
      /goals/route.ts              # Goals CRUD (outputs)
      /tasks/route.ts              # Task management
      /documents/route.ts          # Documentation links
      /feedback/route.ts           # User feedback
      /projects/route.ts           # Project management
  /auth/signin/page.tsx            # Sign-in page with provider buttons
  globals.css                      # Tailwind base styles + CSS variables
  layout.tsx                       # Root layout with viewport config + providers
  page.tsx                         # Home page (renders MainDashboard)

/components
  /auth
    session-provider.tsx           # SessionProvider wrapper (client component)
  /dashboard
    dashboard-section.tsx          # Reusable collapsible section wrapper (responsive)
    main-dashboard.tsx             # Main orchestrator (responsive spacing)
    header.tsx                     # Dashboard header (responsive layout)
    goals-metrics-section.tsx      # Goals/Outputs with charts (renamed from GoalsMetricsSection)
    metrics-section.tsx            # Metrics/Inputs with charts
    guides-docs-section.tsx        # Compact card grid for links
    project-tracking-section.tsx   # Projects & Tasks Kanban board
    reports-section.tsx            # AI reports (uses localStorage for storage)
    user-feedback-section.tsx      # Feedback (compact when empty)
    overview-section.tsx           # Project overview
  /ui                              # shadcn/ui primitives (button, card, badge, etc.)

/lib
  auth.ts                          # NextAuth authOptions configuration
  project-config.ts                # Project configuration from environment variables
  utils.ts                         # cn() utility for Tailwind class merging

/types
  next-auth.d.ts                   # NextAuth session type extensions
```

## Project Configuration System

MiniVault uses a simple environment variable-based configuration system. All project settings are configured in `.env.local` (never committed to git).

**Configuration Source**: `lib/project-config.ts`
- **Function**: `getProjectConfig()` - Returns project configuration from environment variables
- **Hook**: `useProjectConfig()` - React hook to access project configuration in components
- **Interface**: `ProjectConfig` - TypeScript interface for project configuration

**Key Configuration Variables** (all use `NEXT_PUBLIC_` prefix for client-side access):
- `NEXT_PUBLIC_PROJECT_NAME` - Display name for the project
- `NEXT_PUBLIC_PROJECT_DESCRIPTION` - Optional project description
- `NEXT_PUBLIC_GITHUB_OWNER` & `NEXT_PUBLIC_GITHUB_REPO` - GitHub repository
- `NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID` - Google Drive folder ID
- `NEXT_PUBLIC_NOTION_DB_*` - Notion database IDs for each feature:
  - `NEXT_PUBLIC_NOTION_DB_TASKS` - Tasks/Projects database
  - `NEXT_PUBLIC_NOTION_DB_GOALS` - Goals/Output metrics database
  - `NEXT_PUBLIC_NOTION_DB_METRICS` - Input metrics database
  - `NEXT_PUBLIC_NOTION_DB_MILESTONES` - Milestones database
  - `NEXT_PUBLIC_NOTION_DB_DOCUMENTS` - Documentation links database
  - `NEXT_PUBLIC_NOTION_DB_FEEDBACK` - User feedback database
- `NEXT_PUBLIC_NOTION_PROJECT_PAGE_ID` - Optional Notion project page ID

**Usage in Components**:
```typescript
import { useProjectConfig } from "@/lib/project-config"

export function MyComponent() {
  const config = useProjectConfig()

  // Access configuration
  console.log(config.projectName)
  console.log(config.notionDatabases.tasks)
  console.log(config.github?.owner)
}
```

## Environment Variables

The `.env.local` file contains OAuth credentials, API keys, and all project configuration. **Critical**: Ensure all environment variables are properly formatted as single-line key-value pairs.

**Known issue**: Multi-line JSON objects (like `GOOGLE_SERVICE_ACCOUNT_KEY`) must be escaped and formatted as a single line. The environment parser cannot handle unescaped newlines or multi-line values.

Required variables (see `.env.example`):
- **Authentication**: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- **OAuth Providers**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_ID`, `GITHUB_SECRET`
- **Notion Integration**: `NOTION_TOKEN`
- **Project Configuration**: All `NEXT_PUBLIC_*` variables listed above

## Key Development Notes

1. **Next.js App Router**: This project uses the App Router (not Pages Router). All pages are in `/app` directory.

2. **Client Components**: Most dashboard components require `"use client"` directive since they use React hooks (`useState`, `useEffect`, `useSession`).

3. **Dark Mode**: The app is locked to dark mode via `<html className="dark">` in `app/layout.tsx`. Tailwind dark mode classes are available throughout.

4. **shadcn/ui Components**: UI primitives are in `/components/ui`. Use the `cn()` utility from `lib/utils.ts` for conditional Tailwind classes.

5. **Console Logging**: The codebase includes extensive `console.log` statements prefixed with component names (e.g., `[MainDashboard]`, `[NextAuth]`) for debugging authentication flow. These are automatically removed in production by `next.config.js` (`removeConsole: true`).

6. **TypeScript Configuration**: `tsconfig.json` uses `"moduleResolution": "bundler"` and path aliases `@/*` map to the root directory.

7. **Performance Optimizations**: `next.config.js` uses `optimizePackageImports` for icon libraries (lucide-react, @radix-ui/react-icons) to dramatically reduce startup time by tree-shaking unused icons. This reduces first compilation from ~45s to ~1-2s.

8. **Session Token Access**: API routes that need to make authenticated requests should use `getServerSession(authOptions)` to retrieve the user's access token.

9. **Responsive Design**: All components use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) for mobile-first design. Test on mobile devices or use browser dev tools for mobile preview.

10. **Chart Library**: Uses Recharts for interactive line charts in Goals and Metrics sections.

## UX Patterns

### Clickable Metric Cards
- Metric cards in Goals and Metrics sections are interactive buttons
- Selected card shows ring effect and darker background color
- Click a card to instantly switch the chart display
- Visual feedback: hover states and smooth transitions

### Compact Empty States
- Weekly Reports and User Feedback sections show minimal UI when empty
- Single-line compact bar with icon, title, and action button
- Expands to full section when data is added
- Reduces visual clutter on initial dashboard load

### Card Grid Layouts
- Guides & Docs uses compact card grid (2-5 columns based on screen size)
- Each card shows type badge, title, description, and action buttons
- Hover effect with shadow for better interactivity
- Edit and delete actions accessible via icons

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

**Mobile Display Issues**:
- Test viewport meta tag is properly set in `app/layout.tsx`
- Verify responsive classes are using mobile-first approach (`base` then `sm:` prefixes)
- Check that grids collapse properly: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- Ensure text truncation is working: `truncate` or `line-clamp-N` classes
