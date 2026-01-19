"use client"

import { AuthWrapper } from "@/components/dashboard/auth-wrapper"
import { UserFeedbackSection } from "@/components/dashboard/user-feedback-section"

export default function FeedbackPage() {
  return (
    <AuthWrapper>
      <div className="p-4">
        <UserFeedbackSection />
      </div>
    </AuthWrapper>
  )
}
