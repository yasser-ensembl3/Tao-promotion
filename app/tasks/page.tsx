"use client"

import { AuthWrapper } from "@/components/dashboard/auth-wrapper"
import { OneTimeTasksSection } from "@/components/dashboard/project-tracking-section"

export default function TasksPage() {
  return (
    <AuthWrapper>
      <div className="p-4">
        <OneTimeTasksSection />
      </div>
    </AuthWrapper>
  )
}
