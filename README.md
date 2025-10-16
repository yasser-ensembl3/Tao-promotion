# MiniVault - Project Management Suite

A unified project management dashboard that integrates Notion, Google Drive, Gmail, GitHub, and more into a single interface for small teams. Built with Next.js 14 and designed for seamless OAuth integration with your favorite productivity tools.

## ✨ Features

- **🎯 Metrics Overview** - Track key input and output metrics to understand project outcomes
- **📋 Project Tracking** - Monitor tasks and sub-projects from Notion with filters and tags
- **📊 Weekly Reports** - Generate comprehensive weekly summaries when needed
- **📚 Knowledge Base** - Create clear instructions and context for all collaborators
- **🔐 OAuth Integration** - Secure authentication with Google and GitHub
- **⚙️ Configurable** - Connect your own GitHub repos, Google Drive folders, and Notion databases
- **🌙 Dark Mode** - Beautiful dark theme powered by Tailwind CSS
- **📱 Responsive** - Works on desktop, tablet, and mobile devices

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **UI**: Shadcn/UI with Tailwind CSS (Dark theme)
- **Authentication**: NextAuth.js with Google & GitHub OAuth
- **Database**: PostgreSQL with Prisma (planned)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Cloud Console project (for Google OAuth)
- GitHub OAuth App

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Copy the environment variables:
```bash
cp .env.example .env.local
```

3. Configure your environment variables in `.env.local`:
   - `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for development)
   - `NEXTAUTH_SECRET`: Random secret for NextAuth.js
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
   - `GITHUB_ID` & `GITHUB_SECRET`: From GitHub OAuth App
   - `NOTION_TOKEN` & `NOTION_DATABASE_ID`: From Notion integration

### OAuth Setup

#### Google OAuth

1. **Create Project**: Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Enable APIs**: Enable the following APIs in your project:
   - Google+ API
   - Gmail API
   - Google Drive API
   - Google Docs API
3. **Create Credentials**:
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://your-domain.com/api/auth/callback/google`
4. **Copy Credentials**: Save the Client ID and Client Secret to `.env.local`

#### GitHub OAuth

1. **Create OAuth App**:
   - Go to [GitHub Settings](https://github.com/settings/developers) > Developer settings > OAuth Apps
   - Click "New OAuth App"
2. **Configure App**:
   - Application name: "MiniVault" (or your preferred name)
   - Homepage URL: `http://localhost:3000` (development) or your production URL
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
   - For production: `https://your-domain.com/api/auth/callback/github`
3. **Generate Secret**: Click "Generate a new client secret"
4. **Copy Credentials**: Save the Client ID and Client Secret to `.env.local`

#### Notion Integration

1. **Create Integration**:
   - Go to [Notion Integrations](https://www.notion.so/my-integrations)
   - Click "New integration"
   - Name it "MiniVault" and select your workspace
   - Copy the "Internal Integration Token"
2. **Share Database**:
   - Open your Notion database
   - Click "Share" and invite your integration
   - Copy the database ID from the URL: `notion.so/<workspace>/<DATABASE_ID>?v=...`
3. **Save to Environment**: Add token and database ID to `.env.local`

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Building for Production

```bash
npm run build
npm start
```

## Usage

### First-Time Setup

1. **Sign In**: After starting the dev server, navigate to `http://localhost:3000`
2. **Choose Provider**: Sign in with either Google or GitHub
   - Use Google if you want Drive integration
   - Use GitHub if you want repo access
3. **Configure Project**: Click "Project Settings" in the dashboard header
4. **Add Resources**:
   - Enter your GitHub owner/repo (e.g., `octocat/hello-world`)
   - Add your Google Drive folder ID (from folder URL)
   - Add your Notion database ID
5. **Explore Dashboard**: Sections will automatically load data from configured resources

### Dashboard Features

**Overview Section**: View project description, vision, and milestones (placeholder for custom content)

**Guides and Docs**: Quick links to all your configured resources:
- GitHub repository
- Google Drive folder
- Notion database

**Goals & Metrics**: Track objectives and KPIs (extensible for custom metrics)

**User Feedback**: Collect and organize user feedback (placeholder for future implementation)

### Adding Dashboard Sections

To enable additional dashboard sections (Notion, Drive, GitHub):

1. Open `components/dashboard/main-dashboard.tsx`
2. Import the section: `import { NotionSection } from "./notion-section"`
3. Add to the sections div: `<NotionSection />`
4. Save and refresh to see the new section

Available sections:
- `NotionSection` - Live Notion database viewer
- `DriveSection` - Google Drive file browser
- `GitHubSection` - GitHub repo stats and activity

## Project Structure

```
minivault/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/[...nextauth]/   # NextAuth.js handler
│   │   ├── drive/files/          # Google Drive proxy
│   │   ├── github/repo/          # GitHub API proxy
│   │   └── notion/database/      # Notion API proxy
│   ├── auth/signin/              # Sign-in page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # React components
│   ├── auth/                     # Auth wrappers
│   ├── dashboard/                # Dashboard sections
│   ├── settings/                 # Settings dialogs
│   └── ui/                       # shadcn/ui primitives
├── contexts/                     # React contexts
│   └── project-config-context.tsx
├── lib/                          # Utilities
│   ├── auth.ts                   # NextAuth config
│   └── utils.ts                  # Helper functions
├── types/                        # TypeScript types
│   ├── next-auth.d.ts
│   └── project-config.ts
├── .env.example                  # Environment template
├── CLAUDE.md                     # LLM development guide
└── README.md                     # This file
```

## Architecture

### Authentication Flow

1. User clicks "Sign in with Google/GitHub"
2. NextAuth.js redirects to OAuth provider
3. Provider returns authorization code
4. NextAuth exchanges code for access token
5. Token stored in JWT and exposed via session
6. API routes use token for authenticated requests

### Data Flow

1. User configures resources in Project Settings (localStorage)
2. Dashboard sections read config via Context API
3. Sections fetch data from API routes (`/api/notion`, `/api/drive`, `/api/github`)
4. API routes authenticate with user's OAuth token
5. External APIs return data
6. Sections display formatted data

### Key Technologies

- **Next.js 14**: React framework with App Router
- **NextAuth.js**: OAuth authentication library
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Accessible component library built on Radix UI
- **TypeScript**: Type-safe JavaScript
- **React Context**: State management for project config

## Development

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules (`npm run lint`)
- Use `"use client"` directive for client components
- Prefix console logs with component names: `[ComponentName]`
- Use the `cn()` utility for conditional Tailwind classes

### Adding New API Integrations

1. Create API route in `app/api/[service]/route.ts`
2. Authenticate using `getServerSession(authOptions)` for OAuth
3. Or use environment variables for API tokens
4. Return JSON response with error handling
5. Create dashboard section component
6. Fetch data using React hooks (`useState`, `useEffect`)
7. Handle loading and error states

### Environment Variables

Required for full functionality:
```env
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# Notion API
NOTION_TOKEN=secret_your-notion-integration-token
NOTION_DATABASE_ID=your-notion-database-id
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in project settings
4. Update OAuth callback URLs to production domain
5. Deploy

### Other Platforms

This is a standard Next.js 14 app and can be deployed to:
- AWS Amplify
- Netlify
- Railway
- Self-hosted with Node.js

Ensure your platform supports:
- Node.js 18+
- Environment variables
- Next.js App Router

## Troubleshooting

**"No access token" errors**: Make sure you signed in with the correct provider (Google for Drive, GitHub for repos)

**Notion API errors**: Verify your integration has access to the database (click Share → invite integration)

**OAuth callback errors**: Check that callback URLs match exactly in OAuth app settings

**Build errors**: Run `npm run lint` and fix ESLint errors before building

For more detailed troubleshooting, see `CLAUDE.md`.

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Read CLAUDE.md**: Comprehensive development guide for LLMs and humans
2. **Create Issues**: Report bugs or suggest features via GitHub Issues
3. **Fork & PR**: Fork the repo, make changes, and submit a pull request
4. **Code Quality**: Ensure `npm run lint` passes and TypeScript has no errors
5. **Test Thoroughly**: Test in both development and production builds
6. **Document Changes**: Update CLAUDE.md or README.md for significant changes

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For questions or issues:
- Open a GitHub Issue
- Review CLAUDE.md for detailed development guidance
- Check the troubleshooting section above
