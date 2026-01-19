"use client"

import { AuthWrapper } from "@/components/dashboard/auth-wrapper"
import { EssentialsSection } from "@/components/dashboard/essentials-section"

export default function EssentialsPage() {
  return (
    <AuthWrapper>
      <div className="p-4">
        <EssentialsSection />
      </div>
    </AuthWrapper>
  )
}
