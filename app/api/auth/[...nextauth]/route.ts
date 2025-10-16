import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

console.log("[NextAuth] Initializing NextAuth configuration")
console.log("[NextAuth] NEXTAUTH_URL:", process.env.NEXTAUTH_URL)
console.log("[NextAuth] GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "✓ Set" : "✗ Missing")
console.log("[NextAuth] GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "✓ Set" : "✗ Missing")
console.log("[NextAuth] GITHUB_ID:", process.env.GITHUB_ID ? "✓ Set" : "✗ Missing")
console.log("[NextAuth] GITHUB_SECRET:", process.env.GITHUB_SECRET ? "✓ Set" : "✗ Missing")
console.log("[NextAuth] NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? "✓ Set" : "✗ Missing")

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }