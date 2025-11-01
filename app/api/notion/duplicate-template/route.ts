import { NextRequest, NextResponse } from "next/server"

const TEMPLATE_DBS = {
  TASKS: process.env.NOTION_TEMPLATE_TASKS,
  GOALS: process.env.NOTION_TEMPLATE_GOALS,
  MILESTONES: process.env.NOTION_TEMPLATE_MILESTONES,
  DOCUMENTS: process.env.NOTION_TEMPLATE_DOCUMENTS,
  FEEDBACK: process.env.NOTION_TEMPLATE_FEEDBACK,
  METRICS: process.env.NOTION_TEMPLATE_METRICS,
  SALES: process.env.NOTION_TEMPLATE_SALES,
}

async function duplicateDatabase(
  notionToken: string,
  sourceDbId: string,
  parentPageId: string,
  title: string
) {
  // Clean IDs
  const cleanSourceId = sourceDbId.replace(/-/g, "")
  const cleanParentId = parentPageId.replace(/-/g, "")

  // Get source database schema
  const sourceResponse = await fetch(
    `https://api.notion.com/v1/databases/${cleanSourceId}`,
    {
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
      },
    }
  )

  if (!sourceResponse.ok) {
    throw new Error(`Failed to fetch source database: ${sourceDbId}`)
  }

  const sourceData = await sourceResponse.json()

  // Create new database with same schema
  const createResponse = await fetch(
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
        properties: sourceData.properties,
        icon: sourceData.icon,
        cover: sourceData.cover,
      }),
    }
  )

  if (!createResponse.ok) {
    const error = await createResponse.json()
    throw new Error(`Failed to create database: ${error.message}`)
  }

  const newDb = await createResponse.json()
  return newDb.id
}

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

async function createProjectPage(
  notionToken: string,
  projectName: string,
  parentPageId: string,
  databases: Record<string, string>
) {
  const cleanParentId = parentPageId.replace(/-/g, "")

  const response = await fetch(
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
          type: "page_id",
          page_id: cleanParentId,
        },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: `${projectName} - Database`,
                },
              },
            ],
          },
        },
        icon: {
          type: "emoji",
          emoji: "📦",
        },
        children: [
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: `Database IDs: ${JSON.stringify(databases)}`,
                  },
                },
              ],
            },
          },
        ],
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to create project page: ${error.message}`)
  }

  const page = await response.json()
  return page.id
}

export async function POST(request: NextRequest) {
  try {
    const notionToken = process.env.NOTION_TOKEN
    const parentPageId = process.env.NOTION_PARENT_PAGE_ID

    if (!notionToken || !parentPageId) {
      return NextResponse.json(
        { error: "Notion configuration missing" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { projectName } = body

    if (!projectName) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      )
    }

    // Duplicate all template databases first (without page)
    const duplicatedDbs: Record<string, string> = {}

    // Create temporary page for databases
    const tempPageResponse = await fetch(
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
            type: "page_id",
            page_id: parentPageId.replace(/-/g, ""),
          },
          properties: {
            title: {
              title: [
                {
                  text: {
                    content: `${projectName} - Database (temp)`,
                  },
                },
              ],
            },
          },
        }),
      }
    )

    if (!tempPageResponse.ok) {
      throw new Error("Failed to create temporary project page")
    }

    const tempPage = await tempPageResponse.json()
    const projectPageId = tempPage.id

    if (TEMPLATE_DBS.TASKS) {
      duplicatedDbs.tasks = await duplicateDatabase(
        notionToken,
        TEMPLATE_DBS.TASKS,
        projectPageId,
        "Tasks"
      )
    }

    if (TEMPLATE_DBS.GOALS) {
      duplicatedDbs.goals = await duplicateDatabase(
        notionToken,
        TEMPLATE_DBS.GOALS,
        projectPageId,
        "Goals"
      )
    }

    if (TEMPLATE_DBS.MILESTONES) {
      duplicatedDbs.milestones = await duplicateDatabase(
        notionToken,
        TEMPLATE_DBS.MILESTONES,
        projectPageId,
        "Milestones"
      )
    }

    if (TEMPLATE_DBS.DOCUMENTS) {
      duplicatedDbs.documents = await duplicateDatabase(
        notionToken,
        TEMPLATE_DBS.DOCUMENTS,
        projectPageId,
        "Documents"
      )
    }

    if (TEMPLATE_DBS.FEEDBACK) {
      duplicatedDbs.feedback = await duplicateDatabase(
        notionToken,
        TEMPLATE_DBS.FEEDBACK,
        projectPageId,
        "Feedback"
      )
    }

    if (TEMPLATE_DBS.METRICS) {
      duplicatedDbs.metrics = await duplicateDatabase(
        notionToken,
        TEMPLATE_DBS.METRICS,
        projectPageId,
        "Metrics"
      )
    }

    if (TEMPLATE_DBS.SALES) {
      duplicatedDbs.sales = await duplicateDatabase(
        notionToken,
        TEMPLATE_DBS.SALES,
        projectPageId,
        "Sales"
      )
    }

    // Create Custom Metrics database (always create, no template needed)
    try {
      duplicatedDbs.customMetrics = await createCustomMetricsDatabase(
        notionToken,
        projectPageId,
        "Custom Metrics"
      )
      console.log("[Duplicate Template] Custom Metrics database created:", duplicatedDbs.customMetrics)
    } catch (error) {
      console.error("[Duplicate Template] Failed to create Custom Metrics database:", error)
      // Don't fail the whole process if custom metrics fails
    }

    // Update page title to remove "temp" and add database IDs
    await fetch(
      `https://api.notion.com/v1/pages/${projectPageId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            title: {
              title: [
                {
                  text: {
                    content: `${projectName} - Database`,
                  },
                },
              ],
            },
          },
        }),
      }
    )

    // Append database IDs as content
    await fetch(
      `https://api.notion.com/v1/blocks/${projectPageId}/children`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          children: [
            {
              object: "block",
              type: "paragraph",
              paragraph: {
                rich_text: [
                  {
                    type: "text",
                    text: {
                      content: `Database IDs: ${JSON.stringify(duplicatedDbs)}`,
                    },
                  },
                ],
              },
            },
          ],
        }),
      }
    )

    return NextResponse.json({
      success: true,
      projectPageId,
      databases: duplicatedDbs,
    })
  } catch (error) {
    console.error("[Notion Duplicate Template] Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error"
      },
      { status: 500 }
    )
  }
}
