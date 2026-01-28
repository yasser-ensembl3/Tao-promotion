"use client"

import { AuthWrapper } from "@/components/dashboard/auth-wrapper"
import { OverviewSection } from "@/components/dashboard/overview-section"

export default function OverviewPage() {
  return (
    <AuthWrapper>
      <div className="p-3 sm:p-4 lg:p-6">
        <OverviewSection />
      </div>
    </AuthWrapper>
  )
}
