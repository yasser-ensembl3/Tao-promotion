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
    const projectPageId = searchParams.get("projectPageId")

    if (!projectPageId) {
      return NextResponse.json(
        { error: "Missing projectPageId parameter" },
        { status: 400 }
      )
    }

    const cleanPageId = projectPageId.replace(/-/g, "")

    // Get the blocks (content) of the page
    const blocksResponse = await fetch(
      `https://api.notion.com/v1/blocks/${cleanPageId}/children`,
      {
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
        },
      }
    )

    if (!blocksResponse.ok) {
      return NextResponse.json(
        { error: "Failed to get project overview" },
        { status: blocksResponse.status }
      )
    }

    const blocksData = await blocksResponse.json()

    // Find heading blocks for Description and Vision
    let description = ""
    let vision = ""
    let descriptionBlockId = ""
    let visionBlockId = ""

    for (let i = 0; i < blocksData.results.length; i++) {
      const block = blocksData.results[i]

      // Look for "Description" heading
      if (
        (block.type === "heading_2" || block.type === "heading_3") &&
        block[block.type]?.rich_text?.[0]?.plain_text === "Description"
      ) {
        descriptionBlockId = block.id
        // Get the paragraph after this heading
        if (i + 1 < blocksData.results.length) {
          const nextBlock = blocksData.results[i + 1]
          if (nextBlock.type === "paragraph") {
            description = nextBlock.paragraph?.rich_text?.[0]?.plain_text || ""
          }
        }
      }

      // Look for "Vision" heading
      if (
        (block.type === "heading_2" || block.type === "heading_3") &&
        block[block.type]?.rich_text?.[0]?.plain_text === "Vision"
      ) {
        visionBlockId = block.id
        // Get the paragraph after this heading
        if (i + 1 < blocksData.results.length) {
          const nextBlock = blocksData.results[i + 1]
          if (nextBlock.type === "paragraph") {
            vision = nextBlock.paragraph?.rich_text?.[0]?.plain_text || ""
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      description,
      vision,
      descriptionBlockId,
      visionBlockId,
    })
  } catch (error) {
    console.error("[Notion Project Overview API] Error:", error)
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
    const { projectPageId, description, vision } = body

    if (!projectPageId) {
      return NextResponse.json(
        { error: "Missing projectPageId" },
        { status: 400 }
      )
    }

    const cleanPageId = projectPageId.replace(/-/g, "")

    // Get current blocks to find or create Description and Vision sections
    const blocksResponse = await fetch(
      `https://api.notion.com/v1/blocks/${cleanPageId}/children`,
      {
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
        },
      }
    )

    if (!blocksResponse.ok) {
      return NextResponse.json(
        { error: "Failed to get project blocks" },
        { status: blocksResponse.status }
      )
    }

    const blocksData = await blocksResponse.json()

    // Find existing Description and Vision blocks
    let descriptionParagraphId = ""
    let visionParagraphId = ""

    for (let i = 0; i < blocksData.results.length; i++) {
      const block = blocksData.results[i]

      if (
        (block.type === "heading_2" || block.type === "heading_3") &&
        block[block.type]?.rich_text?.[0]?.plain_text === "Description"
      ) {
        if (i + 1 < blocksData.results.length) {
          const nextBlock = blocksData.results[i + 1]
          if (nextBlock.type === "paragraph") {
            descriptionParagraphId = nextBlock.id
          }
        }
      }

      if (
        (block.type === "heading_2" || block.type === "heading_3") &&
        block[block.type]?.rich_text?.[0]?.plain_text === "Vision"
      ) {
        if (i + 1 < blocksData.results.length) {
          const nextBlock = blocksData.results[i + 1]
          if (nextBlock.type === "paragraph") {
            visionParagraphId = nextBlock.id
          }
        }
      }
    }

    // Update or create Description
    if (description !== undefined) {
      if (descriptionParagraphId) {
        // Update existing paragraph
        await fetch(
          `https://api.notion.com/v1/blocks/${descriptionParagraphId}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${notionToken}`,
              "Notion-Version": "2022-06-28",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              paragraph: {
                rich_text: [
                  {
                    type: "text",
                    text: {
                      content: description,
                    },
                  },
                ],
              },
            }),
          }
        )
      } else {
        // Create new Description section
        await fetch(
          `https://api.notion.com/v1/blocks/${cleanPageId}/children`,
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
                  type: "heading_3",
                  heading_3: {
                    rich_text: [
                      {
                        type: "text",
                        text: {
                          content: "Description",
                        },
                      },
                    ],
                  },
                },
                {
                  object: "block",
                  type: "paragraph",
                  paragraph: {
                    rich_text: [
                      {
                        type: "text",
                        text: {
                          content: description,
                        },
                      },
                    ],
                  },
                },
              ],
            }),
          }
        )
      }
    }

    // Update or create Vision
    if (vision !== undefined) {
      if (visionParagraphId) {
        // Update existing paragraph
        await fetch(
          `https://api.notion.com/v1/blocks/${visionParagraphId}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${notionToken}`,
              "Notion-Version": "2022-06-28",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              paragraph: {
                rich_text: [
                  {
                    type: "text",
                    text: {
                      content: vision,
                    },
                  },
                ],
              },
            }),
          }
        )
      } else {
        // Create new Vision section
        await fetch(
          `https://api.notion.com/v1/blocks/${cleanPageId}/children`,
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
                  type: "heading_3",
                  heading_3: {
                    rich_text: [
                      {
                        type: "text",
                        text: {
                          content: "Vision",
                        },
                      },
                    ],
                  },
                },
                {
                  object: "block",
                  type: "paragraph",
                  paragraph: {
                    rich_text: [
                      {
                        type: "text",
                        text: {
                          content: vision,
                        },
                      },
                    ],
                  },
                },
              ],
            }),
          }
        )
      }
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("[Notion Project Overview API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
