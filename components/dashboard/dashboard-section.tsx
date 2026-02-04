"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface DashboardSectionProps {
  title: string
  description: string
  icon: string
  keyMetrics?: React.ReactNode
  detailedContent?: React.ReactNode
  defaultOpen?: boolean
}

export function DashboardSection({
  title,
  description,
  icon,
  keyMetrics,
  detailedContent,
  defaultOpen = false
}: DashboardSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors p-2 sm:p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-base flex-shrink-0">{icon}</span>
                <div className="min-w-0">
                  <CardTitle className="text-sm truncate">{title}</CardTitle>
                  <CardDescription className="text-xs line-clamp-1">{description}</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
            {keyMetrics && (
              <div className="mt-2">
                {keyMetrics}
              </div>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        {detailedContent && (
          <CollapsibleContent>
            <CardContent className="p-2 sm:p-3">
              {detailedContent}
            </CardContent>
          </CollapsibleContent>
        )}
      </Collapsible>
    </Card>
  )
}