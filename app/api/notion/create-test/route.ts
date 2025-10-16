import { NextResponse } from "next/server"

export async function POST() {
  try {
    const notionToken = process.env.NOTION_TOKEN
    const databaseId = process.env.NOTION_DATABASE_ID

    const response = await fetch(
      `https://api.notion.com/v1/pages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parent: {
            database_id: databaseId
          },
          properties: {
            Name: {
              title: [
                {
                  text: {
                    content: "Test créé par API"
                  }
                }
              ]
            },
            Status: {
              status: {
                name: "Pas commencé"
              }
            },
            "Due Date": {
              date: {
                start: "2025-10-20"
              }
            },
            Priority: {
              select: {
                name: "High"
              }
            },
            Tags: {
              multi_select: [
                { name: "test" },
                { name: "api" }
              ]
            }
          }
        }),
      }
    )

    const data = await response.json()
    return NextResponse.json(data, { status: response.ok ? 200 : 500 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
