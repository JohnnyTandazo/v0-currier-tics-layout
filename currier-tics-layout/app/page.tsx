"use client"

import { useState, useEffect } from "react"
import { LandingPage } from "@/components/landing-page"
import { AppSidebar } from "@/components/app-sidebar"
import { ClientDashboard } from "@/components/dashboards/client-dashboard"
import { OperatorDashboard } from "@/components/dashboards/operator-dashboard"
import { TrackingTimeline } from "@/components/dashboards/tracking-timeline"
import { MisEnvios } from "@/components/dashboards/mis-envios"
import { Facturas } from "@/components/dashboards/facturas"
import { Pagos } from "@/components/dashboards/pagos"
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
export type ClientView = "dashboard" | "envios" | "facturas" | "pagos"

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentRole, setCurrentRole] = useState<UserRole>("client")
  const [currentClientView, setCurrentClientView] = useState<ClientView>("dashboard")
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
    setCurrentClientView("dashboard")
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

  const handleClientViewChange = (view: ClientView) => {
    setCurrentClientView(view)
    if (currentRole !== "client") {
      setCurrentRole("client")
    }
  }

  const roleLabels: Record<UserRole, string> = {
    client: "Panel del Cliente",
    operator: "Operador / Bodega",
    tracking: "Seguimiento de Envío",
  }

  const clientViewLabels: Record<ClientView, string> = {
    dashboard: "Panel Principal",
    envios: "Mis Envíos",
    facturas: "Facturas",
    pagos: "Pagos",
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
        currentClientView={currentClientView}
        onRoleChange={setCurrentRole}
        onClientViewChange={handleClientViewChange}
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
                  {currentRole === "client" 
                    ? clientViewLabels[currentClientView] 
                    : roleLabels[currentRole]}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {currentRole === "client" && currentClientView === "dashboard" && (
            <ClientDashboard onViewTracking={handleViewTracking} />
          )}
          {currentRole === "client" && currentClientView === "envios" && (
            <MisEnvios onViewDetails={handleViewTracking} />
          )}
          {currentRole === "client" && currentClientView === "facturas" && (
            <Facturas />
          )}
          {currentRole === "client" && currentClientView === "pagos" && (
            <Pagos />
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
