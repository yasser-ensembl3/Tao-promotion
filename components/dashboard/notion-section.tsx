"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DashboardSection } from "./dashboard-section"
import { useProjectConfig } from "@/contexts/project-config-context"
import { ExternalLink, Database, AlertCircle } from "lucide-react"

interface NotionPage {
  id: string
  url: string
  createdTime: string
  lastEditedTime: string
  properties: Record<string, any>
}

interface NotionData {
  database: {
    id: string
    title: string
    url: string
    createdTime: string
    lastEditedTime: string
  }
  pages: NotionPage[]
  totalPages: number
  hasMore: boolean
}

export function NotionSection() {
  const { config } = useProjectConfig()
  const [data, setData] = useState<NotionData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNotionData = useCallback(async () => {
    if (!config.notion?.databaseId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/notion/database?databaseId=${config.notion.databaseId}`
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch Notion data")
      }

      const notionData = await response.json()
      setData(notionData)
    } catch (err: any) {
      console.error("[NotionSection] Error:", err)
      setError(err.message || "Failed to fetch Notion data")
    } finally {
      setLoading(false)
    }
  }, [config.notion?.databaseId])

  useEffect(() => {
    if (config.notion?.databaseId) {
      fetchNotionData()
    }
  }, [config.notion?.databaseId, fetchNotionData])

  const keyMetrics = data ? (
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center p-3 bg-muted/50 rounded-lg">
        <div className="text-2xl font-bold">{data.totalPages}</div>
        <div className="text-xs text-muted-foreground">Total Pages</div>
      </div>
      <div className="text-center p-3 bg-muted/50 rounded-lg">
        <div className="text-2xl font-bold">{data.hasMore ? "50+" : data.totalPages}</div>
        <div className="text-xs text-muted-foreground">Showing</div>
      </div>
    </div>
  ) : null

  // Helper to get the first title property value
  const getPageTitle = (page: NotionPage) => {
    const titleKey = Object.keys(page.properties).find(
      (key) => page.properties[key] && typeof page.properties[key] === "string" && page.properties[key]
    )
    return titleKey ? page.properties[titleKey] : "Untitled"
  }

  const detailedContent = (
    <div className="space-y-6">
      {loading && (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading Notion data...</div>
        </div>
      )}

      {error && (
        <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {!config.notion?.databaseId ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            No Notion database configured. Click &quot;Project Settings&quot; to configure your database.
          </p>
        </div>
      ) : data && (
        <>
          {/* Database Info */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Database</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(data.database.url, "_blank")}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open in Notion
              </Button>
            </div>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h5 className="font-medium">{data.database.title}</h5>
                    <p className="text-xs text-muted-foreground">
                      Last edited: {new Date(data.database.lastEditedTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pages List */}
          <div>
            <h4 className="font-semibold mb-3">Pages</h4>
            {data.pages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No pages found in this database
              </p>
            ) : (
              <div className="space-y-2">
                {data.pages.map((page) => (
                  <Card key={page.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{getPageTitle(page)}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {Object.entries(page.properties).map(([key, value]) => {
                              // Skip empty values and title (already shown)
                              if (!value || value === getPageTitle(page)) return null

                              // Display different property types
                              if (typeof value === "string") {
                                return (
                                  <Badge key={key} variant="outline" className="text-xs">
                                    {key}: {value}
                                  </Badge>
                                )
                              } else if (typeof value === "boolean") {
                                return value ? (
                                  <Badge key={key} variant="secondary" className="text-xs">
                                    {key}
                                  </Badge>
                                ) : null
                              } else if (Array.isArray(value) && value.length > 0) {
                                return (
                                  <Badge key={key} variant="secondary" className="text-xs">
                                    {key}: {value.join(", ")}
                                  </Badge>
                                )
                              }
                              return null
                            })}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Last edited: {new Date(page.lastEditedTime).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(page.url, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {data.hasMore && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Showing first {data.totalPages} pages. Visit Notion to see more.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )

  return (
    <DashboardSection
      title="Notion Database"
      description="Track tasks and project information from Notion"
      icon="📝"
      keyMetrics={keyMetrics}
      detailedContent={detailedContent}
    />
  )
}
