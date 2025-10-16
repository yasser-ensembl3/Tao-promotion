"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DashboardSection } from "./dashboard-section"

interface Milestone {
  id: string
  title: string
  dueDate: string
  status: string
}

export function OverviewSection() {
  const [description, setDescription] = useState("")
  const [vision, setVision] = useState("")
  const [milestones, setMilestones] = useState<Milestone[]>([])

  const [editingDescription, setEditingDescription] = useState(false)
  const [editingVision, setEditingVision] = useState(false)
  const [tempDescription, setTempDescription] = useState("")
  const [tempVision, setTempVision] = useState("")

  const handleEditDescription = () => {
    setTempDescription(description)
    setEditingDescription(true)
  }

  const handleSaveDescription = () => {
    setDescription(tempDescription)
    setEditingDescription(false)
  }

  const handleEditVision = () => {
    setTempVision(vision)
    setEditingVision(true)
  }

  const handleSaveVision = () => {
    setVision(tempVision)
    setEditingVision(false)
  }

  const handleAddMilestone = () => {
    const title = prompt("Enter milestone title:")
    if (!title) return

    const dueDate = prompt("Enter due date (YYYY-MM-DD):")
    if (!dueDate) return

    const newMilestone: Milestone = {
      id: Date.now().toString(),
      title,
      dueDate,
      status: "upcoming"
    }

    setMilestones([...milestones, newMilestone])
  }

  const detailedContent = (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Project Description</h4>
          {!editingDescription ? (
            <Button size="sm" variant="outline" onClick={handleEditDescription}>
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditingDescription(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveDescription}>
                Save
              </Button>
            </div>
          )}
        </div>
        <div className="p-4 border rounded-lg">
          {editingDescription ? (
            <textarea
              className="w-full min-h-[100px] bg-transparent text-sm resize-none focus:outline-none"
              value={tempDescription}
              onChange={(e) => setTempDescription(e.target.value)}
              placeholder="Enter project description..."
              autoFocus
            />
          ) : description ? (
            <p className="text-sm">{description}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No project description available. Add a description to help team members understand the project goals and context.
            </p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Vision</h4>
          {!editingVision ? (
            <Button size="sm" variant="outline" onClick={handleEditVision}>
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditingVision(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveVision}>
                Save
              </Button>
            </div>
          )}
        </div>
        <div className="p-4 border rounded-lg">
          {editingVision ? (
            <textarea
              className="w-full min-h-[100px] bg-transparent text-sm resize-none focus:outline-none"
              value={tempVision}
              onChange={(e) => setTempVision(e.target.value)}
              placeholder="Enter project vision..."
              autoFocus
            />
          ) : vision ? (
            <p className="text-sm">{vision}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No vision statement defined. Define your project vision to align team efforts toward common objectives.
            </p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Milestones</h4>
          <Button size="sm" onClick={handleAddMilestone}>Add Milestone</Button>
        </div>
        {milestones.length === 0 ? (
          <div className="p-8 border rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              No milestones created yet. Milestones help track major project achievements and deadlines.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Click "Add Milestone" to create your first project milestone.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {milestones.map((milestone) => (
              <Card key={milestone.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">{milestone.title}</h5>
                      <p className="text-xs text-muted-foreground">
                        Due: {new Date(milestone.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">{milestone.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <DashboardSection
      title="Overview"
      description="High-level summary of your project status and activity"
      icon="📊"
      detailedContent={detailedContent}
      defaultOpen={true}
    />
  )
}
