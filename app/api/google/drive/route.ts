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
      scopes: [
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/documents.readonly",
      ],
    })

    const drive = google.drive({ version: "v3", auth })

    // List files
    const response = await drive.files.list({
      pageSize: maxResults,
      q: query,
      fields: "files(id, name, mimeType, createdTime, modifiedTime, webViewLink, iconLink)",
      orderBy: "modifiedTime desc",
    })

    const files = response.data.files || []

    return NextResponse.json({
      files: files.map((file) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
        iconLink: file.iconLink,
      })),
    })
  } catch (error: any) {
    console.error("[Drive API] Error fetching files:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch Google Drive files" },
      { status: 500 }
    )
  }
}
