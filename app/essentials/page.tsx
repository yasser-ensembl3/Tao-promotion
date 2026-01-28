"use client"

import { AuthWrapper } from "@/components/dashboard/auth-wrapper"
import { EssentialsSection } from "@/components/dashboard/essentials-section"

export default function EssentialsPage() {
  return (
    <AuthWrapper>
      <div className="p-3 sm:p-4 lg:p-6">
        <EssentialsSection />
      </div>
    </AuthWrapper>
  )
}
