"use client"

import { AuthWrapper } from "@/components/dashboard/auth-wrapper"
import { DashboardHeader } from "@/components/dashboard/header"
import { OrdersSection } from "@/components/dashboard/orders-section"
import { GoalsMetricsSection } from "@/components/dashboard/goals-metrics-section"
import { SalesTrackingSection } from "@/components/dashboard/sales-tracking-section"
import { WebAnalyticsSection } from "@/components/dashboard/web-analytics-section"

export default function DashboardPage() {
  return (
    <AuthWrapper>
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
        <DashboardHeader />
        <div className="space-y-4">
          <OrdersSection />
          <GoalsMetricsSection />
          <SalesTrackingSection />
          <WebAnalyticsSection />
        </div>
      </div>
    </AuthWrapper>
  )
}
