"use client"

import { AuthWrapper } from "@/components/dashboard/auth-wrapper"
import { SalesTrackingSection } from "@/components/dashboard/sales-tracking-section"

export default function SalesPage() {
  return (
    <AuthWrapper>
      <div className="p-4">
        <SalesTrackingSection />
      </div>
    </AuthWrapper>
  )
}
