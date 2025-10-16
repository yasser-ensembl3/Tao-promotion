import { NextResponse } from "next/server"

export async function GET() {
  try {
    const notionToken = process.env.NOTION_TOKEN
    const databaseId = process.env.NOTION_DATABASE_ID

    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    )

    const data = await response.json()

    // Return the raw Notion response to see what properties are available
    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
