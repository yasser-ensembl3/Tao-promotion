import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

interface NotionBlock {
  id: string
  type: string
  [key: string]: any
}

interface NotionPage {
  id: string
  title: string
  icon?: string
  cover?: string
  blocks: NotionBlock[]
}

async function fetchBlocks(notionToken: string, blockId: string): Promise<NotionBlock[]> {
  const response = await fetch(
    `https://api.notion.com/v1/blocks/${blockId}/children?page_size=100`,
    {
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
      },
    }
  )

  if (!response.ok) {
    return []
  }

  const data = await response.json()
  return data.results || []
}

function extractTitle(page: any): string {
  const properties = page.properties || {}

  // Try common title property names
  for (const key of Object.keys(properties)) {
    const prop = properties[key]
    if (prop.type === "title" && prop.title?.length > 0) {
      return prop.title.map((t: any) => t.plain_text).join("")
    }
  }

  return "Untitled"
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
    const pageId = searchParams.get("pageId")

    if (!pageId) {
      return NextResponse.json(
        { error: "Missing pageId parameter" },
        { status: 400 }
      )
    }

    // Clean page ID (remove dashes if present)
    const cleanPageId = pageId.replace(/-/g, "")

    // Fetch page metadata
    const pageResponse = await fetch(
      `https://api.notion.com/v1/pages/${cleanPageId}`,
      {
        headers: {
          "Authorization": `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
        },
      }
    )

    if (!pageResponse.ok) {
      const error = await pageResponse.json()
      return NextResponse.json(
        { error: error.message || "Failed to fetch page" },
        { status: pageResponse.status }
      )
    }

    const pageData = await pageResponse.json()

    // Fetch page blocks (content)
    const blocks = await fetchBlocks(notionToken, cleanPageId)

    // Extract page info
    const page: NotionPage = {
      id: pageData.id,
      title: extractTitle(pageData),
      icon: pageData.icon?.emoji || pageData.icon?.external?.url || null,
      cover: pageData.cover?.external?.url || pageData.cover?.file?.url || null,
      blocks,
    }

    return NextResponse.json(page)
  } catch (error: any) {
    console.error("[Notion Page Content API] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch page content" },
      { status: 500 }
    )
  }
}
