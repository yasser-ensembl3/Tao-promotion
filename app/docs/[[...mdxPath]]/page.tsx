import Link from 'next/link'
import { AuthWrapper } from '@/components/dashboard/auth-wrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DocsPage() {
  return (
    <AuthWrapper>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Documentation</h1>
          <p className="text-muted-foreground">
            Welcome to MiniVault documentation. Learn how to configure and use the dashboard.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🚀</span>
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Learn how to set up MiniVault for your project. Configure environment variables and connect your services.
              </p>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Clone the repository</li>
                <li>• Configure .env.local with your API keys</li>
                <li>• Set up Notion databases</li>
                <li>• Deploy to Vercel</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>⚙️</span>
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Configure your MiniVault instance with environment variables.
              </p>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• NOTION_TOKEN - Your Notion integration token</li>
                <li>• GOOGLE_CLIENT_ID/SECRET - OAuth credentials</li>
                <li>• GITHUB_ID/SECRET - GitHub OAuth</li>
                <li>• NEXT_PUBLIC_NOTION_DB_* - Database IDs</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📡</span>
                API Reference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                MiniVault provides API routes for various integrations.
              </p>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• /api/notion/* - Notion database operations</li>
                <li>• /api/google/* - Google Drive/Gmail</li>
                <li>• /api/github/* - GitHub repository data</li>
                <li>• /api/auth/* - NextAuth endpoints</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🔗</span>
                External Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Useful links for working with MiniVault technologies.
              </p>
              <ul className="text-sm space-y-2">
                <li>
                  <a href="https://developers.notion.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    Notion API Documentation
                  </a>
                </li>
                <li>
                  <a href="https://nextjs.org/docs" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    Next.js Documentation
                  </a>
                </li>
                <li>
                  <a href="https://next-auth.js.org" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    NextAuth.js Documentation
                  </a>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthWrapper>
  )
}
