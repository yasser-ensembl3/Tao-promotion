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
    const projectPageId = searchParams.get("projectPageId")

    if (!projectPageId) {
      return NextResponse.json(
        { error: "Missing projectPageId parameter" },
        { status: 400 }
      )
    }

    // Clean the page ID
    const cleanPageId = projectPageId.replace(/-/g, "")

    // Get the blocks (content) of the page
    const blocksResponse = await fetch(
      `https://api.notion.com/v1/blocks/${cleanPageId}/children`,
      {
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
        },
      }
    )

    if (!blocksResponse.ok) {
      const error = await blocksResponse.json()
      return NextResponse.json(
        { error: error.message || "Failed to get project databases" },
        { status: blocksResponse.status }
      )
    }

    const blocksData = await blocksResponse.json()

    // Strategy 1: Try to find stored database IDs in a paragraph block
    let databases: Record<string, string> = {}
    for (const block of blocksData.results) {
      if (block.type === "paragraph" && block.paragraph?.rich_text?.length > 0) {
        const text = block.paragraph.rich_text[0].plain_text || ""
        if (text.startsWith("Database IDs:")) {
          try {
            const jsonStr = text.replace("Database IDs:", "").trim()
            databases = JSON.parse(jsonStr)
            break
          } catch (error) {
            console.error("Failed to parse database IDs:", error)
          }
        }
      }
    }

    // Strategy 2: If no stored IDs found, discover databases by scanning child blocks
    if (Object.keys(databases).length === 0) {
      const childDatabases = blocksData.results.filter(
        (block: any) => block.type === "child_database"
      )

      // Map database names to IDs
      const nameMapping: Record<string, string> = {
        "Tasks": "tasks",
        "Goals": "goals",
        "Milestones": "milestones",
        "Documents": "documents",
        "Feedback": "feedback",
        "Metrics": "metrics",
      }

      for (const db of childDatabases) {
        const dbTitle = db.child_database?.title || ""
        const key = nameMapping[dbTitle]
        if (key) {
          databases[key] = db.id
        }
      }
    }

    return NextResponse.json({
      success: true,
      databases,
    })
  } catch (error) {
    console.error("[Notion Project Databases API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
