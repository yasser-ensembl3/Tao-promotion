import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, date, feedback, userName } = body

    if (!title || !feedback || !userName) {
      return NextResponse.json(
        { error: "Title, feedback, and user name are required" },
        { status: 400 }
      )
    }

    // Create feedbacks directory if it doesn't exist
    const feedbacksDir = path.join(process.cwd(), "data", "feedbacks")
    if (!fs.existsSync(feedbacksDir)) {
      fs.mkdirSync(feedbacksDir, { recursive: true })
    }

    // Sanitize filename
    const sanitizedTitle = title
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()
      .substring(0, 50)

    const feedbackDate = date || new Date().toISOString().split('T')[0]
    const filename = `${feedbackDate}_${sanitizedTitle}.txt`
    const filepath = path.join(feedbacksDir, filename)

    // Create file content
    const content = `Title: ${title}
Date: ${feedbackDate}
User: ${userName}

Feedback:
${feedback}

---
Created: ${new Date().toISOString()}
`

    // Write to file
    fs.writeFileSync(filepath, content, "utf-8")

    return NextResponse.json({
      success: true,
      filename,
      path: filepath
    })
  } catch (error: any) {
    console.error("Error saving feedback to file:", error)
    return NextResponse.json(
      { error: "Failed to save feedback to file", details: error.message },
      { status: 500 }
    )
  }
}
