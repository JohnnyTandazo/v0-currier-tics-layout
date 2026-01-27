"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import { LandingPage } from "@/components/landing-page"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"

export type UserRole = "client" | "operator" | "tracking"
export type ClientView = "dashboard" | "envios" | "facturas" | "pagos"

// Lazy load sidebar-dependent components to avoid useSidebar hook issues
const AppSidebar = lazy(() => import("@/components/app-sidebar").then(mod => ({ default: mod.AppSidebar })))
const ClientDashboard = lazy(() => import("@/components/dashboards/client-dashboard").then(mod => ({ default: mod.ClientDashboard })))
const OperatorDashboard = lazy(() => import("@/components/dashboards/operator-dashboard").then(mod => ({ default: mod.OperatorDashboard })))
const TrackingTimeline = lazy(() => import("@/components/dashboards/tracking-timeline").then(mod => ({ default: mod.TrackingTimeline })))
const MisEnvios = lazy(() => import("@/components/dashboards/mis-envios").then(mod => ({ default: mod.MisEnvios })))
const Facturas = lazy(() => import("@/components/dashboards/facturas").then(mod => ({ default: mod.Facturas })))
const Pagos = lazy(() => import("@/components/dashboards/pagos").then(mod => ({ default: mod.Pagos })))

// Import sidebar components dynamically  
const SidebarProvider = lazy(() => import("@/components/ui/sidebar").then(mod => ({ default: mod.SidebarProvider })))
const SidebarInset = lazy(() => import("@/components/ui/sidebar").then(mod => ({ default: mod.SidebarInset })))
const SidebarTrigger = lazy(() => import("@/components/ui/sidebar").then(mod => ({ default: mod.SidebarTrigger })))

function DashboardSkeleton() {
  return (
    <div className="flex h-screen w-full">
      <div className="w-64 border-r bg-card p-4">
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-8 w-full mb-2" />
      </div>
      <div className="flex-1 p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  )
}

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
    <Suspense fallback={<DashboardSkeleton />}>
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
            <Suspense fallback={<div className="p-4"><Skeleton className="h-64 w-full" /></div>}>
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
            </Suspense>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </Suspense>
  )
}
