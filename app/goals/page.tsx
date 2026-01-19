"use client"

import { AuthWrapper } from "@/components/dashboard/auth-wrapper"
import { GoalsMetricsSection } from "@/components/dashboard/goals-metrics-section"

export default function GoalsPage() {
  return (
    <AuthWrapper>
      <div className="p-4">
        <GoalsMetricsSection />
      </div>
    </AuthWrapper>
  )
}
