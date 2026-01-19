"use client"

import { AuthWrapper } from "@/components/dashboard/auth-wrapper"
import { WebAnalyticsSection } from "@/components/dashboard/web-analytics-section"

export default function AnalyticsPage() {
  return (
    <AuthWrapper>
      <div className="p-4">
        <WebAnalyticsSection />
      </div>
    </AuthWrapper>
  )
}
