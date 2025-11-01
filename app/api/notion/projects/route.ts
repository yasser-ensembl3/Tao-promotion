import { NextRequest, NextResponse } from "next/server"

const PROJECTS_PARENT_PAGE_ID = "28e58fe731b180438a2ffaa541202d35"

export async function GET() {
  try {
    const notionToken = process.env.NOTION_TOKEN

    if (!notionToken) {
      return NextResponse.json(
        { error: "Notion integration token not configured" },
        { status: 500 }
      )
    }

    // Clean the page ID (remove hyphens)
    const cleanPageId = PROJECTS_PARENT_PAGE_ID.replace(/-/g, "")

    // Get child pages of the parent page
    const childrenResponse = await fetch(
      `https://api.notion.com/v1/blocks/${cleanPageId}/children?page_size=100`,
      {
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
      }
    )

    if (!childrenResponse.ok) {
      const error = await childrenResponse.json()
      return NextResponse.json(
        { error: error.message || "Failed to get child pages" },
        { status: childrenResponse.status }
      )
    }

    const childrenData = await childrenResponse.json()

    // Filter only child_page blocks and fetch their details
    const childPages = childrenData.results.filter(
      (block: any) => block.type === "child_page"
    )

    // Fetch full details for each child page
    const projects = await Promise.all(
      childPages.map(async (block: any) => {
        try {
          const pageResponse = await fetch(
            `https://api.notion.com/v1/pages/${block.id}`,
            {
              headers: {
                Authorization: `Bearer ${notionToken}`,
                "Notion-Version": "2022-06-28",
              },
            }
          )

          if (!pageResponse.ok) {
            return null
          }

          const pageData = await pageResponse.json()

          return {
            id: pageData.id,
            url: pageData.url,
            createdTime: pageData.created_time,
            lastEditedTime: pageData.last_edited_time,
            properties: {
              Name: block.child_page?.title || "Untitled",
            },
          }
        } catch (error) {
          console.error(`Failed to fetch page ${block.id}:`, error)
          return null
        }
      })
    )

    // Filter out null values
    const validProjects = projects.filter((p) => p !== null)

    return NextResponse.json({
      projects: validProjects,
      total: validProjects.length,
    })
  } catch (error) {
    console.error("[Notion Projects API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
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
    const { projectName, description, githubRepo, driveFolder, notionDb } = body

    if (!projectName) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      )
    }

    // Duplicate the template databases
    const duplicateResponse = await fetch(
      `${process.env.NEXTAUTH_URL}/api/notion/duplicate-template`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName,
        }),
      }
    )

    if (!duplicateResponse.ok) {
      const error = await duplicateResponse.json()
      return NextResponse.json(
        { error: error.error || "Failed to duplicate template" },
        { status: duplicateResponse.status }
      )
    }

    const duplicateData = await duplicateResponse.json()

    return NextResponse.json({
      success: true,
      project: {
        id: duplicateData.projectPageId,
        url: `https://notion.so/${duplicateData.projectPageId.replace(/-/g, "")}`,
        databases: duplicateData.databases,
        projectPageId: duplicateData.projectPageId,
      },
    })
  } catch (error) {
    console.error("[Notion Projects API] Error creating project:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
