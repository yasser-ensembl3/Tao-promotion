"use client"

import { AuthWrapper } from "@/components/dashboard/auth-wrapper"
import { OneTimeTasksSection } from "@/components/dashboard/project-tracking-section"

export default function TasksPage() {
  return (
    <AuthWrapper>
      <div className="p-3 sm:p-4 lg:p-6">
        <OneTimeTasksSection />
      </div>
    </AuthWrapper>
  )
}
