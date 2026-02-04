import { NextRequest, NextResponse } from "next/server"

/**
 * Validates API key from Authorization header
 * Usage: Bearer <api_key>
 */
export function validateApiKey(request: NextRequest): { valid: boolean; error?: string } {
  const authHeader = request.headers.get("authorization")

  if (!authHeader) {
    return { valid: false, error: "Missing Authorization header" }
  }

  if (!authHeader.startsWith("Bearer ")) {
    return { valid: false, error: "Invalid Authorization format. Use: Bearer <api_key>" }
  }

  const apiKey = authHeader.slice(7) // Remove "Bearer " prefix
  const validApiKey = process.env.MINIVAULT_API_KEY

  if (!validApiKey) {
    console.error("[API Auth] MINIVAULT_API_KEY not configured")
    return { valid: false, error: "API authentication not configured" }
  }

  if (apiKey !== validApiKey) {
    return { valid: false, error: "Invalid API key" }
  }

  return { valid: true }
}

/**
 * Returns an unauthorized response
 */
export function unauthorizedResponse(error: string): NextResponse {
  return NextResponse.json(
    { error, code: "UNAUTHORIZED" },
    { status: 401 }
  )
}

/**
 * Middleware wrapper for protected API routes
 */
export function withApiAuth(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const auth = validateApiKey(request)

    if (!auth.valid) {
      return unauthorizedResponse(auth.error || "Unauthorized")
    }

    return handler(request)
  }
}
