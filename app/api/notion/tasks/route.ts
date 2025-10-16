import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const notionToken = process.env.NOTION_TOKEN
    const databaseId = process.env.NOTION_DATABASE_ID

    if (!notionToken) {
      return NextResponse.json(
        { error: "NOTION_TOKEN not configured" },
        { status: 500 }
      )
    }

    if (!databaseId) {
      return NextResponse.json(
        { error: "NOTION_DATABASE_ID not configured" },
        { status: 500 }
      )
    }

    // Query Notion database using fetch API
    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
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
    const tasks = data.results.map((page: any) => {
      const properties = page.properties

      // Get title from different possible property names
      const titleProp = properties.Name || properties.Title || properties.title || properties.name
      const title = titleProp?.title?.[0]?.plain_text ||
                   titleProp?.rich_text?.[0]?.plain_text ||
                   "Untitled"

      // Get status
      const statusProp = properties.Status || properties.status
      const status = statusProp?.status?.name ||
                    statusProp?.select?.name ||
                    "No Status"

      return {
        id: page.id,
        title,
        status,
        dueDate: properties["Due Date"]?.date?.start ||
                properties["DueDate"]?.date?.start ||
                properties.dueDate?.date?.start ||
                null,
        priority: properties.Priority?.select?.name ||
                 properties.priority?.select?.name ||
                 null,
        tags: properties.Tags?.multi_select?.map((tag: any) => tag.name) ||
             properties.tags?.multi_select?.map((tag: any) => tag.name) ||
             [],
        url: page.url,
      }
    })

    return NextResponse.json({ tasks })
  } catch (error: any) {
    console.error("[Notion API] Error fetching tasks:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch tasks from Notion" },
      { status: 500 }
    )
  }
}
