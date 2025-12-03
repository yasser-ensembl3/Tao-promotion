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
    let databaseId = searchParams.get("databaseId")

    // Fallback to env variable if not provided in query
    if (!databaseId) {
      databaseId = process.env.NOTION_DATABASE_ID || null
    }

    if (!databaseId) {
      return NextResponse.json(
        { error: "Missing databaseId parameter" },
        { status: 400 }
      )
    }

    const cleanDatabaseId = databaseId.replace(/-/g, "")

    // Query Notion database using fetch API
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
    const tasks = data.results.map((page: any) => {
      const properties = page.properties

      // Get title from different possible property names
      const titleProp = properties.Name || properties.Title || properties.title || properties.name
      const title = titleProp?.title?.[0]?.plain_text ||
                   titleProp?.rich_text?.[0]?.plain_text ||
                   "Untitled"

      // Get description
      const descriptionProp = properties.Description || properties.description
      const description = descriptionProp?.rich_text?.[0]?.plain_text || null

      // Get assignee
      const assigneeProp = properties.Assignée || properties.Assignee || properties.Assigned || properties.assignee
      const assignee = assigneeProp?.rich_text?.[0]?.plain_text || null

      // Get status
      const statusProp = properties.Status || properties.status
      const status = statusProp?.status?.name ||
                    statusProp?.select?.name ||
                    statusProp?.rich_text?.[0]?.plain_text ||
                    "No Status"

      // Get frequency (specific to recurring tasks)
      const frequencyProp = properties.Frequency || properties.frequency || properties.Fréquence
      const frequency = frequencyProp?.select?.name ||
                       frequencyProp?.rich_text?.[0]?.plain_text ||
                       null

      // Get last completed date (specific to recurring tasks)
      const lastCompletedProp = properties["Last Completed"] ||
                               properties["LastCompleted"] ||
                               properties.lastCompleted ||
                               properties["Dernière Complétion"]
      const lastCompleted = lastCompletedProp?.date?.start || null

      return {
        id: page.id,
        title,
        description,
        assignee,
        status,
        dueDate: properties["Due Date"]?.date?.start ||
                properties["DueDate"]?.date?.start ||
                properties.dueDate?.date?.start ||
                null,
        frequency,
        lastCompleted,
        url: page.url,
      }
    })

    return NextResponse.json({ tasks })
  } catch (error: any) {
    console.error("[Notion API] Error fetching recurring tasks:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch recurring tasks from Notion" },
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
    const { databaseId, title, description, assignee, status, dueDate, frequency } = body

    console.log("[Notion Recurring Tasks API] POST request received:", {
      title,
      description,
      assignee,
      status,
      dueDate,
      frequency
    })

    if (!databaseId || !title) {
      return NextResponse.json(
        { error: "Missing required fields: databaseId and title" },
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

    let hasAssigneeProperty = false
    let hasDescriptionProperty = false
    let hasStatusProperty = false
    let hasDueDateProperty = false
    let hasFrequencyProperty = false
    let titlePropertyName = "Name"
    let descriptionPropertyName = "Description"
    let assigneePropertyName = "Assignée"
    let statusPropertyName = "Status"
    let dueDatePropertyName = "Due Date"
    let frequencyPropertyName = "Frequency"

    if (schemaResponse.ok) {
      const schemaData = await schemaResponse.json()
      const properties = schemaData.properties || {}

      console.log("[Notion Recurring Tasks API] Database schema properties:", Object.keys(properties))

      // Find the title property
      if (properties["Title"]) titlePropertyName = "Title"
      else if (properties["Name"]) titlePropertyName = "Name"
      else if (properties["title"]) titlePropertyName = "title"
      else if (properties["name"]) titlePropertyName = "name"

      // Find description property
      if (properties["Description"]) {
        descriptionPropertyName = "Description"
        hasDescriptionProperty = true
      } else if (properties["description"]) {
        descriptionPropertyName = "description"
        hasDescriptionProperty = true
      }

      // Find assignee property (check multiple names)
      if (properties["Assignée"]) {
        assigneePropertyName = "Assignée"
        hasAssigneeProperty = true
      } else if (properties["Assignee"]) {
        assigneePropertyName = "Assignee"
        hasAssigneeProperty = true
      } else if (properties["Assigned"]) {
        assigneePropertyName = "Assigned"
        hasAssigneeProperty = true
      } else if (properties["assignee"]) {
        assigneePropertyName = "assignee"
        hasAssigneeProperty = true
      }

      // Find status property
      if (properties["Status"]) {
        statusPropertyName = "Status"
        hasStatusProperty = true
      } else if (properties["status"]) {
        statusPropertyName = "status"
        hasStatusProperty = true
      }

      // Find due date property
      if (properties["Due Date"]) {
        dueDatePropertyName = "Due Date"
        hasDueDateProperty = true
      } else if (properties["DueDate"]) {
        dueDatePropertyName = "DueDate"
        hasDueDateProperty = true
      } else if (properties["dueDate"]) {
        dueDatePropertyName = "dueDate"
        hasDueDateProperty = true
      }

      // Find frequency property (specific to recurring tasks)
      if (properties["Frequency"]) {
        frequencyPropertyName = "Frequency"
        hasFrequencyProperty = true
      } else if (properties["frequency"]) {
        frequencyPropertyName = "frequency"
        hasFrequencyProperty = true
      } else if (properties["Fréquence"]) {
        frequencyPropertyName = "Fréquence"
        hasFrequencyProperty = true
      }

      console.log("[Notion Recurring Tasks API] Property checks:", {
        hasDescriptionProperty,
        hasAssigneeProperty,
        hasStatusProperty,
        hasDueDateProperty,
        hasFrequencyProperty
      })
    }

    // Build properties object
    const properties: any = {
      [titlePropertyName]: {
        title: [
          {
            text: {
              content: title,
            },
          },
        ],
      },
    }

    if (description && hasDescriptionProperty) {
      properties[descriptionPropertyName] = {
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

    if (assignee && hasAssigneeProperty) {
      properties[assigneePropertyName] = {
        rich_text: [
          {
            type: "text",
            text: {
              content: assignee,
            },
          },
        ],
      }
    }

    if (dueDate && hasDueDateProperty) {
      properties[dueDatePropertyName] = {
        date: {
          start: dueDate,
        },
      }
    }

    if (status && hasStatusProperty) {
      // Always send as rich_text (text format)
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

    if (frequency && hasFrequencyProperty) {
      // Send frequency as rich_text
      properties[frequencyPropertyName] = {
        rich_text: [
          {
            type: "text",
            text: {
              content: frequency,
            },
          },
        ],
      }
    }

    // Create new task page
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
      console.error("[Notion Recurring Tasks API] Create error:", error)
      console.error("[Notion Recurring Tasks API] Properties sent:", JSON.stringify(properties, null, 2))
      return NextResponse.json(
        {
          error: error.message || "Failed to create recurring task",
          details: error,
        },
        { status: createResponse.status }
      )
    }

    const newTask = await createResponse.json()

    return NextResponse.json({
      success: true,
      task: {
        id: newTask.id,
        url: newTask.url,
      },
    })
  } catch (error) {
    console.error("[Notion Recurring Tasks API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
