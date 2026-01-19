"use client"

import { AuthWrapper } from "@/components/dashboard/auth-wrapper"
import { RecurringTasksSection } from "@/components/dashboard/recurring-tasks-section"

export default function RecurringTasksPage() {
  return (
    <AuthWrapper>
      <div className="p-4">
        <RecurringTasksSection />
      </div>
    </AuthWrapper>
  )
}
