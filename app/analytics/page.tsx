"use client"

import { AuthWrapper } from "@/components/dashboard/auth-wrapper"
import { GoalsMetricsSection } from "@/components/dashboard/goals-metrics-section"
import { MetricsSection } from "@/components/dashboard/metrics-section"
import { SalesTrackingSection } from "@/components/dashboard/sales-tracking-section"
import { WebAnalyticsSection } from "@/components/dashboard/web-analytics-section"

export default function AnalyticsPage() {
  return (
    <AuthWrapper>
      <div className="p-4 space-y-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track goals, metrics, sales and web traffic in one place
          </p>
        </div>

        <GoalsMetricsSection />
        <MetricsSection />
        <SalesTrackingSection />
        <WebAnalyticsSection />
      </div>
    </AuthWrapper>
  )
}
