# MiniVault API Documentation

This document provides comprehensive documentation for all API routes in MiniVault.

## Overview

MiniVault uses Next.js API routes to proxy requests to external services. All routes are located in the `app/api/` directory and follow RESTful conventions where applicable.

### Authentication

- **OAuth Routes**: Handled by NextAuth.js at `/api/auth/[...nextauth]`
- **Protected Routes**: Use `getServerSession(authOptions)` to validate user session
- **Token-Based**: Google Drive and GitHub routes use OAuth access tokens from the session
- **Environment-Based**: Notion route uses server-side environment variable

---

## Authentication Routes

### `GET/POST /api/auth/[...nextauth]`

NextAuth.js catch-all route for authentication flows.

**Endpoints:**
- `/api/auth/signin` - Sign in page
- `/api/auth/signout` - Sign out
- `/api/auth/callback/[provider]` - OAuth callbacks
- `/api/auth/session` - Get current session
- `/api/auth/csrf` - Get CSRF token
- `/api/auth/providers` - List available providers

**Configuration:**
- Defined in `lib/auth.ts`
- Supports Google and GitHub OAuth providers
- Stores access tokens in JWT
- Exposes tokens via session object

**Response (Session):**
```json
{
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "image": "https://..."
  },
  "accessToken": "ya29.a0...",
  "refreshToken": "1//...",
  "provider": "google",
  "expires": "2024-01-01T00:00:00.000Z"
}
```

**Environment Variables:**
- `NEXTAUTH_URL` - Base URL of the application
- `NEXTAUTH_SECRET` - Secret for encrypting tokens
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GITHUB_ID` - GitHub OAuth client ID
- `GITHUB_SECRET` - GitHub OAuth client secret

---

## Notion Routes

### `GET /api/notion/database`

Fetch Notion database metadata and pages.

**Query Parameters:**
- `databaseId` (required) - Notion database ID (with or without hyphens)

**Authentication:**
- Uses `NOTION_TOKEN` from environment variables
- No user session required (server-side only)

**Request Example:**
```
GET /api/notion/database?databaseId=28c58fe731b18014b9b4f0a6e0b6a576
```

**Response (Success - 200):**
```json
{
  "database": {
    "id": "28c58fe7-31b1-8014-b9b4-f0a6e0b6a576",
    "title": "Project Tasks",
    "url": "https://www.notion.so/28c58fe731b18014b9b4f0a6e0b6a576",
    "createdTime": "2024-01-01T00:00:00.000Z",
    "lastEditedTime": "2024-01-15T00:00:00.000Z",
    "icon": null,
    "cover": null
  },
  "pages": [
    {
      "id": "page-id-1",
      "url": "https://www.notion.so/page-id-1",
      "createdTime": "2024-01-01T00:00:00.000Z",
      "lastEditedTime": "2024-01-15T00:00:00.000Z",
      "properties": {
        "Name": "Task 1",
        "Status": "In Progress",
        "Priority": "High",
        "Due Date": "2024-02-01",
        "Tags": ["feature", "urgent"]
      }
    }
  ],
  "totalPages": 50,
  "hasMore": false
}
```

**Response (Error - 400):**
```json
{
  "error": "Missing databaseId parameter"
}
```

**Response (Error - 500):**
```json
{
  "error": "Notion integration token not configured"
}
```

**Implementation Details:**
- Cleans database ID by removing hyphens
- Fetches up to 50 pages per request
- Sorts pages by `last_edited_time` descending
- Extracts and formats properties based on type
- Supported property types: title, rich_text, number, select, multi_select, date, checkbox, url, email, phone_number, status

**Property Type Handling:**
- `title` → First plain text value
- `rich_text` → First plain text value
- `number` → Numeric value
- `select` → Selected option name
- `multi_select` → Array of selected option names
- `date` → ISO date string (start date)
- `checkbox` → Boolean value
- `url` → URL string
- `email` → Email string
- `phone_number` → Phone string
- `status` → Status name

---

## GitHub Routes

### `GET /api/github/repo`

Fetch GitHub repository information, commits, issues, and pull requests.

**Query Parameters:**
- `owner` (required) - Repository owner username or organization
- `repo` (required) - Repository name

**Authentication:**
- Requires valid user session with GitHub provider
- Uses `accessToken` from session

**Request Example:**
```
GET /api/github/repo?owner=octocat&repo=hello-world
```

**Response (Success - 200):**
```json
{
  "repository": {
    "name": "hello-world",
    "fullName": "octocat/hello-world",
    "description": "My first repository",
    "stars": 1234,
    "forks": 567,
    "openIssues": 12,
    "defaultBranch": "main",
    "language": "JavaScript",
    "updatedAt": "2024-01-15T00:00:00.000Z",
    "htmlUrl": "https://github.com/octocat/hello-world"
  },
  "commits": [
    {
      "sha": "abc123",
      "message": "Fix bug in authentication",
      "author": "John Doe",
      "date": "2024-01-15T00:00:00.000Z",
      "url": "https://github.com/octocat/hello-world/commit/abc123"
    }
  ],
  "issues": [
    {
      "number": 42,
      "title": "Bug: Login not working",
      "state": "open",
      "createdAt": "2024-01-10T00:00:00.000Z",
      "url": "https://github.com/octocat/hello-world/issues/42",
      "labels": ["bug", "priority-high"]
    }
  ],
  "pullRequests": [
    {
      "number": 15,
      "title": "Add dark mode support",
      "state": "open",
      "createdAt": "2024-01-12T00:00:00.000Z",
      "url": "https://github.com/octocat/hello-world/pull/15",
      "author": "jane-dev"
    }
  ]
}
```

**Response (Error - 400):**
```json
{
  "error": "Missing owner or repo parameter"
}
```

**Response (Error - 401):**
```json
{
  "error": "No access token found. Please sign in with GitHub."
}
```

**Response (Error - 404):**
```json
{
  "error": "Repository not found"
}
```

**Implementation Details:**
- Makes parallel requests to GitHub API:
  - `/repos/{owner}/{repo}` - Repository metadata
  - `/repos/{owner}/{repo}/commits?per_page=10` - Recent commits
  - `/repos/{owner}/{repo}/issues?state=open&per_page=10` - Open issues
  - `/repos/{owner}/{repo}/pulls?state=open&per_page=10` - Open pull requests
- Returns only the 5 most recent commits
- Returns up to 10 open issues and PRs
- Uses GitHub API v3 with Accept header `application/vnd.github.v3+json`

**Required OAuth Scopes:**
- `read:user` - Read user profile
- `user:email` - Read user email
- `repo` - Access repositories

---

## Google Drive Routes

### `GET /api/drive/files`

Fetch files from a Google Drive folder.

**Query Parameters:**
- `folderId` (required) - Google Drive folder ID

**Authentication:**
- Requires valid user session with Google provider
- Uses `accessToken` from session

**Request Example:**
```
GET /api/drive/files?folderId=1a2b3c4d5e6f7g8h9i0j
```

**Response (Success - 200):**
```json
{
  "folder": {
    "id": "1a2b3c4d5e6f7g8h9i0j",
    "name": "Project Documentation",
    "modifiedTime": "2024-01-15T00:00:00.000Z",
    "webViewLink": "https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j"
  },
  "files": [
    {
      "id": "file-id-1",
      "name": "Meeting Notes.docx",
      "mimeType": "application/vnd.google-apps.document",
      "modifiedTime": "2024-01-15T00:00:00.000Z",
      "createdTime": "2024-01-01T00:00:00.000Z",
      "webViewLink": "https://docs.google.com/document/d/file-id-1",
      "iconLink": "https://...",
      "size": "12345",
      "isFolder": false,
      "isDocument": true,
      "isSpreadsheet": false,
      "isPresentation": false
    },
    {
      "id": "folder-id-1",
      "name": "Subfolder",
      "mimeType": "application/vnd.google-apps.folder",
      "modifiedTime": "2024-01-14T00:00:00.000Z",
      "createdTime": "2024-01-01T00:00:00.000Z",
      "webViewLink": "https://drive.google.com/drive/folders/folder-id-1",
      "iconLink": "https://...",
      "size": null,
      "isFolder": true,
      "isDocument": false,
      "isSpreadsheet": false,
      "isPresentation": false
    }
  ],
  "totalFiles": 25
}
```

**Response (Error - 400):**
```json
{
  "error": "Missing folderId parameter"
}
```

**Response (Error - 401):**
```json
{
  "error": "No access token found. Please sign in with Google."
}
```

**Response (Error - 404):**
```json
{
  "error": "Folder not found"
}
```

**Implementation Details:**
- Fetches up to 50 files per request
- Orders files by `modifiedTime` descending
- Includes file type detection flags
- Makes two API calls:
  1. Fetch files in folder
  2. Fetch folder metadata
- Uses Google Drive API v3

**File Type Detection:**
- `isFolder` - `mimeType === "application/vnd.google-apps.folder"`
- `isDocument` - `mimeType === "application/vnd.google-apps.document"`
- `isSpreadsheet` - `mimeType === "application/vnd.google-apps.spreadsheet"`
- `isPresentation` - `mimeType === "application/vnd.google-apps.presentation"`

**Fields Requested:**
- `id` - File ID
- `name` - File name
- `mimeType` - MIME type
- `modifiedTime` - Last modified timestamp
- `webViewLink` - Web viewer URL
- `iconLink` - File icon URL
- `size` - File size in bytes
- `createdTime` - Creation timestamp

**Required OAuth Scopes:**
- `https://www.googleapis.com/auth/drive.readonly` - Read-only access to Drive

---

## Error Handling

All API routes follow a consistent error handling pattern:

**Error Response Format:**
```json
{
  "error": "Error message describing what went wrong"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing parameters, invalid input)
- `401` - Unauthorized (missing or invalid authentication)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error (server-side error)

**Common Error Scenarios:**
1. **Missing Parameters**: Return 400 with descriptive message
2. **Authentication Failure**: Return 401 with instructions to sign in
3. **External API Errors**: Return error status from external API with message
4. **Server Errors**: Return 500 with generic error message (details logged server-side)

---

## Rate Limiting

MiniVault does not implement its own rate limiting, but respects rate limits from external APIs:

**GitHub API:**
- Authenticated: 5,000 requests per hour
- Check remaining: Response header `X-RateLimit-Remaining`

**Google APIs:**
- Varies by API and quota
- Check quota in Google Cloud Console

**Notion API:**
- 3 requests per second average
- Burst allowed up to 100 requests in 10 seconds

**Best Practices:**
- Cache responses in your frontend
- Implement exponential backoff for retries
- Monitor rate limit headers
- Use webhooks for real-time updates (where available)

---

## Testing

### Manual Testing

Use curl or Postman to test API routes:

```bash
# Test Notion API
curl "http://localhost:3000/api/notion/database?databaseId=YOUR_DATABASE_ID"

# Test GitHub API (requires auth cookie)
curl -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  "http://localhost:3000/api/github/repo?owner=octocat&repo=hello-world"

# Test Drive API (requires auth cookie)
curl -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  "http://localhost:3000/api/drive/files?folderId=YOUR_FOLDER_ID"
```

### Integration Testing

For authenticated routes, use the NextAuth session:

1. Sign in via the UI
2. Open browser DevTools
3. Copy session token from cookies
4. Use token in API requests
5. Verify response structure and data

---

## Future Enhancements

Potential API improvements:

1. **Pagination**: Add support for cursor-based pagination
2. **Filtering**: Allow query parameters for filtering results
3. **Caching**: Implement Redis/memory caching for frequently accessed data
4. **Webhooks**: Add webhook endpoints for real-time updates
5. **GraphQL**: Consider GraphQL API for more flexible queries
6. **Rate Limiting**: Implement per-user rate limiting
7. **API Versioning**: Add `/v1/` prefix for future version support
8. **Batch Operations**: Support batch requests to reduce round trips
9. **Search**: Add full-text search across all integrated services
10. **Analytics**: Track API usage and performance metrics

---

## Security Considerations

**OAuth Token Storage:**
- Access tokens stored in JWT (encrypted)
- Tokens not exposed to client except via session
- Use HTTPS in production to protect tokens in transit

**Environment Variables:**
- Never commit `.env.local` to version control
- Use secure secret management in production (e.g., Vercel secrets, AWS Secrets Manager)
- Rotate secrets regularly

**Input Validation:**
- Validate all query parameters
- Sanitize database IDs before making external requests
- Use TypeScript for type safety

**CORS:**
- Next.js API routes don't require CORS for same-origin requests
- If adding external access, configure CORS properly

**Session Security:**
- Use secure session cookies (httpOnly, secure, sameSite)
- Implement CSRF protection (provided by NextAuth)
- Set appropriate session expiration times

---

## Support

For API-related issues:
- Check console logs for detailed error messages
- Review environment variables configuration
- Verify OAuth scopes match required permissions
- Consult external API documentation for service-specific issues
- Open a GitHub issue for bug reports
