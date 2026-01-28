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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Unfulfilled */}
      <button
        onClick={() => handleCardClick("unfulfilled")}
        className={`p-3 rounded-lg border text-left transition-all cursor-pointer hover:shadow-md ${
          selectedFilter === "unfulfilled"
            ? "ring-2 ring-orange-400 bg-orange-200 border-orange-400 dark:bg-orange-900 dark:border-orange-600"
            : unfulfilledOrders.length > 0
              ? "bg-orange-100 border-orange-300 dark:bg-orange-950 dark:border-orange-800 hover:bg-orange-150"
              : "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800"
        }`}
      >
        <div className={`text-2xl font-bold ${
          unfulfilledOrders.length > 0 ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"
        }`}>
          {unfulfilledOrders.length}
        </div>
        <div className="text-xs text-muted-foreground">Unfulfilled</div>
        {unfulfilledOrders.length > 0 && (
          <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            ${unfulfilledRevenue.toFixed(0)} pending
          </div>
        )}
      </button>

      {/* Total Orders */}
      <button
        onClick={() => handleCardClick("all")}
        className={`p-3 rounded-lg border text-left transition-all cursor-pointer hover:shadow-md ${
          selectedFilter === "all"
            ? "ring-2 ring-blue-400 bg-blue-200 border-blue-400 dark:bg-blue-900 dark:border-blue-600"
            : "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800 hover:bg-blue-100"
        }`}
      >
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{orders.length}</div>
        <div className="text-xs text-muted-foreground">Total Orders</div>
      </button>

      {/* Total Revenue */}
      <button
        onClick={() => handleCardClick("revenue")}
        className={`p-3 rounded-lg border text-left transition-all cursor-pointer hover:shadow-md ${
          selectedFilter === "revenue"
            ? "ring-2 ring-emerald-400 bg-emerald-200 border-emerald-400 dark:bg-emerald-900 dark:border-emerald-600"
            : "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800 hover:bg-emerald-100"
        }`}
      >
        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
          ${totalRevenue.toFixed(0)}
        </div>
        <div className="text-xs text-muted-foreground">Revenue</div>
      </button>

      {/* Refunded */}
      <button
        onClick={() => handleCardClick("refunded")}
        className={`p-3 rounded-lg border text-left transition-all cursor-pointer hover:shadow-md ${
          selectedFilter === "refunded"
            ? "ring-2 ring-red-400 bg-red-200 border-red-400 dark:bg-red-900 dark:border-red-600"
            : refundedOrders.length > 0
              ? "bg-red-100 border-red-300 dark:bg-red-950 dark:border-red-800 hover:bg-red-150"
              : "bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800 hover:bg-gray-100"
        }`}
      >
        <div className={`text-2xl font-bold ${
          refundedOrders.length > 0 ? "text-red-600 dark:text-red-400" : "text-gray-400"
        }`}>
          {refundedOrders.length}
        </div>
        <div className="text-xs text-muted-foreground">Refunded</div>
      </button>
    </div>
  ) : (
    <div className="text-center p-4 rounded-lg bg-muted/50 border border-dashed">
      <p className="text-sm text-muted-foreground">No orders yet</p>
    </div>
  )

  const OrderRow = ({ order }: { order: OrderRecord }) => (
    <a
      href={order.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 text-sm p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
    >
      <span className="font-mono text-muted-foreground w-16 flex-shrink-0">
        {order["Order"] || "-"}
      </span>
      <span className="font-medium flex-1 truncate">
        {order["Customer"] || "-"}
      </span>
      <span className="text-muted-foreground w-24 text-right flex-shrink-0 hidden sm:block">
        {order["Date"] || "-"}
      </span>
      <span className="text-blue-600 w-10 text-center flex-shrink-0">
        {order["Items"] || 0}x
      </span>
      <span className="font-semibold text-emerald-600 w-16 text-right flex-shrink-0">
        ${Number(order["Total $"] || 0).toFixed(0)}
      </span>
      <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${
        order["Payment"] === "Paid"
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
          : order["Payment"] === "Refunded"
          ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
      }`}>
        {order["Payment"] || "Pending"}
      </span>
      <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${
        order["Fulfillment"] === "Fulfilled"
          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
          : "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
      }`}>
        {order["Fulfillment"] || "Unfulfilled"}
      </span>
    </a>
  )

  const filteredOrders = getFilteredOrders()

  const detailedContent = (
    <div className="space-y-4">
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
        <div className="p-8 border rounded-lg text-center border-dashed bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Orders database not configured. Add NEXT_PUBLIC_NOTION_DB_ORDERS to your environment.
          </p>
        </div>
      ) : loading ? (
        <div className="p-8 border rounded-lg text-center">
          <p className="text-sm text-muted-foreground">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-8 border rounded-lg text-center border-dashed">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Total Items</p>
              <p className="text-lg font-bold">
                {filteredOrders.reduce((sum, o) => sum + (Number(o["Items"]) || 0), 0)}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Avg Order</p>
              <p className="text-lg font-bold">
                ${filteredOrders.length > 0 ? (filteredOrders.reduce((sum, o) => sum + (Number(o["Total $"]) || 0), 0) / filteredOrders.length).toFixed(0) : 0}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Fulfillment Rate</p>
              <p className="text-lg font-bold">
                {filteredOrders.length > 0 ? ((filteredOrders.filter(o => o["Fulfillment"] === "Fulfilled").length / filteredOrders.length) * 100).toFixed(0) : 0}%
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Pending Payment</p>
              <p className="text-lg font-bold text-yellow-600">
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
      icon="📦"
      keyMetrics={keyMetrics}
      detailedContent={detailedContent}
      expanded={expanded}
      onExpandedChange={setExpanded}
    />
  )
}
