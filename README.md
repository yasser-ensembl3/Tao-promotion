# MiniVault — Tao Promotion

E-commerce dashboard for Shopify store management. Consolidates orders, sales analytics, web traffic, customer feedback, and operational tasks into a single interface. All data lives in Notion databases. Built with Next.js 14.

Follows a **one repo = one store** model — each deployment manages a single Shopify store configured via environment variables.

## What It Does

| Section | Description |
|---------|-------------|
| **Orders** | Unfulfilled/fulfilled orders, revenue totals, payment and fulfillment status tracking |
| **Goals** | Output metrics — sales count, subscribers, Amazon reviews — with interactive line charts |
| **Sales Tracking** | Period-over-period sales trends, gross/net/total sales, discounts, returns, shipping, AOV |
| **Web Analytics** | Sessions, conversion rates, traffic sources (Google, Facebook, Direct, etc.), device breakdown |
| **Metrics** | Input metrics — posts, interactions, marketing ROI — with interactive line charts |
| **Essentials** | Tools, milestones, strategies, resources, partnerships, achievements by priority |
| **Tasks** | One-time task management with status flow (To Do → In Progress → Review → Done) |
| **Recurring Tasks** | Repeating tasks tracked by frequency (daily/weekly/monthly/quarterly) |
| **Feedback** | Customer/user feedback collection with time-period filtering |
| **Guides & Docs** | Documentation links in a card grid with type badges |

Each section is collapsible — shows key metrics when collapsed, full detail when expanded.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14 (App Router), React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 (dark mode only), shadcn/ui, Radix UI |
| Auth | NextAuth.js (Google + GitHub OAuth) |
| Data fetching | SWR (60-second cache) |
| Charts | Recharts (line, bar, pie) |
| Database | Notion API |
| Deployment | Vercel |

## Architecture

```
MiniVault-TaoPromotion/
├── app/
│   ├── layout.tsx                      # Root layout (SessionProvider, SWR)
│   ├── page.tsx                        # Redirects to /dashboard
│   ├── dashboard/page.tsx              # Main dashboard (all sections)
│   ├── orders/page.tsx                 # Orders with fulfillment/payment filters
│   ├── analytics/page.tsx              # Goals + Metrics + Sales + Web Analytics
│   ├── tasks/page.tsx                  # Kanban task board
│   ├── recurring-tasks/page.tsx        # Recurring task tracking
│   ├── feedback/page.tsx               # Feedback with time filters
│   ├── essentials/page.tsx             # Tools & resources by type
│   ├── guides/page.tsx                 # Documentation links
│   ├── overview/page.tsx               # Project description
│   ├── reports/page.tsx                # AI weekly reports
│   ├── auth/signin/page.tsx            # OAuth sign-in
│   └── api/
│       ├── auth/[...nextauth]/         # NextAuth handler
│       └── notion/
│           ├── sales/route.ts          # Orders (fetch with dynamic property extraction)
│           ├── shopify/route.ts        # Sales tracking + Web analytics (period-sorted)
│           ├── metrics/route.ts        # Input/output metrics (shared route)
│           ├── goals/route.ts          # Output metrics
│           ├── tasks/route.ts          # Task CRUD
│           ├── recurring-tasks/route.ts
│           ├── feedback/route.ts       # Feedback CRUD
│           ├── essentials/route.ts     # Essentials CRUD
│           ├── documents/route.ts      # Documentation links CRUD
│           ├── milestones/route.ts     # Project milestones
│           └── project-overview/route.ts
├── components/
│   ├── sidebar.tsx                     # Navigation (desktop sidebar + mobile hamburger)
│   ├── dashboard/
│   │   ├── main-dashboard.tsx          # Section orchestrator
│   │   ├── dashboard-section.tsx       # Reusable collapsible section wrapper
│   │   ├── orders-section.tsx          # 4 metric cards + order table
│   │   ├── goals-metrics-section.tsx   # Output metrics with clickable cards → charts
│   │   ├── sales-tracking-section.tsx  # 5 sales metrics + trend chart + breakdown
│   │   ├── web-analytics-section.tsx   # 4 metrics + traffic pie + device bar + funnel
│   │   ├── metrics-section.tsx         # Input metrics with clickable cards → charts
│   │   ├── essentials-section.tsx      # Grid by type, color-coded by priority
│   │   ├── project-tracking-section.tsx # Tasks (Kanban)
│   │   ├── recurring-tasks-section.tsx
│   │   ├── user-feedback-section.tsx   # Feedback with CRUD
│   │   ├── guides-docs-section.tsx     # Link cards
│   │   ├── overview-section.tsx
│   │   └── reports-section.tsx         # AI reports (localStorage)
│   └── ui/                            # shadcn/ui components
├── lib/
│   ├── auth.ts                        # NextAuth config (Google + GitHub OAuth)
│   ├── project-config.ts              # Env-based project config loader
│   ├── use-cached-fetch.ts            # SWR hooks (useNotionData, useCachedFetch)
│   ├── swr-config.tsx                 # SWR provider (60s cache, 2 retries)
│   ├── api-auth.ts                    # API auth utilities
│   └── utils.ts                       # cn() helper
├── mcp-server/                        # MCP server for Claude integration
└── types/next-auth.d.ts               # NextAuth session type extension
```

## Data Flow

```
Client Components
    → useProjectConfig() gets database IDs from env
    → useNotionData(endpoint, databaseId) via SWR
    → /api/notion/* routes query Notion API with NOTION_TOKEN
    → Parse response, return formatted JSON
    → Cached 60 seconds (SWR)
    → Components render
```

## Notion Database Schemas

### Orders

| Property | Type | Values |
|----------|------|--------|
| Order | Text | Order ID |
| Date | Date | Order date |
| Items | Number | Item count |
| Total $ | Number | Order total |
| Payment | Select | Paid, Pending, Refunded |
| Fulfillment | Select | Fulfilled, Unfulfilled |
| Customer | Text | Customer name |

### Sales Tracking

| Property | Type |
|----------|------|
| Period | Text ("Jan 1-31 2025" format) |
| Gross Sales, Net Sales, Total Sales | Number |
| Discounts, Returns, Taxes, Shipping | Number |
| Paid Orders, Orders Fulfilled | Number |
| Average Order Value | Number |

### Web Analytics

| Property | Type |
|----------|------|
| Period | Text (same format) |
| Sessions | Number |
| Conversion Rate, Add to Cart Rate, Checkout Rate | Number |
| Direct, Google, Facebook, Twitter, LinkedIn, Other | Number (traffic sources) |
| Desktop, Mobile | Number (device split) |

### Goals / Metrics

| Property | Type |
|----------|------|
| Metric Name | Title |
| Number | Number |
| Last Updated | Date |

### Tasks

| Property | Type | Values |
|----------|------|--------|
| Name | Title | Task name |
| Status | Select | To Do, In Progress, Review, Done |
| Priority | Select | Optional |
| Assignee | Text | Optional |
| Tags | Multi-select | Optional |
| Due Date | Date | Optional |

## Setup

### Prerequisites

- Node.js 18+
- Notion workspace with API integration
- Google Cloud project (OAuth credentials)

### Installation

```bash
npm install
cp .env.example .env.local
# Edit .env.local
npm run dev
```

### Environment Variables

**Auth:**

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_URL` | App URL |
| `NEXTAUTH_SECRET` | Session secret |
| `GOOGLE_CLIENT_ID` / `SECRET` | Google OAuth |
| `GITHUB_ID` / `SECRET` | GitHub OAuth |
| `NOTION_TOKEN` | Notion integration token |

**Notion Databases (set to enable section):**

| Variable | Section |
|----------|---------|
| `NEXT_PUBLIC_NOTION_DB_ORDERS` | Orders |
| `NEXT_PUBLIC_NOTION_DB_GOALS` | Goals (output metrics) |
| `NEXT_PUBLIC_NOTION_DB_SALES_TRACKING` | Sales tracking |
| `NEXT_PUBLIC_NOTION_DB_WEB_ANALYTICS` | Web analytics |
| `NEXT_PUBLIC_NOTION_DB_METRICS` | Metrics (input metrics) |
| `NEXT_PUBLIC_NOTION_DB_ESSENTIALS` | Essentials |
| `NEXT_PUBLIC_NOTION_DB_TASKS` | Tasks |
| `NEXT_PUBLIC_NOTION_DB_RECURRING_TASKS` | Recurring tasks |
| `NEXT_PUBLIC_NOTION_DB_FEEDBACK` | Feedback |
| `NEXT_PUBLIC_NOTION_DB_DOCUMENTS` | Guides & docs |
| `NEXT_PUBLIC_NOTION_DB_MILESTONES` | Milestones |

**Project:**

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_PROJECT_NAME` | Display name |
| `NEXT_PUBLIC_PROJECT_DESCRIPTION` | Description |

## Deployment

Optimized for Vercel. Add all env vars to dashboard.

```bash
npm run build && npm start
```
