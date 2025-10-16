import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/session-provider'
import { ProjectConfigProvider } from '@/contexts/project-config-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MiniVault - Project Management Suite',
  description: 'Unified project management dashboard integrating Notion, Google Drive, Gmail, GitHub and more.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          <ProjectConfigProvider>
            {children}
          </ProjectConfigProvider>
        </AuthProvider>
      </body>
    </html>
  )
}