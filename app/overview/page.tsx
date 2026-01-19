"use client"

import { AuthWrapper } from "@/components/dashboard/auth-wrapper"
import { OverviewSection } from "@/components/dashboard/overview-section"

export default function OverviewPage() {
  return (
    <AuthWrapper>
      <div className="p-4">
        <OverviewSection />
      </div>
    </AuthWrapper>
  )
}
