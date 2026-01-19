"use client"

import { AuthWrapper } from "@/components/dashboard/auth-wrapper"
import { MetricsSection } from "@/components/dashboard/metrics-section"

export default function MetricsPage() {
  return (
    <AuthWrapper>
      <div className="p-4">
        <MetricsSection />
      </div>
    </AuthWrapper>
  )
}
