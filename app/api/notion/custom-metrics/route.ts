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
              property: "Date",
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

    // Parse and format the results
    const metrics = data.results.map((page: any) => {
      const properties = page.properties

      // Get name
      const nameProp = properties.Name || properties.name
      const name = nameProp?.title?.[0]?.plain_text || "Untitled"

      // Get value
      const valueProp = properties.Value || properties.value
      const value = valueProp?.rich_text?.[0]?.plain_text || ""

      // Get date
      const dateProp = properties.Date || properties.date
      const date = dateProp?.date?.start || page.created_time

      // Get description
      const descriptionProp = properties.Description || properties.description
      const description = descriptionProp?.rich_text?.[0]?.plain_text || ""

      // Get color
      const colorProp = properties.Color || properties.color
      const color = colorProp?.select?.name?.toLowerCase() || "blue"

      // Get icon
      const iconProp = properties.Icon || properties.icon
      const icon = iconProp?.rich_text?.[0]?.plain_text || "📊"

      return {
        id: page.id,
        name,
        value,
        date,
        description,
        color,
        icon
      }
    })

    return NextResponse.json({ metrics })
  } catch (error: any) {
    console.error("[Notion Custom Metrics API] Error fetching metrics:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch custom metrics from Notion" },
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
    const { databaseId, name, value, date, description, color, icon } = body

    console.log("[Notion Custom Metrics API] POST request received:", {
      name,
      value,
      date,
      description,
      color,
      icon
    })

    if (!databaseId || !name || !value) {
      return NextResponse.json(
        { error: "Missing required fields: databaseId, name, and value" },
        { status: 400 }
      )
    }

    const cleanDatabaseId = databaseId.replace(/-/g, "")

    // Build properties object
    const properties: any = {
      Name: {
        title: [
          {
            text: {
              content: name,
            },
          },
        ],
      },
      Value: {
        rich_text: [
          {
            type: "text",
            text: {
              content: value.toString(),
            },
          },
        ],
      },
    }

    if (date) {
      properties.Date = {
        date: {
          start: date,
        },
      }
    }

    if (description) {
      properties.Description = {
        rich_text: [
          {
            type: "text",
            text: {
              content: description,
            },
          },
        ],
      }
    }

    if (color) {
      properties.Color = {
        select: {
          name: color.charAt(0).toUpperCase() + color.slice(1),
        },
      }
    }

    if (icon) {
      properties.Icon = {
        rich_text: [
          {
            type: "text",
            text: {
              content: icon,
            },
          },
        ],
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
      console.error("[Notion Custom Metrics API] Create error:", error)
      console.error("[Notion Custom Metrics API] Properties sent:", JSON.stringify(properties, null, 2))
      return NextResponse.json(
        {
          error: error.message || "Failed to create custom metric",
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
    console.error("[Notion Custom Metrics API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
