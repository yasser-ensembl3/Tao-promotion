import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/auth/session-provider'
import { SWRProvider } from '@/lib/swr-config'
import { Sidebar, MobileNav } from '@/components/sidebar'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MiniVault - Project Management Suite',
  description: 'Unified project management dashboard integrating Notion, Google Drive, Gmail, GitHub and more.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <SWRProvider>
            <div className="flex min-h-screen">
              <MobileNav />
              <Sidebar />
              <main className="flex-1 overflow-auto pt-14 lg:pt-0">
                {children}
              </main>
            </div>
          </SWRProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
