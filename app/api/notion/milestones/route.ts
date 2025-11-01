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

    const cleanDatabaseId = databaseId.replace(/-/g, "")

    // Query the milestones database with sorting (newest first)
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
          page_size: 100,
          sorts: [
            {
              property: "Due Date",
              direction: "ascending"
            }
          ]
        }),
      }
    )

    if (!queryResponse.ok) {
      const error = await queryResponse.json()
      return NextResponse.json(
        { error: error.message || "Failed to query milestones database" },
        { status: queryResponse.status }
      )
    }

    const queryData = await queryResponse.json()

    // Log the first page's properties to debug
    if (queryData.results.length > 0) {
      const firstPage = queryData.results[0]
      console.log("[Notion Milestones API] First page properties:", Object.keys(firstPage.properties))
      console.log("[Notion Milestones API] Percentage property:", JSON.stringify(firstPage.properties.Percentage, null, 2))
      console.log("[Notion Milestones API] Taux property:", JSON.stringify(firstPage.properties.Taux, null, 2))
      console.log("[Notion Milestones API] Completion property:", JSON.stringify(firstPage.properties.Completion, null, 2))
    }

    // Helper function to get percentage from various possible property names
    const getPercentage = (properties: any): number => {
      // Try different possible property names for percentage (case-insensitive)
      const possibleNames = [
        "percentage", "taux", "completion", "pourcentage",
        "taux de completion", "avancement", "progress",
        "progression", "complete", "done", "%"
      ]

      // First, try exact case-insensitive match
      for (const name of possibleNames) {
        for (const propKey of Object.keys(properties)) {
          if (propKey.toLowerCase() === name.toLowerCase()) {
            const value = properties[propKey]?.number
            if (value !== undefined && value !== null) {
              return value
            }
          }
        }
      }

      // If no match found, try to find any number property that contains these keywords
      for (const name of possibleNames) {
        for (const propKey of Object.keys(properties)) {
          if (propKey.toLowerCase().includes(name) && properties[propKey]?.type === "number") {
            const value = properties[propKey]?.number
            if (value !== undefined && value !== null) {
              return value
            }
          }
        }
      }

      return 0
    }

    // Process milestones
    const milestones = queryData.results.map((page: any) => {
      const properties = page.properties

      return {
        id: page.id,
        title: properties.Name?.title?.[0]?.plain_text || "",
        dueDate: properties["Due Date"]?.date?.start || "",
        description: properties.Description?.rich_text?.[0]?.plain_text || "",
        percentage: getPercentage(properties),
      }
    })

    return NextResponse.json({
      success: true,
      milestones,
    })
  } catch (error) {
    console.error("[Notion Milestones API] Error:", error)
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
    const { databaseId, title, dueDate, description, percentage } = body

    console.log("[Notion Milestones API] POST request received:", {
      title,
      percentage,
      percentageType: typeof percentage
    })

    if (!databaseId || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const cleanDatabaseId = databaseId.replace(/-/g, "")

    // First, get the database schema to know which properties exist
    const schemaResponse = await fetch(
      `https://api.notion.com/v1/databases/${cleanDatabaseId}`,
      {
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
        },
      }
    )

    let hasDescriptionProperty = false
    let hasPercentageProperty = false
    let hasDueDateProperty = false

    let percentagePropertyName = "Percentage"

    if (schemaResponse.ok) {
      const schemaData = await schemaResponse.json()
      const properties = schemaData.properties || {}

      console.log("[Notion Milestones API] Database schema properties:", Object.keys(properties))
      console.log("[Notion Milestones API] All number properties:", Object.keys(properties).filter(k => properties[k]?.type === "number"))

      hasDescriptionProperty = !!properties["Description"]
      hasDueDateProperty = !!properties["Due Date"]

      // Try to find the percentage property with various possible names (case-insensitive)
      const possiblePercentageNames = [
        "percentage", "taux", "completion", "pourcentage",
        "taux de completion", "avancement", "progress",
        "progression", "complete", "done", "%"
      ]

      // First try exact case-insensitive match
      for (const name of possiblePercentageNames) {
        for (const propKey of Object.keys(properties)) {
          if (propKey.toLowerCase() === name.toLowerCase() && properties[propKey]?.type === "number") {
            hasPercentageProperty = true
            percentagePropertyName = propKey
            console.log("[Notion Milestones API] Found percentage property (exact match):", propKey)
            break
          }
        }
        if (hasPercentageProperty) break
      }

      // If not found, try to find any number property that contains these keywords
      if (!hasPercentageProperty) {
        for (const name of possiblePercentageNames) {
          for (const propKey of Object.keys(properties)) {
            if (propKey.toLowerCase().includes(name) && properties[propKey]?.type === "number") {
              hasPercentageProperty = true
              percentagePropertyName = propKey
              console.log("[Notion Milestones API] Found percentage property (contains match):", propKey)
              break
            }
          }
          if (hasPercentageProperty) break
        }
      }

      console.log("[Notion Milestones API] Property checks:", {
        hasDescriptionProperty,
        hasPercentageProperty,
        percentagePropertyName,
        hasDueDateProperty
      })
    }

    // Build properties object
    const properties: any = {
      Name: {
        title: [
          {
            text: {
              content: title,
            },
          },
        ],
      },
    }

    if (dueDate && hasDueDateProperty) {
      properties["Due Date"] = {
        date: {
          start: dueDate,
        },
      }
    }

    if (description && hasDescriptionProperty) {
      properties["Description"] = {
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

    if (percentage !== undefined && hasPercentageProperty) {
      properties[percentagePropertyName] = {
        number: percentage,
      }
      console.log("[Notion Milestones API] Adding percentage property:", {
        propertyName: percentagePropertyName,
        value: percentage
      })
    } else {
      console.log("[Notion Milestones API] NOT adding percentage:", {
        percentageUndefined: percentage === undefined,
        hasPercentageProperty,
        percentage
      })
    }

    // Create new milestone page
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
      console.error("[Notion Milestones API] Create error:", error)
      console.error("[Notion Milestones API] Properties sent:", JSON.stringify(properties, null, 2))
      return NextResponse.json(
        {
          error: error.message || "Failed to create milestone",
          details: error,
        },
        { status: createResponse.status }
      )
    }

    const newMilestone = await createResponse.json()

    return NextResponse.json({
      success: true,
      milestone: {
        id: newMilestone.id,
        url: newMilestone.url,
      },
    })
  } catch (error) {
    console.error("[Notion Milestones API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const notionToken = process.env.NOTION_TOKEN

    if (!notionToken) {
      return NextResponse.json(
        { error: "Notion integration token not configured" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { milestoneId, title, dueDate, description, percentage } = body

    if (!milestoneId) {
      return NextResponse.json(
        { error: "Missing milestoneId" },
        { status: 400 }
      )
    }

    const cleanMilestoneId = milestoneId.replace(/-/g, "")

    // Get the milestone page to find the database it belongs to
    const pageResponse = await fetch(
      `https://api.notion.com/v1/pages/${cleanMilestoneId}`,
      {
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
        },
      }
    )

    let percentagePropertyName = "Percentage"

    if (pageResponse.ok) {
      const pageData = await pageResponse.json()
      const databaseId = pageData.parent?.database_id

      if (databaseId) {
        // Get database schema to find the correct percentage property name
        const schemaResponse = await fetch(
          `https://api.notion.com/v1/databases/${databaseId}`,
          {
            headers: {
              Authorization: `Bearer ${notionToken}`,
              "Notion-Version": "2022-06-28",
            },
          }
        )

        if (schemaResponse.ok) {
          const schemaData = await schemaResponse.json()
          const properties = schemaData.properties || {}

          // Try to find the percentage property (case-insensitive)
          const possiblePercentageNames = [
            "percentage", "taux", "completion", "pourcentage",
            "taux de completion", "avancement", "progress",
            "progression", "complete", "done", "%"
          ]

          // First try exact case-insensitive match
          let found = false
          for (const name of possiblePercentageNames) {
            for (const propKey of Object.keys(properties)) {
              if (propKey.toLowerCase() === name.toLowerCase() && properties[propKey]?.type === "number") {
                percentagePropertyName = propKey
                found = true
                break
              }
            }
            if (found) break
          }

          // If not found, try partial match
          if (!found) {
            for (const name of possiblePercentageNames) {
              for (const propKey of Object.keys(properties)) {
                if (propKey.toLowerCase().includes(name) && properties[propKey]?.type === "number") {
                  percentagePropertyName = propKey
                  found = true
                  break
                }
              }
              if (found) break
            }
          }
        }
      }
    }

    // Build update properties
    const updateProperties: any = {}

    if (title) {
      updateProperties.Name = {
        title: [
          {
            text: {
              content: title,
            },
          },
        ],
      }
    }

    if (dueDate) {
      updateProperties["Due Date"] = {
        date: {
          start: dueDate,
        },
      }
    }

    if (description) {
      updateProperties.Description = {
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

    if (percentage !== undefined) {
      updateProperties[percentagePropertyName] = {
        number: percentage,
      }
    }

    // Update milestone page
    const updateResponse = await fetch(
      `https://api.notion.com/v1/pages/${cleanMilestoneId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: updateProperties,
        }),
      }
    )

    if (!updateResponse.ok) {
      const error = await updateResponse.json()
      return NextResponse.json(
        { error: error.message || "Failed to update milestone" },
        { status: updateResponse.status }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("[Notion Milestones API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const notionToken = process.env.NOTION_TOKEN

    if (!notionToken) {
      return NextResponse.json(
        { error: "Notion integration token not configured" },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const milestoneId = searchParams.get("milestoneId")

    if (!milestoneId) {
      return NextResponse.json(
        { error: "Missing milestoneId parameter" },
        { status: 400 }
      )
    }

    const cleanMilestoneId = milestoneId.replace(/-/g, "")

    // Archive the milestone page (Notion doesn't support hard delete)
    const archiveResponse = await fetch(
      `https://api.notion.com/v1/pages/${cleanMilestoneId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          archived: true,
        }),
      }
    )

    if (!archiveResponse.ok) {
      const error = await archiveResponse.json()
      return NextResponse.json(
        { error: error.message || "Failed to delete milestone" },
        { status: archiveResponse.status }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("[Notion Milestones API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
