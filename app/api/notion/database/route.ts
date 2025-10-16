import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const notionToken = process.env.NOTION_TOKEN

    if (!notionToken) {
      return NextResponse.json(
        { error: "Notion integration token not configured" },
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

    // Clean the database ID (remove hyphens and any URL params)
    const cleanDatabaseId = databaseId.replace(/-/g, "").split("?")[0]

    // Fetch database metadata
    const databaseResponse = await fetch(
      `https://api.notion.com/v1/databases/${cleanDatabaseId}`,
      {
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
      }
    )

    if (!databaseResponse.ok) {
      const error = await databaseResponse.json()
      return NextResponse.json(
        { error: error.message || "Failed to fetch Notion database" },
        { status: databaseResponse.status }
      )
    }

    const databaseData = await databaseResponse.json()

    // Query database for pages
    const queryResponse = await fetch(
      `https://api.notion.com/v1/databases/${cleanDatabaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page_size: 50,
          sorts: [
            {
              timestamp: "last_edited_time",
              direction: "descending",
            },
          ],
        }),
      }
    )

    if (!queryResponse.ok) {
      const error = await queryResponse.json()
      return NextResponse.json(
        { error: error.message || "Failed to query Notion database" },
        { status: queryResponse.status }
      )
    }

    const queryData = await queryResponse.json()

    // Extract database title
    const databaseTitle = databaseData.title?.[0]?.plain_text || "Untitled Database"

    // Process pages to extract relevant information
    const pages = queryData.results.map((page: any) => {
      const properties: any = {}

      // Extract properties
      Object.keys(page.properties).forEach((key) => {
        const prop = page.properties[key]

        switch (prop.type) {
          case "title":
            properties[key] = prop.title?.[0]?.plain_text || ""
            break
          case "rich_text":
            properties[key] = prop.rich_text?.[0]?.plain_text || ""
            break
          case "number":
            properties[key] = prop.number
            break
          case "select":
            properties[key] = prop.select?.name || null
            break
          case "multi_select":
            properties[key] = prop.multi_select?.map((s: any) => s.name) || []
            break
          case "date":
            properties[key] = prop.date?.start || null
            break
          case "checkbox":
            properties[key] = prop.checkbox
            break
          case "url":
            properties[key] = prop.url
            break
          case "email":
            properties[key] = prop.email
            break
          case "phone_number":
            properties[key] = prop.phone_number
            break
          case "status":
            properties[key] = prop.status?.name || null
            break
          default:
            properties[key] = null
        }
      })

      return {
        id: page.id,
        url: page.url,
        createdTime: page.created_time,
        lastEditedTime: page.last_edited_time,
        properties,
      }
    })

    return NextResponse.json({
      database: {
        id: databaseData.id,
        title: databaseTitle,
        url: databaseData.url,
        createdTime: databaseData.created_time,
        lastEditedTime: databaseData.last_edited_time,
        icon: databaseData.icon,
        cover: databaseData.cover,
      },
      pages,
      totalPages: queryData.results.length,
      hasMore: queryData.has_more,
    })
  } catch (error) {
    console.error("[Notion API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
