import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const revalidate = 0

function extractPropertyValue(property: any): string | number | null {
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
    case "email":
      return property.email || null
    case "phone_number":
      return property.phone_number || null
    case "select":
      return property.select?.name || null
    case "multi_select":
      return property.multi_select?.map((s: any) => s.name).join(", ") || null
    case "checkbox":
      return property.checkbox ? "Yes" : "No"
    case "url":
      return property.url || null
    case "formula":
      if (property.formula.type === "string") return property.formula.string
      if (property.formula.type === "number") return property.formula.number
      if (property.formula.type === "boolean") return property.formula.boolean ? "Yes" : "No"
      if (property.formula.type === "date") return property.formula.date?.start || null
      return null
    case "rollup":
      if (property.rollup.type === "number") return property.rollup.number
      if (property.rollup.type === "array") return property.rollup.array?.length || 0
      return null
    case "created_time":
      return property.created_time || null
    case "last_edited_time":
      return property.last_edited_time || null
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
    const databaseId = searchParams.get("databaseId")

    if (!databaseId) {
      return NextResponse.json(
        { error: "Missing databaseId parameter" },
        { status: 400 }
      )
    }

    const cleanDatabaseId = databaseId.replace(/-/g, "")

    // Query Notion database
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
          sorts: [
            {
              timestamp: "created_time",
              direction: "descending"
            }
          ]
        }),
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Notion API error: ${response.statusText}`)
    }

    const data = await response.json()

    // Parse all properties dynamically
    const orders = data.results.map((page: any) => {
      const properties = page.properties
      const order: Record<string, string | number | null> = {
        id: page.id,
        url: page.url,
        createdTime: page.created_time,
      }

      // Extract all properties
      for (const [propName, propValue] of Object.entries(properties)) {
        order[propName] = extractPropertyValue(propValue)
      }

      return order
    })

    return NextResponse.json({
      orders,
      count: orders.length,
    })
  } catch (error: any) {
    console.error("[Notion Sales API] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch sales data from Notion" },
      { status: 500 }
    )
  }
}
