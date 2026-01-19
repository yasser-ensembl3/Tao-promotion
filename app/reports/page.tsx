"use client"

import { AuthWrapper } from "@/components/dashboard/auth-wrapper"
import { ReportsSection } from "@/components/dashboard/reports-section"

export default function ReportsPage() {
  return (
    <AuthWrapper>
      <div className="p-4">
        <ReportsSection />
      </div>
    </AuthWrapper>
  )
}
