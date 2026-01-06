import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Sales Tracking database properties
const SALES_PROPERTIES = [
  "Period",
  "Gross Sales",
  "Net Sales",
  "Total Sales",
  "Discounts",
  "Returns",
  "Taxes",
  "Shipping",
  "Paid Orders",
  "Orders Fulfilled",
  "Average Order Value",
  "Avg Order Value",
  "Returning Customer Rate",
]

// Web Analytics database properties
const ANALYTICS_PROPERTIES = [
  "Period",
  "Sessions",
  "Conversion Rate",
  "Add to Cart Rate",
  "Checkout Rate",
  "Checkout Reached Rate",
  "Direct",
  "Google",
  "Facebook",
  "Twitter",
  "LinkedIn",
  "Other",
  "Desktop",
  "Mobile",
  "Top Page",
]

function extractPropertyValue(property: any): number | string | null {
  if (!property) return null

  switch (property.type) {
    case "number":
      return property.number
    case "title":
      return property.title?.[0]?.plain_text || null
    case "rich_text":
      return property.rich_text?.[0]?.plain_text || null
    case "date":
      return property.date?.start || null
    default:
      return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const notionToken = process.env.NOTION_TOKEN

    if (!notionToken) {
      return NextResponse.json(
        { error: "NOTION_TOKEN not configured" },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // "sales" or "analytics"
    const databaseId = searchParams.get("databaseId")

    if (!type || !databaseId) {
      return NextResponse.json(
        { error: "Missing type or databaseId parameter" },
        { status: 400 }
      )
    }

    const cleanDatabaseId = databaseId.replace(/-/g, "")

    // Query Notion database sorted by Period descending
    const response = await fetch(
      `https://api.notion.com/v1/databases/${cleanDatabaseId}/query`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page_size: 100,
        }),
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Notion API error: ${response.statusText}`)
    }

    const data = await response.json()

    // Parse results based on type
    const records = data.results.map((page: any) => {
      const properties = page.properties
      const record: Record<string, number | string | null> = {
        id: page.id,
        url: page.url,
      }

      // Extract all properties
      const propsToExtract = type === "sales" ? SALES_PROPERTIES : ANALYTICS_PROPERTIES

      for (const propName of propsToExtract) {
        const prop = properties[propName]
        if (prop) {
          record[propName] = extractPropertyValue(prop)
        }
      }

      return record
    })

    // Sort by Period chronologically (format: "Mon D-D YYYY" e.g., "Jan 1-31 2025")
    const monthOrder: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    }

    const parsePeriod = (period: string): { year: number; month: number } => {
      const match = period.match(/^(\w{3})\s+\d+-\d+\s+(\d{4})$/)
      if (match) {
        const monthName = match[1]
        const year = parseInt(match[2], 10)
        return { year, month: monthOrder[monthName] ?? 0 }
      }
      return { year: 0, month: 0 }
    }

    records.sort((a: any, b: any) => {
      const periodA = parsePeriod(String(a.Period || ""))
      const periodB = parsePeriod(String(b.Period || ""))
      // Sort descending (most recent first)
      if (periodB.year !== periodA.year) {
        return periodB.year - periodA.year
      }
      return periodB.month - periodA.month
    })

    return NextResponse.json({
      type,
      records,
      count: records.length,
    })
  } catch (error: any) {
    console.error("[Notion Shopify API] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch Shopify data from Notion" },
      { status: 500 }
    )
  }
}
