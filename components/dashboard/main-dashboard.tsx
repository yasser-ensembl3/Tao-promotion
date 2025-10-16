"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardHeader } from "./header"
import { OverviewSection } from "./overview-section"
import { MetricsSection } from "./metrics-section"
import { ProjectTrackingSection } from "./project-tracking-section"
import { GoalsMetricsSection } from "./goals-metrics-section"
import { ReportsSection } from "./reports-section"
import { UserFeedbackSection } from "./user-feedback-section"
import { GuidesDocsSection } from "./guides-docs-section"

export function MainDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  console.log("[MainDashboard] Rendering - Status:", status, "Has Session:", !!session)

  useEffect(() => {
    console.log("[MainDashboard] useEffect triggered - Status:", status, "Has Session:", !!session)
    if (status === "loading") {
      console.log("[MainDashboard] Still loading session...")
      return
    }
    if (!session) {
      console.log("[MainDashboard] No session found, redirecting to signin...")
      router.push("/auth/signin")
    } else {
      console.log("[MainDashboard] Session found for user:", session.user?.email)
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold mb-2">Loading...</div>
          <div className="text-muted-foreground">Please wait while we load your dashboard</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 space-y-6">
        <DashboardHeader />
        <div className="space-y-6">
          <OverviewSection />
          <GuidesDocsSection />
          <ProjectTrackingSection />
          <GoalsMetricsSection />
          <MetricsSection />
          <ReportsSection />
          <UserFeedbackSection />
        </div>
      </div>
    </div>
  )
}