"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronUp } from "lucide-react"

interface PageSectionProps {
  title: string
  description: string
  icon: string
  keyMetrics?: React.ReactNode
  detailedContent?: React.ReactNode
  defaultExpanded?: boolean
  // Props pour contrôle externe de l'expansion
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
}

export function PageSection({
  title,
  description,
  icon,
  keyMetrics,
  detailedContent,
  defaultExpanded = false,
  expanded: controlledExpanded,
  onExpandedChange,
}: PageSectionProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)

  // Utiliser l'état contrôlé si fourni, sinon l'état interne
  const isControlled = controlledExpanded !== undefined
  const expanded = isControlled ? controlledExpanded : internalExpanded

  const setExpanded = (value: boolean) => {
    if (isControlled && onExpandedChange) {
      onExpandedChange(value)
    } else {
      setInternalExpanded(value)
    }
  }

  // Clic sur les cartes = ouvrir les détails (seulement si non contrôlé)
  const handleMetricsClick = () => {
    if (detailedContent && !expanded && !isControlled) {
      setExpanded(true)
    }
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="text-xl sm:text-2xl flex-shrink-0">{icon}</span>
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-xl">{title}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">{description}</CardDescription>
            </div>
          </div>
          {expanded && detailedContent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronUp className="h-4 w-4 mr-1" />
              <span className="text-xs">Collapse</span>
            </Button>
          )}
        </div>
        {keyMetrics && (
          <div
            className={`mt-3 sm:mt-4 ${detailedContent && !expanded && !isControlled ? 'cursor-pointer' : ''}`}
            onClick={handleMetricsClick}
          >
            {keyMetrics}
          </div>
        )}
      </CardHeader>
      {expanded && detailedContent && (
        <CardContent className="p-4 sm:p-6 pt-0 border-t">
          {detailedContent}
        </CardContent>
      )}
    </Card>
  )
}
