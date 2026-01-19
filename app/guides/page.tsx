"use client"

import { AuthWrapper } from "@/components/dashboard/auth-wrapper"
import { GuidesDocsSection } from "@/components/dashboard/guides-docs-section"

export default function GuidesPage() {
  return (
    <AuthWrapper>
      <div className="p-4">
        <GuidesDocsSection />
      </div>
    </AuthWrapper>
  )
}
