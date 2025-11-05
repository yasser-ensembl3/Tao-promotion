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
    const feedbacks = data.results.map((page: any) => {
      const properties = page.properties

      // Get title
      const titleProp = properties.Title || properties.title || properties.Name || properties.name
      const title = titleProp?.title?.[0]?.plain_text ||
                    titleProp?.rich_text?.[0]?.plain_text ||
                    "Untitled"

      // Get date
      const dateProp = properties.Date || properties.date || properties["Created Date"]
      const date = dateProp?.date?.start || page.created_time

      // Get feedback
      const feedbackProp = properties.Feedback || properties.feedback || properties.Message || properties.message
      const feedback = feedbackProp?.rich_text?.[0]?.plain_text || ""

      // Get user name
      const userNameProp = properties["User Name"] || properties.userName || properties.User || properties.user
      const userName = userNameProp?.rich_text?.[0]?.plain_text ||
                       userNameProp?.title?.[0]?.plain_text ||
                       "Anonymous"

      return {
        id: page.id,
        title,
        date,
        feedback,
        userName,
        url: page.url,
      }
    })

    return NextResponse.json({ feedbacks })
  } catch (error: any) {
    console.error("[Notion Feedback API] Error fetching feedbacks:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch feedbacks from Notion" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const cleanPageId = pageId.replace(/-/g, "")

    // Archive the page in Notion (soft delete)
    const response = await fetch(
      `https://api.notion.com/v1/pages/${cleanPageId}`,
      {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          archived: true,
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Notion API error: ${response.statusText}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Notion Feedback API] Error deleting feedback:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete feedback from Notion" },
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
    const { pageId, title, date, feedback, userName } = body

    console.log("[Notion Feedback API] PATCH request received:", {
      pageId,
      title,
      date,
      feedback,
      userName
    })

    if (!pageId) {
      return NextResponse.json(
        { error: "Missing required field: pageId" },
        { status: 400 }
      )
    }

    const cleanPageId = pageId.replace(/-/g, "")

    // Get the page to understand its schema
    const pageResponse = await fetch(
      `https://api.notion.com/v1/pages/${cleanPageId}`,
      {
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
        },
      }
    )

    if (!pageResponse.ok) {
      throw new Error("Failed to fetch page details")
    }

    const pageData = await pageResponse.json()
    const existingProperties = pageData.properties

    // Build update properties object
    const properties: any = {}

    // Update title if provided
    if (title) {
      const titleProp = existingProperties.Title || existingProperties.title || existingProperties.Name || existingProperties.name
      if (titleProp) {
        const propName = Object.keys(existingProperties).find(
          key => existingProperties[key] === titleProp
        )
        if (propName) {
          properties[propName] = {
            title: [
              {
                text: {
                  content: title,
                },
              },
            ],
          }
        }
      }
    }

    // Update date if provided
    if (date) {
      const dateProp = existingProperties.Date || existingProperties.date || existingProperties["Created Date"]
      if (dateProp) {
        const propName = Object.keys(existingProperties).find(
          key => existingProperties[key] === dateProp
        )
        if (propName) {
          properties[propName] = {
            date: {
              start: date,
            },
          }
        }
      }
    }

    // Update feedback if provided
    if (feedback) {
      const feedbackProp = existingProperties.Feedback || existingProperties.feedback || existingProperties.Message || existingProperties.message
      if (feedbackProp) {
        const propName = Object.keys(existingProperties).find(
          key => existingProperties[key] === feedbackProp
        )
        if (propName) {
          properties[propName] = {
            rich_text: [
              {
                type: "text",
                text: {
                  content: feedback,
                },
              },
            ],
          }
        }
      }
    }

    // Update userName if provided
    if (userName) {
      const userNameProp = existingProperties["User Name"] || existingProperties.userName || existingProperties.User || existingProperties.user
      if (userNameProp) {
        const propName = Object.keys(existingProperties).find(
          key => existingProperties[key] === userNameProp
        )
        if (propName) {
          properties[propName] = {
            rich_text: [
              {
                type: "text",
                text: {
                  content: userName,
                },
              },
            ],
          }
        }
      }
    }

    // Update the page
    const updateResponse = await fetch(
      `https://api.notion.com/v1/pages/${cleanPageId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties,
        }),
      }
    )

    if (!updateResponse.ok) {
      const error = await updateResponse.json()
      console.error("[Notion Feedback API] Update error:", error)
      return NextResponse.json(
        {
          error: error.message || "Failed to update feedback",
          details: error,
        },
        { status: updateResponse.status }
      )
    }

    const updatedFeedback = await updateResponse.json()

    return NextResponse.json({
      success: true,
      feedback: {
        id: updatedFeedback.id,
        url: updatedFeedback.url,
      },
    })
  } catch (error) {
    console.error("[Notion Feedback API] Error:", error)
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
    const { databaseId, title, date, feedback, userName } = body

    console.log("[Notion Feedback API] POST request received:", {
      title,
      date,
      feedback,
      userName
    })

    if (!databaseId || !title || !feedback || !userName) {
      return NextResponse.json(
        { error: "Missing required fields: databaseId, title, feedback, and userName" },
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

    let hasFeedbackProperty = false
    let hasDateProperty = false
    let hasUserNameProperty = false
    let titlePropertyName = "Title"
    let feedbackPropertyName = "Feedback"
    let datePropertyName = "Date"
    let userNamePropertyName = "User Name"

    if (schemaResponse.ok) {
      const schemaData = await schemaResponse.json()
      const properties = schemaData.properties || {}

      console.log("[Notion Feedback API] Database schema properties:", Object.keys(properties))

      // Find the title property (should be title type)
      if (properties["Title"]) titlePropertyName = "Title"
      else if (properties["title"]) titlePropertyName = "title"
      else if (properties["Name"]) titlePropertyName = "Name"
      else if (properties["name"]) titlePropertyName = "name"

      // Find feedback property
      if (properties["Feedback"]) {
        feedbackPropertyName = "Feedback"
        hasFeedbackProperty = true
      } else if (properties["feedback"]) {
        feedbackPropertyName = "feedback"
        hasFeedbackProperty = true
      } else if (properties["Message"]) {
        feedbackPropertyName = "Message"
        hasFeedbackProperty = true
      } else if (properties["message"]) {
        feedbackPropertyName = "message"
        hasFeedbackProperty = true
      }

      // Find date property
      if (properties["Date"]) {
        datePropertyName = "Date"
        hasDateProperty = true
      } else if (properties["date"]) {
        datePropertyName = "date"
        hasDateProperty = true
      } else if (properties["Created Date"]) {
        datePropertyName = "Created Date"
        hasDateProperty = true
      }

      // Find user name property
      if (properties["User Name"]) {
        userNamePropertyName = "User Name"
        hasUserNameProperty = true
      } else if (properties["userName"]) {
        userNamePropertyName = "userName"
        hasUserNameProperty = true
      } else if (properties["User"]) {
        userNamePropertyName = "User"
        hasUserNameProperty = true
      } else if (properties["user"]) {
        userNamePropertyName = "user"
        hasUserNameProperty = true
      }

      console.log("[Notion Feedback API] Property checks:", {
        hasFeedbackProperty,
        hasDateProperty,
        hasUserNameProperty
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

    if (date && hasDateProperty) {
      properties[datePropertyName] = {
        date: {
          start: date,
        },
      }
    }

    if (feedback && hasFeedbackProperty) {
      properties[feedbackPropertyName] = {
        rich_text: [
          {
            type: "text",
            text: {
              content: feedback,
            },
          },
        ],
      }
    }

    if (userName && hasUserNameProperty) {
      properties[userNamePropertyName] = {
        rich_text: [
          {
            type: "text",
            text: {
              content: userName,
            },
          },
        ],
      }
    }

    // Create new feedback page
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
      console.error("[Notion Feedback API] Create error:", error)
      console.error("[Notion Feedback API] Properties sent:", JSON.stringify(properties, null, 2))
      return NextResponse.json(
        {
          error: error.message || "Failed to create feedback",
          details: error,
        },
        { status: createResponse.status }
      )
    }

    const newFeedback = await createResponse.json()

    return NextResponse.json({
      success: true,
      feedback: {
        id: newFeedback.id,
        url: newFeedback.url,
      },
    })
  } catch (error) {
    console.error("[Notion Feedback API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
