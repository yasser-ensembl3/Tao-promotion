import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

    // Query Notion database (without sorting to avoid errors)
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

    // Parse and format the results
    const metrics = data.results.map((page: any) => {
      const properties = page.properties

      // Get metric name
      const nameProp = properties["Metric Name"] || properties.Name || properties.name
      const type = nameProp?.title?.[0]?.plain_text ||
                   nameProp?.rich_text?.[0]?.plain_text ||
                   "Untitled"

      // Get number value (handle multi_select, rich_text, or number)
      const valueProp = properties.Number || properties.number
      const value = valueProp?.number ||
                    (valueProp?.multi_select?.[0]?.name ? parseFloat(valueProp.multi_select[0].name) : null) ||
                    (valueProp?.rich_text?.[0]?.plain_text ? parseFloat(valueProp.rich_text[0].plain_text) : null) ||
                    null

      // Get last updated date
      const dateProp = properties["Last Updated"] || properties.Date || properties.date
      const date = dateProp?.date?.start || page.created_time

      return {
        id: page.id,
        type,
        value,
        date,
        url: page.url,
      }
    })

    return NextResponse.json({ metrics })
  } catch (error: any) {
    console.error("[Notion Metrics API] Error fetching metrics:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch metrics from Notion" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const notionToken = process.env.NOTION_TOKEN

    if (!notionToken) {
      return NextResponse.json(
        { error: "Notion integration token not configured" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { databaseId, type, value, date } = body

    console.log("[Notion Metrics API] POST request received:", {
      type,
      value,
      date
    })

    if (!databaseId || !type || value === undefined || value === null) {
      return NextResponse.json(
        { error: "Missing required fields: databaseId, type, and value" },
        { status: 400 }
      )
    }

    const cleanDatabaseId = databaseId.replace(/-/g, "")

    // Get database schema to check property types
    const schemaResponse = await fetch(
      `https://api.notion.com/v1/databases/${cleanDatabaseId}`,
      {
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
        },
      }
    )

    let numberPropertyType = "number"
    if (schemaResponse.ok) {
      const schemaData = await schemaResponse.json()
      const numberProp = schemaData.properties?.Number || schemaData.properties?.number
      if (numberProp) {
        numberPropertyType = numberProp.type
        console.log("[Notion Metrics API] Number property type:", numberPropertyType)
      }
    }

    // Build properties object
    const properties: any = {
      "Metric Name": {
        title: [
          {
            text: {
              content: type,
            },
          },
        ],
      },
    }

    // Handle Number property based on its type
    if (numberPropertyType === "multi_select") {
      properties.Number = {
        multi_select: [
          {
            name: value.toString(),
          },
        ],
      }
    } else if (numberPropertyType === "rich_text") {
      properties.Number = {
        rich_text: [
          {
            type: "text",
            text: {
              content: value.toString(),
            },
          },
        ],
      }
    } else {
      // Default to number type
      properties.Number = {
        number: parseFloat(value),
      }
    }

    if (date) {
      properties["Last Updated"] = {
        date: {
          start: date,
        },
      }
    }

    // Create new metric page
    const createResponse = await fetch(
      `https://api.notion.com/v1/pages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parent: {
            type: "database_id",
            database_id: cleanDatabaseId,
          },
          properties,
        }),
      }
    )

    if (!createResponse.ok) {
      const error = await createResponse.json()
      console.error("[Notion Metrics API] Create error:", error)
      console.error("[Notion Metrics API] Properties sent:", JSON.stringify(properties, null, 2))
      return NextResponse.json(
        {
          error: error.message || "Failed to create metric",
          details: error,
        },
        { status: createResponse.status }
      )
    }

    const newMetric = await createResponse.json()

    return NextResponse.json({
      success: true,
      metric: {
        id: newMetric.id,
        url: newMetric.url,
      },
    })
  } catch (error) {
    console.error("[Notion Metrics API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
