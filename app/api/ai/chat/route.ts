import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import Anthropic from "@anthropic-ai/sdk"

export async function POST(request: NextRequest) {
  try {
    const { message, provider = "openai", model } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    if (provider === "openai") {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })

      const completion = await openai.chat.completions.create({
        model: model || "gpt-4-turbo-preview",
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
      })

      return NextResponse.json({
        response: completion.choices[0].message.content,
        provider: "openai",
        model: completion.model,
      })
    } else if (provider === "anthropic") {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })

      const message_response = await anthropic.messages.create({
        model: model || "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
      })

      const content = message_response.content[0]
      const responseText = content.type === "text" ? content.text : ""

      return NextResponse.json({
        response: responseText,
        provider: "anthropic",
        model: message_response.model,
      })
    } else {
      return NextResponse.json(
        { error: "Invalid provider. Use 'openai' or 'anthropic'" },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error("[AI API] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process AI request" },
      { status: 500 }
    )
  }
}
