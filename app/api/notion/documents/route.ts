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

    // Query the documents database
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
        }),
      }
    )

    if (!queryResponse.ok) {
      const error = await queryResponse.json()
      return NextResponse.json(
        { error: error.message || "Failed to query documents database" },
        { status: queryResponse.status }
      )
    }

    const queryData = await queryResponse.json()

    // Process documents
    const documents = queryData.results.map((page: any) => {
      const properties = page.properties

      // Get type from either select or rich_text
      let type = "Other"
      if (properties.Type?.select?.name) {
        type = properties.Type.select.name
      } else if (properties.Type?.rich_text?.[0]?.plain_text) {
        type = properties.Type.rich_text[0].plain_text
      } else if (properties.Category?.select?.name) {
        type = properties.Category.select.name
      } else if (properties.Category?.rich_text?.[0]?.plain_text) {
        type = properties.Category.rich_text[0].plain_text
      }

      return {
        id: page.id,
        title: properties.Name?.title?.[0]?.plain_text || properties.Title?.title?.[0]?.plain_text || "",
        url: properties.URL?.url || properties.Link?.url || "",
        description: properties.Description?.rich_text?.[0]?.plain_text || "",
        type: type,
      }
    })

    return NextResponse.json({
      success: true,
      documents,
    })
  } catch (error) {
    console.error("[Notion Documents API] Error:", error)
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
    const { databaseId, title, url, description, type } = body

    console.log("[Notion Documents API] POST request received:", {
      title,
      url,
      type
    })

    if (!databaseId || !title || !url) {
      return NextResponse.json(
        { error: "Missing required fields" },
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
    let titlePropertyName = "Name"
    let urlPropertyName = "URL"
    let typePropertyName = "Type"
    let typePropertyType = "select" // Default to select

    if (schemaResponse.ok) {
      const schemaData = await schemaResponse.json()
      const properties = schemaData.properties || {}

      console.log("[Notion Documents API] Database schema properties:", Object.keys(properties))

      // Find the title property
      if (properties["Title"]) titlePropertyName = "Title"
      else if (properties["Name"]) titlePropertyName = "Name"

      // Find the URL property
      if (properties["Link"]) urlPropertyName = "Link"
      else if (properties["URL"]) urlPropertyName = "URL"

      // Find the type property and its type
      if (properties["Category"]) {
        typePropertyName = "Category"
        typePropertyType = properties["Category"]?.type || "select"
      } else if (properties["Type"]) {
        typePropertyName = "Type"
        typePropertyType = properties["Type"]?.type || "select"
      }

      hasDescriptionProperty = !!properties["Description"]
      hasTypeProperty = !!(properties["Type"] || properties["Category"])

      console.log("[Notion Documents API] Type property info:", {
        typePropertyName,
        typePropertyType,
        hasTypeProperty
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
      [urlPropertyName]: {
        url: url,
      },
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

    if (type && hasTypeProperty) {
      // Use the type property type we determined earlier
      if (typePropertyType === "rich_text") {
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
      } else {
        // Default to select
        properties[typePropertyName] = {
          select: {
            name: type,
          },
        }
      }
    }

    // Create new document page
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
      console.error("[Notion Documents API] Create error:", error)
      console.error("[Notion Documents API] Properties sent:", JSON.stringify(properties, null, 2))
      return NextResponse.json(
        {
          error: error.message || "Failed to create document",
          details: error,
        },
        { status: createResponse.status }
      )
    }

    const newDocument = await createResponse.json()

    return NextResponse.json({
      success: true,
      document: {
        id: newDocument.id,
        url: newDocument.url,
      },
    })
  } catch (error) {
    console.error("[Notion Documents API] Error:", error)
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
    const { documentId, title, url, description, type } = body

    if (!documentId) {
      return NextResponse.json(
        { error: "Missing documentId" },
        { status: 400 }
      )
    }

    const cleanDocumentId = documentId.replace(/-/g, "")

    // Get the document page to find the database it belongs to
    const pageResponse = await fetch(
      `https://api.notion.com/v1/pages/${cleanDocumentId}`,
      {
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
        },
      }
    )

    let titlePropertyName = "Name"
    let urlPropertyName = "URL"
    let typePropertyName = "Type"
    let typePropertyType = "select" // Default to select

    if (pageResponse.ok) {
      const pageData = await pageResponse.json()
      const databaseId = pageData.parent?.database_id

      if (databaseId) {
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

          if (properties["Title"]) titlePropertyName = "Title"
          if (properties["Link"]) urlPropertyName = "Link"

          // Get type property name and type
          if (properties["Category"]) {
            typePropertyName = "Category"
            typePropertyType = properties["Category"]?.type || "select"
          } else if (properties["Type"]) {
            typePropertyName = "Type"
            typePropertyType = properties["Type"]?.type || "select"
          }
        }
      }
    }

    // Build update properties
    const updateProperties: any = {}

    if (title) {
      updateProperties[titlePropertyName] = {
        title: [
          {
            text: {
              content: title,
            },
          },
        ],
      }
    }

    if (url) {
      updateProperties[urlPropertyName] = {
        url: url,
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

    if (type) {
      // Use the type property type we determined earlier
      if (typePropertyType === "rich_text") {
        updateProperties[typePropertyName] = {
          rich_text: [
            {
              type: "text",
              text: {
                content: type,
              },
            },
          ],
        }
      } else {
        updateProperties[typePropertyName] = {
          select: {
            name: type,
          },
        }
      }
    }

    // Update document page
    const updateResponse = await fetch(
      `https://api.notion.com/v1/pages/${cleanDocumentId}`,
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
        { error: error.message || "Failed to update document" },
        { status: updateResponse.status }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("[Notion Documents API] Error:", error)
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
    const documentId = searchParams.get("documentId")

    if (!documentId) {
      return NextResponse.json(
        { error: "Missing documentId parameter" },
        { status: 400 }
      )
    }

    const cleanDocumentId = documentId.replace(/-/g, "")

    // Archive the document page
    const archiveResponse = await fetch(
      `https://api.notion.com/v1/pages/${cleanDocumentId}`,
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
        { error: error.message || "Failed to delete document" },
        { status: archiveResponse.status }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("[Notion Documents API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
