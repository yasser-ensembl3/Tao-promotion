"use client"

import { AuthWrapper } from "@/components/dashboard/auth-wrapper"
import { OrdersSection } from "@/components/dashboard/orders-section"

export default function OrdersPage() {
  return (
    <AuthWrapper>
      <div className="p-3 sm:p-4 lg:p-6">
        <OrdersSection />
      </div>
    </AuthWrapper>
  )
}
