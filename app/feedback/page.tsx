"use client"

import { AuthWrapper } from "@/components/dashboard/auth-wrapper"
import { UserFeedbackSection } from "@/components/dashboard/user-feedback-section"

export default function FeedbackPage() {
  return (
    <AuthWrapper>
      <div className="p-3 sm:p-4 lg:p-6">
        <UserFeedbackSection />
      </div>
    </AuthWrapper>
  )
}
