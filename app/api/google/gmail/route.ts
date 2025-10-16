import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const maxResults = parseInt(searchParams.get("maxResults") || "10")
    const query = searchParams.get("query") || ""

    // Parse the service account key from environment variable
    const serviceAccountKey = JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}"
    )

    // Create JWT client for service account authentication
    const auth = new google.auth.JWT({
      email: serviceAccountKey.client_email,
      key: serviceAccountKey.private_key,
      scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
    })

    const gmail = google.gmail({ version: "v1", auth })

    // List messages
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults,
      q: query,
    })

    const messages = response.data.messages || []

    // Get full message details
    const detailedMessages = await Promise.all(
      messages.slice(0, maxResults).map(async (msg) => {
        const detail = await gmail.users.messages.get({
          userId: "me",
          id: msg.id!,
          format: "full",
        })

        const headers = detail.data.payload?.headers || []
        const subject = headers.find((h) => h.name === "Subject")?.value || "No Subject"
        const from = headers.find((h) => h.name === "From")?.value || "Unknown"
        const date = headers.find((h) => h.name === "Date")?.value || ""

        return {
          id: msg.id,
          threadId: msg.threadId,
          subject,
          from,
          date,
          snippet: detail.data.snippet,
        }
      })
    )

    return NextResponse.json({ messages: detailedMessages })
  } catch (error: any) {
    console.error("[Gmail API] Error fetching emails:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch Gmail messages" },
      { status: 500 }
    )
  }
}
