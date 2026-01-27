"use client"

import { useState, useEffect } from "react"
import { LandingPage } from "@/components/landing-page"
import { AppSidebar } from "@/components/app-sidebar"
import { ClientDashboard } from "@/components/dashboards/client-dashboard"
import { OperatorDashboard } from "@/components/dashboards/operator-dashboard"
import { TrackingTimeline } from "@/components/dashboards/tracking-timeline"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"

export type UserRole = "client" | "operator" | "tracking"

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentRole, setCurrentRole] = useState<UserRole>("client")
  const [selectedTrackingId, setSelectedTrackingId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  // Check localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("usuario")
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser)
          setUser(parsedUser)
          setIsLoggedIn(true)
          // Set role based on user rol field if available
          if (parsedUser.rol === "OPERADOR") {
            setCurrentRole("operator")
          } else {
            setCurrentRole("client")
          }
        } catch (error) {
          console.error("Error parsing user from localStorage:", error)
          localStorage.removeItem("usuario")
        }
      }
    }
  }, [])

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentRole("client")
    setUser(null)
    localStorage.removeItem("usuario")
  }

  const handleViewTracking = (trackingId: string) => {
    setSelectedTrackingId(trackingId)
    setCurrentRole("tracking")
  }

  const handleBackFromTracking = () => {
    setCurrentRole("client")
    setSelectedTrackingId(null)
  }

  const roleLabels: Record<UserRole, string> = {
    client: "Panel del Cliente",
    operator: "Operador / Bodega",
    tracking: "Seguimiento de Envío",
  }

  // Show Landing Page if not logged in
  if (!isLoggedIn) {
    return <LandingPage onLogin={handleLogin} />
  }

  // Show Dashboard if logged in
  return (
    <SidebarProvider>
      <AppSidebar 
        user={user}
        currentRole={currentRole} 
        onRoleChange={setCurrentRole}
        onLogout={handleLogout}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-card px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">
                  {roleLabels[currentRole]}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {currentRole === "client" && (
            <ClientDashboard onViewTracking={handleViewTracking} />
          )}
          {currentRole === "operator" && <OperatorDashboard />}
          {currentRole === "tracking" && (
            <TrackingTimeline
              trackingId={selectedTrackingId || "TRK-2024-001234"}
              onBack={handleBackFromTracking}
            />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
