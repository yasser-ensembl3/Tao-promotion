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
      }

      // Get category/section from either select or rich_text
      let category = "other"
      if (properties.Section?.select?.name) {
        category = properties.Section.select.name
      } else if (properties.Section?.rich_text?.[0]?.plain_text) {
        category = properties.Section.rich_text[0].plain_text
      } else if (properties.Category?.select?.name) {
        category = properties.Category.select.name
      } else if (properties.Category?.rich_text?.[0]?.plain_text) {
        category = properties.Category.rich_text[0].plain_text
      }

      // Normalize category value to match frontend constants
      const categoryMap: Record<string, string> = {
        "Databases": "database",
        "database": "database",
        "Tools": "tool",
        "tool": "tool",
        "Apps & Websites": "website",
        "Apps/Websites": "website",
        "website": "website",
        "Social Media": "social",
        "social": "social",
        "Documentation": "document",
        "document": "document",
        "Other Links": "other",
        "Other": "other",
        "other": "other"
      }
      category = categoryMap[category] || "other"

      const doc = {
        id: page.id,
        title: properties.Name?.title?.[0]?.plain_text || properties.Title?.title?.[0]?.plain_text || "",
        url: properties.URL?.url || properties.Link?.url || "",
        description: properties.Description?.rich_text?.[0]?.plain_text || "",
        type: type,
        category: category,
      }

      console.log(`[Notion Documents API] Document "${doc.title}" - Section: ${category}`)
      return doc
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
    const { databaseId, title, url, description, type, category } = body

    console.log("[Notion Documents API] POST request received:", {
      title,
      url,
      type,
      category
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
    let hasCategoryProperty = false
    let titlePropertyName = "Name"
    let urlPropertyName = "URL"
    let typePropertyName = "Type"
    let typePropertyType = "select" // Default to select
    let categoryPropertyName = "Section" // Prefer Section over Category
    let categoryPropertyType = "select" // Default to select

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
      if (properties["Type"]) {
        typePropertyName = "Type"
        typePropertyType = properties["Type"]?.type || "select"
        hasTypeProperty = true
      }

      // Find the category/section property and its type (prefer Section)
      if (properties["Section"]) {
        categoryPropertyName = "Section"
        categoryPropertyType = properties["Section"]?.type || "select"
        hasCategoryProperty = true
      } else if (properties["Category"]) {
        categoryPropertyName = "Category"
        categoryPropertyType = properties["Category"]?.type || "select"
        hasCategoryProperty = true
      }

      hasDescriptionProperty = !!properties["Description"]

      console.log("[Notion Documents API] Property info:", {
        typePropertyName,
        typePropertyType,
        hasTypeProperty,
        categoryPropertyName,
        categoryPropertyType,
        hasCategoryProperty
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

    if (category && hasCategoryProperty) {
      console.log(`[Notion Documents API] Setting ${categoryPropertyName} to: ${category}`)
      // Use the category property type we determined earlier
      if (categoryPropertyType === "rich_text") {
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
      } else {
        // Default to select
        properties[categoryPropertyName] = {
          select: {
            name: category,
          },
        }
      }
    } else {
      console.log(`[Notion Documents API] Cannot set category - hasCategoryProperty: ${hasCategoryProperty}, category: ${category}`)
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
    const { documentId, title, url, description, type, category } = body

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
    let categoryPropertyName = "Section" // Prefer Section over Category
    let categoryPropertyType = "select" // Default to select

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
          if (properties["Type"]) {
            typePropertyName = "Type"
            typePropertyType = properties["Type"]?.type || "select"
          }

          // Get category/section property name and type (prefer Section)
          if (properties["Section"]) {
            categoryPropertyName = "Section"
            categoryPropertyType = properties["Section"]?.type || "select"
          } else if (properties["Category"]) {
            categoryPropertyName = "Category"
            categoryPropertyType = properties["Category"]?.type || "select"
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

    if (category) {
      // Use the category property type we determined earlier
      if (categoryPropertyType === "rich_text") {
        updateProperties[categoryPropertyName] = {
          rich_text: [
            {
              type: "text",
              text: {
                content: category,
              },
            },
          ],
        }
      } else {
        updateProperties[categoryPropertyName] = {
          select: {
            name: category,
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
