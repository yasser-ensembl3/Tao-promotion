import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/session-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MiniVault - Project Management Suite',
  description: 'Unified project management dashboard integrating Notion, Google Drive, Gmail, GitHub and more.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
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
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}