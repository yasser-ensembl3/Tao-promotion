"use client"

import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProjectSettingsDialog } from "@/components/settings/project-settings-dialog"

export function DashboardHeader() {
  const { data: session } = useSession()

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">MiniVault Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {session?.user?.name || "User"}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Connected: {session?.provider === "google" ? "Google" : "GitHub"}
            </div>
            <ProjectSettingsDialog />
            <Button onClick={() => signOut()} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}