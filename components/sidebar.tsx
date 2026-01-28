"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/orders", label: "Orders", icon: "📦" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
  { href: "/tasks", label: "Tasks", icon: "✅" },
  { href: "/recurring-tasks", label: "Recurring Tasks", icon: "🔄" },
  { href: "/essentials", label: "Essentials", icon: "⭐" },
  { href: "/guides", label: "Guides & Docs", icon: "📚" },
  { href: "/feedback", label: "Feedback", icon: "💬" },
  { type: "separator" },
  { href: "/docs", label: "Documentation", icon: "📖" },
]

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {navItems.map((item, index) => {
        if (item.type === "separator") {
          return <hr key={index} className="my-4 border-border" />
        }

        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

        return (
          <Link
            key={item.href}
            href={item.href!}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              isActive
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarLogo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2">
      <span className="text-2xl">🔐</span>
      <span className="font-bold text-xl">MiniVault</span>
    </Link>
  )
}

// Mobile navigation with hamburger menu
export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <SidebarLogo />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="p-4 border-b border-border">
              <SheetTitle className="text-left">
                <SidebarLogo />
              </SheetTitle>
            </SheetHeader>
            <div className="p-4">
              <SidebarNav onNavigate={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

// Desktop sidebar
export function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-col w-64 min-h-screen border-r border-border bg-card p-4 flex-shrink-0">
      <div className="mb-6">
        <SidebarLogo />
      </div>
      <SidebarNav />
    </aside>
  )
}
