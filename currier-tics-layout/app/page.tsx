"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import { LandingPage } from "@/components/landing-page"
import { Skeleton } from "@/components/ui/skeleton"

export type UserRole = "client" | "operator" | "tracking"
export type ClientView = "dashboard" | "envios" | "facturas" | "pagos"

// Dynamically import the entire DashboardLayout component
// This ensures SidebarProvider and all sidebar hooks are only loaded when needed
const DashboardLayout = lazy(() =>
  import("@/components/ui/dashboard-layout").then((mod) => ({
    default: mod.DashboardLayout,
  }))
)

function DashboardSkeleton() {
  return (
    <div className="flex h-screen w-full bg-background">
      <div className="w-64 border-r border-border bg-card p-4">
        <Skeleton className="h-10 w-full mb-6" />
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-8 w-full mb-2" />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b border-border bg-card px-4 flex items-center">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
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
  const [isLoading, setIsLoading] = useState(true)

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
      setIsLoading(false)
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

  // Show loading skeleton while checking auth state
  if (isLoading) {
    return <DashboardSkeleton />
  }

  // Show Landing Page if not logged in
  if (!isLoggedIn) {
    return <LandingPage onLogin={handleLogin} />
  }

  // Show Dashboard if logged in - wrapped in Suspense for lazy loading
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardLayout
        user={user}
        currentRole={currentRole}
        currentClientView={currentClientView}
        onRoleChange={setCurrentRole}
        onClientViewChange={handleClientViewChange}
        onLogout={handleLogout}
        onViewTracking={handleViewTracking}
        onBackFromTracking={handleBackFromTracking}
        selectedTrackingId={selectedTrackingId}
      />
    </Suspense>
  )
}
