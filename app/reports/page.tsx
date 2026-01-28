"use client"

import { AuthWrapper } from "@/components/dashboard/auth-wrapper"
import { ReportsSection } from "@/components/dashboard/reports-section"

export default function ReportsPage() {
  return (
    <AuthWrapper>
      <div className="p-3 sm:p-4 lg:p-6">
        <ReportsSection />
      </div>
    </AuthWrapper>
  )
}
