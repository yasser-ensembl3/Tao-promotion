# MiniVault

Unified project management dashboard that integrates Notion, Google Drive, Gmail, GitHub, and Shopify into a single interface. Built with Next.js 14. Follows a **one repo = one project** architecture — each deployment is dedicated to a single project configured via environment variables.

## Features

### Dashboard Sections

The dashboard is modular with collapsible sections, displayed in priority order:

| Section | Description |
|---------|-------------|
| Orders | Order fulfillment tracking |
| Goals | Output metrics (sales, subscribers, reviews) with interactive charts |
| Sales Tracking | Revenue and sales analytics |
| Web Analytics | Traffic and conversion data |
| Metrics | Input metrics (posts, interactions, marketing) with interactive charts |
| Essentials | Critical tools, milestones, resources, partnerships |
| Guides & Docs | Documentation links in card grid |
| Overview | Project description, vision, milestones |
| Recurring Tasks | Repeating task tracking |
| Tasks | One-time task management (Kanban) |
| Reports | AI-generated weekly summaries |
| User Feedback | Feedback collection and display |

Each section has key metrics visible when collapsed and detailed content when expanded.

### Integrations

| Service | Features |
|---------|----------|
| Notion | Full CRUD on 13+ databases (tasks, metrics, goals, orders, feedback, etc.) |
| Google Drive | Browse folders and files, document preview |
| GitHub | Repository metadata, recent commits, open issues and PRs |
| Gmail | Message reading (optional) |
| Shopify | Sales data integration |

### Authentication

NextAuth.js with Google and GitHub OAuth providers. JWT-based token storage with automatic session extension. Protected pages redirect to sign-in.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14 (App Router), React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 (dark mode only), Radix UI, shadcn/ui |
| Auth | NextAuth.js (Google + GitHub OAuth) |
| Data fetching | SWR 2.3.8 (60-second cache) |
| Charts | Recharts |
| Database | Notion API (v2022-06-28) |
| MCP server | Model Context Protocol for Claude integration |
| Docs | Nextra |
| Deployment | Vercel |

## Architecture

```
MiniVault-TaoPromotion/
├── app/
│   ├── layout.tsx                          # Root layout with providers
│   ├── page.tsx                            # Home (redirects to /dashboard)
│   ├── auth/signin/page.tsx                # OAuth sign-in page
│   ├── dashboard/page.tsx                  # Main dashboard
│   ├── tasks/page.tsx                      # Detailed task page
│   ├── recurring-tasks/page.tsx            # Recurring tasks page
│   ├── orders/page.tsx                     # Orders page
│   ├── overview/page.tsx                   # Project overview
│   ├── essentials/page.tsx                 # Essentials page
│   ├── guides/page.tsx                     # Guides & docs
│   ├── feedback/page.tsx                   # Feedback page
│   ├── reports/page.tsx                    # Reports page
│   ├── analytics/page.tsx                  # Analytics page
│   ├── docs/[[...mdxPath]]/page.tsx        # Nextra documentation
│   └── api/
│       ├── auth/[...nextauth]/route.ts     # NextAuth handler
│       ├── notion/
│       │   ├── metrics/route.ts            # Input metrics CRUD
│       │   ├── goals/route.ts              # Output metrics CRUD
│       │   ├── tasks/route.ts              # Task management
│       │   ├── recurring-tasks/route.ts    # Recurring tasks
│       │   ├── orders/route.ts             # Order management
│       │   ├── documents/route.ts          # Documentation links
│       │   ├── feedback/route.ts           # User feedback
│       │   ├── essentials/route.ts         # Tools, milestones, resources
│       │   ├── sales/route.ts              # Sales tracking
│       │   ├── milestones/route.ts         # Project milestones
│       │   ├── project-overview/route.ts   # Project description
│       │   ├── shopify/route.ts            # Shopify integration
│       │   └── page-content/route.ts       # Page content fetch
│       ├── github/repo/route.ts            # GitHub repo proxy
│       ├── drive/files/route.ts            # Google Drive proxy
│       ├── google/gmail/route.ts           # Gmail integration
│       ├── ai/chat/route.ts                # AI chat
│       └── feedback/save/route.ts          # Feedback file save
├── components/
│   ├── sidebar.tsx                         # Navigation (desktop + mobile)
│   ├── auth/session-provider.tsx           # NextAuth SessionProvider
│   ├── dashboard/
│   │   ├── main-dashboard.tsx              # Master orchestrator
│   │   ├── dashboard-section.tsx           # Reusable collapsible wrapper
│   │   ├── goals-metrics-section.tsx       # Output metrics + charts
│   │   ├── metrics-section.tsx             # Input metrics + charts
│   │   ├── project-tracking-section.tsx    # Tasks (Kanban)
│   │   ├── recurring-tasks-section.tsx     # Recurring tasks
│   │   ├── orders-section.tsx              # Order management
│   │   ├── essentials-section.tsx          # Tools & resources
│   │   ├── guides-docs-section.tsx         # Doc links grid
│   │   ├── overview-section.tsx            # Project overview
│   │   ├── sales-tracking-section.tsx      # Sales analytics
│   │   ├── web-analytics-section.tsx       # Web traffic
│   │   ├── reports-section.tsx             # AI weekly reports
│   │   ├── user-feedback-section.tsx       # Feedback
│   │   └── ...                             # Other sections
│   └── ui/                                # shadcn/ui components
├── lib/
│   ├── auth.ts                            # NextAuth config
│   ├── project-config.ts                  # Env-based project config
│   ├── use-cached-fetch.ts                # SWR hooks
│   ├── swr-config.tsx                     # SWR provider (60s cache)
│   ├── api-auth.ts                        # API auth utilities
│   └── utils.ts                           # Helpers (cn)
├── mcp-server/                            # MCP server for Claude integration
├── content/docs/                          # Nextra MDX documentation
└── types/next-auth.d.ts                   # NextAuth type augmentation
```

## Configuration

All project settings via environment variables. No database switching needed.

### Required

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_URL` | App URL (default: http://localhost:3000) |
| `NEXTAUTH_SECRET` | Session secret (`openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GITHUB_ID` | GitHub OAuth app ID |
| `GITHUB_SECRET` | GitHub OAuth app secret |
| `NOTION_TOKEN` | Notion integration token |

### Project Config

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_PROJECT_NAME` | Display name |
| `NEXT_PUBLIC_PROJECT_DESCRIPTION` | Project description |
| `NEXT_PUBLIC_GITHUB_OWNER` | GitHub owner |
| `NEXT_PUBLIC_GITHUB_REPO` | GitHub repo name |
| `NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID` | Drive folder ID |

### Notion Database IDs

| Variable | Section |
|----------|---------|
| `NEXT_PUBLIC_NOTION_DB_TASKS` | Tasks |
| `NEXT_PUBLIC_NOTION_DB_RECURRING_TASKS` | Recurring tasks |
| `NEXT_PUBLIC_NOTION_DB_GOALS` | Goals (output metrics) |
| `NEXT_PUBLIC_NOTION_DB_METRICS` | Metrics (input metrics) |
| `NEXT_PUBLIC_NOTION_DB_MILESTONES` | Milestones |
| `NEXT_PUBLIC_NOTION_DB_DOCUMENTS` | Documentation links |
| `NEXT_PUBLIC_NOTION_DB_FEEDBACK` | User feedback |
| `NEXT_PUBLIC_NOTION_DB_ORDERS` | Orders |
| `NEXT_PUBLIC_NOTION_DB_ESSENTIALS` | Essentials |
| `NEXT_PUBLIC_NOTION_DB_SALES` | Sales |
| `NEXT_PUBLIC_NOTION_DB_SALES_TRACKING` | Sales tracking |
| `NEXT_PUBLIC_NOTION_DB_WEB_ANALYTICS` | Web analytics |

## Setup

```bash
cd MiniVault-TaoPromotion
npm install
cp .env.example .env.local
# Edit .env.local with your credentials
npm run dev    # Starts on localhost:3000
```

## Deployment

Optimized for Vercel:

```bash
npm run build
npm start
```

Add all environment variables to the Vercel dashboard. Uses `vercel.json` for configuration.
