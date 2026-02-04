"use client"

import { useState } from "react"
import { PageSection } from "./page-section"
import { useProjectConfig } from "@/lib/project-config"
import { useCachedFetch } from "@/lib/use-cached-fetch"
import { Button } from "@/components/ui/button"

interface OrderRecord {
  id: string
  url: string
  createdTime: string
  [key: string]: string | number | null
}

type FilterType = "unfulfilled" | "all" | "revenue" | "refunded"

export function OrdersSection() {
  const config = useProjectConfig()
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("unfulfilled")
  const [expanded, setExpanded] = useState(false)

  // Gère le clic sur une carte : toggle si même filtre, sinon ouvrir
  const handleCardClick = (filter: FilterType) => {
    if (selectedFilter === filter) {
      setExpanded(!expanded)
    } else {
      setSelectedFilter(filter)
      setExpanded(true)
    }
  }

  // Fetch orders with 60s cache
  const apiUrl = config?.notionDatabases?.orders
    ? `/api/notion/sales?databaseId=${config.notionDatabases.orders}`
    : null
  const { data: ordersData, isLoading: loading, refresh: fetchOrders } = useCachedFetch<{ orders: OrderRecord[] }>(apiUrl)

  // Sort orders by date descending (most recent first)
  const orders = (ordersData?.orders || []).sort((a: OrderRecord, b: OrderRecord) => {
    const dateA = a["Date"] ? new Date(a["Date"] as string).getTime() : 0
    const dateB = b["Date"] ? new Date(b["Date"] as string).getTime() : 0
    return dateB - dateA
  })

  // Filter orders by status
  const unfulfilledOrders = orders.filter(o => o["Fulfillment"] !== "Fulfilled")
  const fulfilledOrders = orders.filter(o => o["Fulfillment"] === "Fulfilled")
  const refundedOrders = orders.filter(o => o["Payment"] === "Refunded")
  const pendingPaymentOrders = orders.filter(o => o["Payment"] !== "Paid" && o["Payment"] !== "Refunded")

  // Calculate totals
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o["Total $"]) || 0), 0)
  const unfulfilledRevenue = unfulfilledOrders.reduce((sum, o) => sum + (Number(o["Total $"]) || 0), 0)

  // Get filtered orders based on selection
  const getFilteredOrders = () => {
    switch (selectedFilter) {
      case "unfulfilled":
        return unfulfilledOrders
      case "all":
        return orders
      case "refunded":
        return refundedOrders
      case "revenue":
        return orders // Show all orders sorted by revenue
      default:
        return orders
    }
  }

  const getFilterTitle = () => {
    switch (selectedFilter) {
      case "unfulfilled":
        return `${unfulfilledOrders.length} Unfulfilled Order${unfulfilledOrders.length !== 1 ? "s" : ""}`
      case "all":
        return `${orders.length} Total Order${orders.length !== 1 ? "s" : ""}`
      case "refunded":
        return `${refundedOrders.length} Refunded Order${refundedOrders.length !== 1 ? "s" : ""}`
      case "revenue":
        return `$${totalRevenue.toFixed(0)} Total Revenue`
      default:
        return "Orders"
    }
  }

  const keyMetrics = orders.length > 0 ? (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {/* Unfulfilled */}
      <button
        onClick={() => handleCardClick("unfulfilled")}
        className={`p-2 rounded-lg border text-left transition-all cursor-pointer hover:shadow-md ${
          selectedFilter === "unfulfilled"
            ? "bg-foreground text-background ring-1 ring-foreground"
            : "bg-muted/50 border-border hover:bg-muted"
        }`}
      >
        <div className={`text-base font-bold ${selectedFilter === "unfulfilled" ? "text-background" : "text-foreground"}`}>
          {unfulfilledOrders.length}
        </div>
        <div className={`text-xs ${selectedFilter === "unfulfilled" ? "text-background/70" : "text-muted-foreground"}`}>Unfulfilled</div>
        {unfulfilledOrders.length > 0 && (
          <div className={`text-xs mt-1 ${selectedFilter === "unfulfilled" ? "text-background/70" : "text-muted-foreground"}`}>
            ${unfulfilledRevenue.toFixed(0)} pending
          </div>
        )}
      </button>

      {/* Total Orders */}
      <button
        onClick={() => handleCardClick("all")}
        className={`p-2 rounded-lg border text-left transition-all cursor-pointer hover:shadow-md ${
          selectedFilter === "all"
            ? "bg-foreground text-background ring-1 ring-foreground"
            : "bg-muted/50 border-border hover:bg-muted"
        }`}
      >
        <div className={`text-base font-bold ${selectedFilter === "all" ? "text-background" : "text-foreground"}`}>{orders.length}</div>
        <div className={`text-xs ${selectedFilter === "all" ? "text-background/70" : "text-muted-foreground"}`}>Total Orders</div>
      </button>

      {/* Total Revenue */}
      <button
        onClick={() => handleCardClick("revenue")}
        className={`p-2 rounded-lg border text-left transition-all cursor-pointer hover:shadow-md ${
          selectedFilter === "revenue"
            ? "bg-foreground text-background ring-1 ring-foreground"
            : "bg-muted/50 border-border hover:bg-muted"
        }`}
      >
        <div className={`text-base font-bold ${selectedFilter === "revenue" ? "text-background" : "text-foreground"}`}>
          ${totalRevenue.toFixed(0)}
        </div>
        <div className={`text-xs ${selectedFilter === "revenue" ? "text-background/70" : "text-muted-foreground"}`}>Revenue</div>
      </button>

      {/* Refunded */}
      <button
        onClick={() => handleCardClick("refunded")}
        className={`p-2 rounded-lg border text-left transition-all cursor-pointer hover:shadow-md ${
          selectedFilter === "refunded"
            ? "bg-foreground text-background ring-1 ring-foreground"
            : "bg-muted/50 border-border hover:bg-muted"
        }`}
      >
        <div className={`text-base font-bold ${selectedFilter === "refunded" ? "text-background" : "text-foreground"}`}>
          {refundedOrders.length}
        </div>
        <div className={`text-xs ${selectedFilter === "refunded" ? "text-background/70" : "text-muted-foreground"}`}>Refunded</div>
      </button>
    </div>
  ) : (
    <div className="text-center p-2 rounded-lg bg-muted/50 border border-dashed">
      <p className="text-sm text-muted-foreground">No orders yet</p>
    </div>
  )

  const OrderRow = ({ order }: { order: OrderRecord }) => (
    <a
      href={order.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block text-sm p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
    >
      {/* Mobile layout */}
      <div className="flex flex-col gap-2 sm:hidden">
        <div className="flex items-center justify-between">
          <span className="font-mono text-muted-foreground text-xs">
            {order["Order"] || "-"}
          </span>
          <span className="font-semibold text-foreground">
            ${Number(order["Total $"] || 0).toFixed(0)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-foreground text-xs">{order["Items"] || 0}x</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {order["Payment"] || "Pending"}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {order["Fulfillment"] === "Fulfilled" ? "Done" : "Pending"}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden sm:flex items-center gap-2">
        <span className="font-mono text-muted-foreground w-20 flex-shrink-0">
          {order["Order"] || "-"}
        </span>
        <span className="text-muted-foreground w-24 text-right flex-shrink-0 hidden md:block">
          {order["Date"] || "-"}
        </span>
        <span className="text-foreground w-8 text-center flex-shrink-0">
          {order["Items"] || 0}x
        </span>
        <span className="font-semibold text-foreground w-12 text-right flex-shrink-0">
          ${Number(order["Total $"] || 0).toFixed(0)}
        </span>
        <span className="text-xs px-2 py-1 rounded flex-shrink-0 bg-muted text-muted-foreground">
          {order["Payment"] || "Pending"}
        </span>
        <span className="text-xs px-2 py-1 rounded flex-shrink-0 bg-muted text-muted-foreground">
          {order["Fulfillment"] || "Unfulfilled"}
        </span>
      </div>
    </a>
  )

  const filteredOrders = getFilteredOrders()

  const detailedContent = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{getFilterTitle()}</h4>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchOrders}
          disabled={loading || !config?.notionDatabases?.orders}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {!config?.notionDatabases?.orders ? (
        <div className="p-3 border rounded-lg text-center border-dashed bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Orders database not configured. Add NEXT_PUBLIC_NOTION_DB_ORDERS to your environment.
          </p>
        </div>
      ) : loading ? (
        <div className="p-3 border rounded-lg text-center">
          <p className="text-sm text-muted-foreground">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-3 border rounded-lg text-center border-dashed">
          <p className="text-sm text-muted-foreground">
            {selectedFilter === "unfulfilled" && "All orders are fulfilled!"}
            {selectedFilter === "refunded" && "No refunded orders"}
            {selectedFilter === "all" && "No orders yet"}
            {selectedFilter === "revenue" && "No orders yet"}
          </p>
        </div>
      ) : (
        <>
          {/* Orders list */}
          <div className="border rounded-lg overflow-hidden">
            <div className="p-3 space-y-2">
              {filteredOrders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Total Items</p>
              <p className="text-sm font-bold">
                {filteredOrders.reduce((sum, o) => sum + (Number(o["Items"]) || 0), 0)}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Avg Order</p>
              <p className="text-sm font-bold">
                ${filteredOrders.length > 0 ? (filteredOrders.reduce((sum, o) => sum + (Number(o["Total $"]) || 0), 0) / filteredOrders.length).toFixed(0) : 0}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Fulfillment Rate</p>
              <p className="text-sm font-bold">
                {filteredOrders.length > 0 ? ((filteredOrders.filter(o => o["Fulfillment"] === "Fulfilled").length / filteredOrders.length) * 100).toFixed(0) : 0}%
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Pending Payment</p>
              <p className="text-lg font-bold text-foreground">
                {filteredOrders.filter(o => o["Payment"] !== "Paid" && o["Payment"] !== "Refunded").length}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )

  return (
    <PageSection
      title="Orders"
      description="Track order fulfillment status"
      icon=""
      keyMetrics={keyMetrics}
      detailedContent={detailedContent}
      expanded={expanded}
      onExpandedChange={setExpanded}
    />
  )
}
