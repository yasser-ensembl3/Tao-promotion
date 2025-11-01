import { NextRequest, NextResponse } from "next/server"

async function createCustomMetricsDatabase(
  notionToken: string,
  parentPageId: string,
  title: string = "Custom Metrics"
) {
  const cleanParentId = parentPageId.replace(/-/g, "")

  const response = await fetch(
    `https://api.notion.com/v1/databases`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: {
          type: "page_id",
          page_id: cleanParentId,
        },
        title: [
          {
            type: "text",
            text: {
              content: title,
            },
          },
        ],
        icon: {
          type: "emoji",
          emoji: "📊"
        },
        properties: {
          Name: {
            title: {}
          },
          Value: {
            rich_text: {}
          },
          Date: {
            date: {}
          },
          Description: {
            rich_text: {}
          },
          Color: {
            select: {
              options: [
                { name: "Blue", color: "blue" },
                { name: "Green", color: "green" },
                { name: "Purple", color: "purple" },
                { name: "Orange", color: "orange" },
                { name: "Red", color: "red" },
                { name: "Yellow", color: "yellow" }
              ]
            }
          },
          Icon: {
            rich_text: {}
          }
        }
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to create Custom Metrics database: ${error.message}`)
  }

  const newDb = await response.json()
  return newDb.id
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
    const { projectPageId, title } = body

    if (!projectPageId) {
      return NextResponse.json(
        { error: "projectPageId is required" },
        { status: 400 }
      )
    }

    console.log("[Create Custom Metrics DB] Creating database for project:", projectPageId)

    const databaseId = await createCustomMetricsDatabase(
      notionToken,
      projectPageId,
      title || "Custom Metrics"
    )

    console.log("[Create Custom Metrics DB] Database created:", databaseId)

    return NextResponse.json({
      success: true,
      databaseId,
    })
  } catch (error) {
    console.error("[Create Custom Metrics DB] Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error"
      },
      { status: 500 }
    )
  }
}
