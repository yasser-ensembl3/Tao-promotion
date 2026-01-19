"use client"

import { AuthWrapper } from "@/components/dashboard/auth-wrapper"
import { OrdersSection } from "@/components/dashboard/orders-section"

export default function OrdersPage() {
  return (
    <AuthWrapper>
      <div className="p-4">
        <OrdersSection />
      </div>
    </AuthWrapper>
  )
}
