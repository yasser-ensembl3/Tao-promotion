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
          // Don't sort - will cause error if property doesn't exist
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
    const essentials = data.results.map((page: any) => {
      const properties = page.properties

      // Get title from different possible property names
      const titleProp = properties.Name || properties.Title || properties.title || properties.name
      const title = titleProp?.title?.[0]?.plain_text ||
                   titleProp?.rich_text?.[0]?.plain_text ||
                   "Untitled"

      // Get description
      const descriptionProp = properties.Description || properties.description
      const description = descriptionProp?.rich_text?.[0]?.plain_text || null

      // Get type
      const typeProp = properties.Type || properties.type
      const type = typeProp?.select?.name ||
                  typeProp?.rich_text?.[0]?.plain_text ||
                  "Resource"

      // Get priority
      const priorityProp = properties.Priority || properties.priority
      const priority = priorityProp?.select?.name ||
                      priorityProp?.rich_text?.[0]?.plain_text ||
                      null

      // Get URL (can be either url type or rich_text type)
      const urlProp = properties.URL || properties.url || properties.Link || properties.link
      const url = urlProp?.url || urlProp?.rich_text?.[0]?.plain_text || null

      // Get date added
      const dateAddedProp = properties["Date Added"] || properties["DateAdded"] || properties.dateAdded || properties.Date || properties.date
      const dateAdded = dateAddedProp?.date?.start || page.created_time

      return {
        id: page.id,
        title,
        description,
        type,
        priority,
        url,
        dateAdded,
        notionUrl: page.url,
      }
    })

    return NextResponse.json({ essentials })
  } catch (error: any) {
    console.error("[Notion Essentials API] Error fetching essentials:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch essentials from Notion" },
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
    const { databaseId, title, description, type, priority, url } = body

    console.log("[Notion Essentials API] POST request received:", {
      title,
      description,
      type,
      priority,
      url
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

    let hasDescriptionProperty = false
    let hasTypeProperty = false
    let hasPriorityProperty = false
    let hasUrlProperty = false
    let hasDateAddedProperty = false
    let titlePropertyName = "Name"
    let descriptionPropertyName = "Description"
    let typePropertyName = "Type"
    let priorityPropertyName = "Priority"
    let urlPropertyName = "URL"
    let urlPropertyType = "url" // Default to url type
    let dateAddedPropertyName = "Date Added"

    if (schemaResponse.ok) {
      const schemaData = await schemaResponse.json()
      const properties = schemaData.properties || {}

      console.log("[Notion Essentials API] Database schema properties:", Object.keys(properties))

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

      // Find type property
      if (properties["Type"]) {
        typePropertyName = "Type"
        hasTypeProperty = true
      } else if (properties["type"]) {
        typePropertyName = "type"
        hasTypeProperty = true
      }

      // Find priority property
      if (properties["Priority"]) {
        priorityPropertyName = "Priority"
        hasPriorityProperty = true
      } else if (properties["priority"]) {
        priorityPropertyName = "priority"
        hasPriorityProperty = true
      }

      // Find URL property and its type
      if (properties["URL"]) {
        urlPropertyName = "URL"
        urlPropertyType = properties["URL"]?.type || "url"
        hasUrlProperty = true
      } else if (properties["url"]) {
        urlPropertyName = "url"
        urlPropertyType = properties["url"]?.type || "url"
        hasUrlProperty = true
      } else if (properties["Link"]) {
        urlPropertyName = "Link"
        urlPropertyType = properties["Link"]?.type || "url"
        hasUrlProperty = true
      } else if (properties["link"]) {
        urlPropertyName = "link"
        urlPropertyType = properties["link"]?.type || "url"
        hasUrlProperty = true
      }

      // Find date added property
      if (properties["Date Added"]) {
        dateAddedPropertyName = "Date Added"
        hasDateAddedProperty = true
      } else if (properties["DateAdded"]) {
        dateAddedPropertyName = "DateAdded"
        hasDateAddedProperty = true
      } else if (properties["dateAdded"]) {
        dateAddedPropertyName = "dateAdded"
        hasDateAddedProperty = true
      } else if (properties["Date"]) {
        dateAddedPropertyName = "Date"
        hasDateAddedProperty = true
      } else if (properties["date"]) {
        dateAddedPropertyName = "date"
        hasDateAddedProperty = true
      }

      console.log("[Notion Essentials API] Property checks:", {
        hasDescriptionProperty,
        hasTypeProperty,
        hasPriorityProperty,
        hasUrlProperty,
        urlPropertyType,
        hasDateAddedProperty
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

    if (type && hasTypeProperty) {
      properties[typePropertyName] = {
        rich_text: [
          {
            type: "text",
            text: {
              content: type,
            },
          },
        ],
      }
    }

    if (priority && hasPriorityProperty) {
      properties[priorityPropertyName] = {
        rich_text: [
          {
            type: "text",
            text: {
              content: priority,
            },
          },
        ],
      }
    }

    if (url && hasUrlProperty) {
      // Use the URL property type we determined earlier
      if (urlPropertyType === "rich_text") {
        properties[urlPropertyName] = {
          rich_text: [
            {
              type: "text",
              text: {
                content: url,
              },
            },
          ],
        }
      } else {
        // Default to url type
        properties[urlPropertyName] = {
          url: url,
        }
      }
    }

    if (hasDateAddedProperty) {
      properties[dateAddedPropertyName] = {
        date: {
          start: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
        },
      }
    }

    // Create new essential item page
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
      console.error("[Notion Essentials API] Create error:", error)
      console.error("[Notion Essentials API] Properties sent:", JSON.stringify(properties, null, 2))
      return NextResponse.json(
        {
          error: error.message || "Failed to create essential item",
          details: error,
        },
        { status: createResponse.status }
      )
    }

    const newEssential = await createResponse.json()

    return NextResponse.json({
      success: true,
      essential: {
        id: newEssential.id,
        url: newEssential.url,
      },
    })
  } catch (error) {
    console.error("[Notion Essentials API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
