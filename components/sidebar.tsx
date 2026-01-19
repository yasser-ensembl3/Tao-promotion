"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/orders", label: "Orders", icon: "📦" },
  { href: "/goals", label: "Goals", icon: "🎯" },
  { href: "/metrics", label: "Metrics", icon: "📈" },
  { href: "/sales", label: "Sales Analytics", icon: "💰" },
  { href: "/analytics", label: "Web Analytics", icon: "🌐" },
  { href: "/tasks", label: "Tasks", icon: "✅" },
  { href: "/recurring-tasks", label: "Recurring Tasks", icon: "🔄" },
  { href: "/essentials", label: "Essentials", icon: "⭐" },
  { href: "/guides", label: "Guides & Docs", icon: "📚" },
  { href: "/overview", label: "Overview", icon: "📋" },
  { href: "/feedback", label: "Feedback", icon: "💬" },
  { href: "/reports", label: "Reports", icon: "📝" },
  { type: "separator" },
  { href: "/docs", label: "Documentation", icon: "📖" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen border-r border-border bg-card p-4 flex-shrink-0">
      <div className="mb-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🔐</span>
          <span className="font-bold text-xl">MiniVault</span>
        </Link>
      </div>
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
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
