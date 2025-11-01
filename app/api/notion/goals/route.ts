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
    const goals = data.results.map((page: any) => {
      const properties = page.properties

      // Get name from different possible property names
      const nameProp = properties.Name || properties.Title || properties.name || properties.title
      const name = nameProp?.title?.[0]?.plain_text ||
                   nameProp?.rich_text?.[0]?.plain_text ||
                   "Untitled"

      // Get category
      const categoryProp = properties.Category || properties.category
      const category = categoryProp?.rich_text?.[0]?.plain_text ||
                      categoryProp?.select?.name ||
                      null

      // Get current progress
      const currentProp = properties["Current Progress"] || properties.Current || properties.current
      const currentProgress = currentProp?.rich_text?.[0]?.plain_text ||
                             currentProp?.number?.toString() ||
                             null

      // Get deadline
      const deadlineProp = properties.Deadline || properties.deadline || properties["Due Date"]
      const deadline = deadlineProp?.date?.start || null

      // Get status
      const statusProp = properties.Status || properties.status
      const status = statusProp?.status?.name ||
                    statusProp?.select?.name ||
                    statusProp?.rich_text?.[0]?.plain_text ||
                    "Not Started"

      // Get target
      const targetProp = properties.Target || properties.target
      const target = targetProp?.rich_text?.[0]?.plain_text ||
                    targetProp?.number?.toString() ||
                    null

      return {
        id: page.id,
        name,
        category,
        currentProgress,
        deadline,
        status,
        target,
        url: page.url,
      }
    })

    return NextResponse.json({ goals })
  } catch (error: any) {
    console.error("[Notion Goals API] Error fetching goals:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch goals from Notion" },
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
    const { databaseId, name, category, currentProgress, deadline, status, target } = body

    console.log("[Notion Goals API] POST request received:", {
      name,
      category,
      currentProgress,
      deadline,
      status,
      target
    })

    if (!databaseId || !name) {
      return NextResponse.json(
        { error: "Missing required fields: databaseId and name" },
        { status: 400 }
      )
    }

    const cleanDatabaseId = databaseId.replace(/-/g, "")

    // Get database schema to know which properties exist
    const schemaResponse = await fetch(
      `https://api.notion.com/v1/databases/${cleanDatabaseId}`,
      {
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
        },
      }
    )

    let hasCategoryProperty = false
    let hasCurrentProgressProperty = false
    let hasDeadlineProperty = false
    let hasStatusProperty = false
    let hasTargetProperty = false
    let namePropertyName = "Name"
    let categoryPropertyName = "Category"
    let currentProgressPropertyName = "Current Progress"
    let deadlinePropertyName = "Deadline"
    let statusPropertyName = "Status"
    let targetPropertyName = "Target"

    if (schemaResponse.ok) {
      const schemaData = await schemaResponse.json()
      const properties = schemaData.properties || {}

      console.log("[Notion Goals API] Database schema properties:", Object.keys(properties))

      // Find the name property
      if (properties["Title"]) namePropertyName = "Title"
      else if (properties["Name"]) namePropertyName = "Name"
      else if (properties["title"]) namePropertyName = "title"
      else if (properties["name"]) namePropertyName = "name"

      // Find category property
      if (properties["Category"]) {
        categoryPropertyName = "Category"
        hasCategoryProperty = true
      } else if (properties["category"]) {
        categoryPropertyName = "category"
        hasCategoryProperty = true
      }

      // Find current progress property
      if (properties["Current Progress"]) {
        currentProgressPropertyName = "Current Progress"
        hasCurrentProgressProperty = true
      } else if (properties["Current"]) {
        currentProgressPropertyName = "Current"
        hasCurrentProgressProperty = true
      } else if (properties["current"]) {
        currentProgressPropertyName = "current"
        hasCurrentProgressProperty = true
      }

      // Find deadline property
      if (properties["Deadline"]) {
        deadlinePropertyName = "Deadline"
        hasDeadlineProperty = true
      } else if (properties["deadline"]) {
        deadlinePropertyName = "deadline"
        hasDeadlineProperty = true
      } else if (properties["Due Date"]) {
        deadlinePropertyName = "Due Date"
        hasDeadlineProperty = true
      }

      // Find status property
      if (properties["Status"]) {
        statusPropertyName = "Status"
        hasStatusProperty = true
      } else if (properties["status"]) {
        statusPropertyName = "status"
        hasStatusProperty = true
      }

      // Find target property
      if (properties["Target"]) {
        targetPropertyName = "Target"
        hasTargetProperty = true
      } else if (properties["target"]) {
        targetPropertyName = "target"
        hasTargetProperty = true
      }

      console.log("[Notion Goals API] Property checks:", {
        hasCategoryProperty,
        hasCurrentProgressProperty,
        hasDeadlineProperty,
        hasStatusProperty,
        hasTargetProperty
      })
    }

    // Build properties object
    const properties: any = {
      [namePropertyName]: {
        title: [
          {
            text: {
              content: name,
            },
          },
        ],
      },
    }

    if (category && hasCategoryProperty) {
      // Always send as rich_text
      properties[categoryPropertyName] = {
        rich_text: [
          {
            type: "text",
            text: {
              content: category,
            },
          },
        ],
      }
    }

    if (currentProgress && hasCurrentProgressProperty) {
      // Always send as rich_text
      properties[currentProgressPropertyName] = {
        rich_text: [
          {
            type: "text",
            text: {
              content: currentProgress,
            },
          },
        ],
      }
    }

    if (deadline && hasDeadlineProperty) {
      properties[deadlinePropertyName] = {
        date: {
          start: deadline,
        },
      }
    }

    if (status && hasStatusProperty) {
      // Always send as rich_text
      properties[statusPropertyName] = {
        rich_text: [
          {
            type: "text",
            text: {
              content: status,
            },
          },
        ],
      }
    }

    if (target && hasTargetProperty) {
      // Always send as rich_text
      properties[targetPropertyName] = {
        rich_text: [
          {
            type: "text",
            text: {
              content: target,
            },
          },
        ],
      }
    }

    // Create new goal page
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
      console.error("[Notion Goals API] Create error:", error)
      console.error("[Notion Goals API] Properties sent:", JSON.stringify(properties, null, 2))
      return NextResponse.json(
        {
          error: error.message || "Failed to create goal",
          details: error,
        },
        { status: createResponse.status }
      )
    }

    const newGoal = await createResponse.json()

    return NextResponse.json({
      success: true,
      goal: {
        id: newGoal.id,
        url: newGoal.url,
      },
    })
  } catch (error) {
    console.error("[Notion Goals API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
