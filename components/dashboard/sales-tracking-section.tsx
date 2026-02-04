"use client"

import { useState } from "react"
import { PageSection } from "./page-section"
import { useProjectConfig } from "@/lib/project-config"
import { useCachedFetch } from "@/lib/use-cached-fetch"
import { Button } from "@/components/ui/button"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"

interface SalesRecord {
  id: string
  url: string
  Period: string | null
  "Gross Sales": number | null
  "Net Sales": number | null
  "Total Sales": number | null
  Discounts: number | null
  Returns: number | null
  Taxes: number | null
  Shipping: number | null
  "Paid Orders": number | null
  "Orders Fulfilled": number | null
  "Average Order Value": number | null
  "Avg Order Value": number | null
  "Returning Customer Rate": number | null
}

interface OrderRecord {
  id: string
  url: string
  createdTime: string
  [key: string]: string | number | null
}

type MetricKey = "Total Sales" | "Net Sales" | "Paid Orders" | "Average Order Value" | "Returning Customer Rate"

const METRIC_CONFIGS: Record<MetricKey, { label: string; format: (v: number) => string; color: string }> = {
  "Total Sales": { label: "Total Sales", format: (v) => `$${v.toLocaleString()}`, color: "#666666" },
  "Net Sales": { label: "Net Sales", format: (v) => `$${v.toLocaleString()}`, color: "#666666" },
  "Paid Orders": { label: "Orders", format: (v) => v.toLocaleString(), color: "#666666" },
  "Average Order Value": { label: "AOV", format: (v) => `$${v.toFixed(2)}`, color: "#666666" },
  "Returning Customer Rate": { label: "Return Rate", format: (v) => `${v.toFixed(1)}%`, color: "#666666" },
}

export function SalesTrackingSection() {
  const config = useProjectConfig()
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("Total Sales")
  const [expanded, setExpanded] = useState(false)
  const [showAllOrders, setShowAllOrders] = useState(false)

  // Gère le clic sur une carte : toggle si même carte, sinon ouvrir
  const handleCardClick = (metric: MetricKey) => {
    if (selectedMetric === metric) {
      setExpanded(!expanded)
    } else {
      setSelectedMetric(metric)
      setExpanded(true)
    }
  }

  // Fetch sales data with 60s cache
  const salesUrl = config?.notionDatabases?.salesTracking
    ? `/api/notion/shopify?type=sales&databaseId=${config.notionDatabases.salesTracking}`
    : null
  const { data: salesData, isLoading: loading, refresh: fetchSalesData } = useCachedFetch<{ records: SalesRecord[] }>(salesUrl)
  const records = salesData?.records || []

  // Fetch orders with 60s cache
  const ordersUrl = config?.notionDatabases?.orders
    ? `/api/notion/sales?databaseId=${config.notionDatabases.orders}`
    : null
  const { data: ordersData, isLoading: ordersLoading, refresh: fetchOrders } = useCachedFetch<{ orders: OrderRecord[] }>(ordersUrl)

  // Sort orders by date descending (most recent first)
  const orders = (ordersData?.orders || []).sort((a: OrderRecord, b: OrderRecord) => {
    const dateA = a["Date"] ? new Date(a["Date"] as string).getTime() : 0
    const dateB = b["Date"] ? new Date(b["Date"] as string).getTime() : 0
    return dateB - dateA
  })

  // Get most recent record for summary
  const latestRecord = records.length > 0 ? records[0] : null

  // Get value for a metric (handle both property names for AOV)
  const getMetricValue = (record: SalesRecord, metric: MetricKey): number => {
    if (metric === "Average Order Value") {
      return (record["Average Order Value"] ?? record["Avg Order Value"] ?? 0) as number
    }
    return (record[metric] ?? 0) as number
  }

  // Prepare chart data (reverse for chronological order)
  const chartData = [...records].reverse().map((record) => ({
    period: record.Period || "Unknown",
    value: getMetricValue(record, selectedMetric),
    url: record.url,
  }))

  const keyMetrics = latestRecord ? (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
      {(Object.keys(METRIC_CONFIGS) as MetricKey[]).map((metric) => {
        const config = METRIC_CONFIGS[metric]
        const value = getMetricValue(latestRecord, metric)
        const isSelected = selectedMetric === metric

        return (
          <button
            key={metric}
            onClick={() => handleCardClick(metric)}
            className={`text-center p-2 rounded-lg transition-all cursor-pointer hover:shadow-md ${
              isSelected
                ? "bg-foreground text-background ring-1 ring-foreground"
                : "bg-muted/50 border-border hover:bg-muted"
            } border`}
          >
            <div className={`text-base font-bold ${isSelected ? "text-background" : "text-foreground"}`}>
              {config.format(value)}
            </div>
            <div className={`text-xs ${isSelected ? "text-background/70" : "text-muted-foreground"}`}>
              {config.label}
            </div>
            <div className={`text-[10px] ${isSelected ? "text-background/50" : "text-muted-foreground"}`}>
              {latestRecord.Period}
            </div>
          </button>
        )
      })}
    </div>
  ) : (
    <div className="text-center p-6 rounded-lg bg-muted/50 border border-dashed">
      <p className="text-sm text-muted-foreground">No sales data yet. Configure your Sales Tracking database.</p>
    </div>
  )

  const detailedContent = (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold">Sales Trend</h4>
          <span className="text-xs text-muted-foreground">({records.length} periods)</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchSalesData}
          disabled={loading || !config?.notionDatabases?.salesTracking}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {!config?.notionDatabases?.salesTracking ? (
        <div className="p-3 border rounded-lg text-center border-dashed bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Sales Tracking database not configured.
          </p>
        </div>
      ) : loading ? (
        <div className="p-3 border rounded-lg text-center">
          <p className="text-sm text-muted-foreground">Loading sales data...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="p-3 border rounded-lg text-center border-dashed">
          <p className="text-sm text-muted-foreground">No sales data available</p>
        </div>
      ) : (
        <div className="border rounded-lg p-2">
          {/* Selected metric display */}
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h5 className="text-sm font-semibold">{METRIC_CONFIGS[selectedMetric].label}</h5>
              <p className="text-xs text-muted-foreground">Click a card above to switch metrics</p>
            </div>
            {latestRecord && (
              <div className="text-right">
                <p className="text-xl font-bold text-foreground">
                  {METRIC_CONFIGS[selectedMetric].format(getMetricValue(latestRecord, selectedMetric))}
                </p>
                <p className="text-xs text-muted-foreground">Latest: {latestRecord.Period}</p>
              </div>
            )}
          </div>

          {/* Chart */}
          <div className="h-40 sm:h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" style={{ fontSize: "12px" }} />
                <YAxis style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                  formatter={(value: number) => [METRIC_CONFIGS[selectedMetric].format(value), METRIC_CONFIGS[selectedMetric].label]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={METRIC_CONFIGS[selectedMetric].color}
                  strokeWidth={2}
                  dot={{ fill: METRIC_CONFIGS[selectedMetric].color, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Breakdown for latest period */}
          {latestRecord && (
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Gross Sales</p>
                <p className="font-semibold">${(latestRecord["Gross Sales"] ?? 0).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Discounts</p>
                <p className="font-semibold text-foreground">-${(latestRecord.Discounts ?? 0).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Returns</p>
                <p className="font-semibold text-foreground">-${(latestRecord.Returns ?? 0).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Shipping + Tax</p>
                <p className="font-semibold">${((latestRecord.Shipping ?? 0) + (latestRecord.Taxes ?? 0)).toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Orders section */}
          <div className="mt-2 border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-semibold">Orders</h5>
              <Button
                size="sm"
                variant="ghost"
                onClick={fetchOrders}
                disabled={ordersLoading || !config?.notionDatabases?.orders}
                className="h-6 px-2 text-xs"
              >
                {ordersLoading ? "..." : "Refresh"}
              </Button>
            </div>

            {!config?.notionDatabases?.orders ? (
              <div className="p-2 border rounded-lg text-center border-dashed bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  Orders database not configured. Add NEXT_PUBLIC_NOTION_DB_ORDERS to your environment.
                </p>
              </div>
            ) : ordersLoading ? (
              <div className="p-2 border rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-2 border rounded-lg text-center border-dashed">
                <p className="text-xs text-muted-foreground">No orders yet</p>
              </div>
            ) : (
              <>
                {/* Key metrics summary */}
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <div className="p-2 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm font-bold text-foreground">{orders.length}</p>
                    <p className="text-[10px] text-muted-foreground">Orders</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm font-bold text-foreground">
                      {orders.reduce((sum, o) => sum + (Number(o["Items"]) || 0), 0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Items</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm font-bold text-foreground">
                      ${orders.reduce((sum, o) => sum + (Number(o["Total $"]) || 0), 0).toFixed(0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Revenue</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm font-bold text-foreground">
                      {orders.filter(o => o["Fulfillment"] === "Fulfilled").length}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Fulfilled</p>
                  </div>
                </div>

                {/* Orders list */}
                <div className="space-y-1">
                  {(showAllOrders ? orders : orders.slice(0, 5)).map((order) => (
                    <a
                      key={order.id}
                      href={order.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-mono text-muted-foreground w-14 flex-shrink-0">
                        {order["Order"] || "-"}
                      </span>
                      <span className="font-medium flex-1 truncate">
                        {order["Customer"] || "-"}
                      </span>
                      <span className="text-muted-foreground w-20 text-right flex-shrink-0">
                        {order["Date"] || "-"}
                      </span>
                      <span className="text-foreground w-8 text-center flex-shrink-0">
                        {order["Items"] || 0}x
                      </span>
                      <span className="font-semibold text-foreground w-12 text-right flex-shrink-0">
                        ${Number(order["Total $"] || 0).toFixed(0)}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 bg-muted text-muted-foreground">
                        {order["Payment"] || "Pending"}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 bg-muted text-muted-foreground">
                        {order["Fulfillment"] || "Unfulfilled"}
                      </span>
                    </a>
                  ))}
                </div>

                {/* Show all button */}
                {orders.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllOrders(!showAllOrders)}
                    className="w-full mt-2 text-xs"
                  >
                    {showAllOrders ? "Show less" : `Show all ${orders.length} orders`}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <PageSection
      title="Sales"
      description="Shopify sales and order tracking"
      icon=""
      keyMetrics={keyMetrics}
      detailedContent={detailedContent}
      expanded={expanded}
      onExpandedChange={setExpanded}
    />
  )
}
