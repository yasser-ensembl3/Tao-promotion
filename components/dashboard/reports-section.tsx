"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardSection } from "./dashboard-section"

export function ReportsSection() {
  const [generating, setGenerating] = useState(false)
  const [report, setReport] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reportsCount, setReportsCount] = useState(0)

  const generateReport = async () => {
    setGenerating(true)
    setError(null)
    try {
      // Fetch tasks from Notion first
      const tasksResponse = await fetch("/api/notion/tasks")
      const tasksData = await tasksResponse.json()

      if (!tasksResponse.ok) {
        throw new Error("Failed to fetch tasks data")
      }

      // Generate summary with AI
      const aiResponse = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Generate a comprehensive weekly project summary report based on this data:\n\nTasks: ${JSON.stringify(tasksData.tasks)}\n\nInclude:\n1. Executive Summary\n2. Task Completion Stats\n3. Key Achievements\n4. Blockers & Issues\n5. Next Week's Priorities\n\nFormat the report in markdown.`,
          provider: "openai",
        }),
      })

      const aiData = await aiResponse.json()

      if (!aiResponse.ok) {
        throw new Error(aiData.error || "Failed to generate report")
      }

      setReport(aiData.response)
      setReportsCount(prev => prev + 1)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const keyMetrics = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold">{reportsCount}</div>
        <div className="text-sm text-muted-foreground">Reports Generated</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{report ? "100%" : "0%"}</div>
        <div className="text-sm text-muted-foreground">Data Coverage</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{report ? "Now" : "-"}</div>
        <div className="text-sm text-muted-foreground">Latest Report</div>
      </div>
    </div>
  )

  const detailedContent = (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Weekly Reports</h4>
          <Button size="sm" onClick={generateReport} disabled={generating}>
            {generating ? "Generating..." : "Generate New Report"}
          </Button>
        </div>

        {error && (
          <div className="p-4 border border-red-500 rounded-lg bg-red-500/10 mb-4">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {generating ? (
          <div className="p-8 border rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Generating your weekly report with AI...</p>
          </div>
        ) : report ? (
          <div className="p-6 border rounded-lg bg-muted/50">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm">{report}</pre>
            </div>
          </div>
        ) : (
          <div className="p-8 border rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              No reports available. Reports will be generated from connected data sources.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Click "Generate New Report" to create your first weekly summary.
            </p>
          </div>
        )}
      </div>

      <div>
        <h4 className="font-semibold mb-3">Report Configuration</h4>
        <div className="p-4 border rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">AI Provider</span>
            <span className="text-sm font-medium">OpenAI GPT-4</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Data Sources</span>
            <span className="text-sm font-medium">Notion Tasks</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Report Format</span>
            <span className="text-sm font-medium">Markdown</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <DashboardSection
      title="Weekly Reports"
      description="Generate comprehensive weekly summaries when needed"
      icon="📊"
      keyMetrics={keyMetrics}
      detailedContent={detailedContent}
    />
  )
}