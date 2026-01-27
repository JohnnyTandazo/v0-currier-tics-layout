"use client"

import { Suspense, lazy } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ClientDashboard } from "@/components/dashboards/client-dashboard"
import { OperatorDashboard } from "@/components/dashboards/operator-dashboard"
import { TrackingTimeline } from "@/components/dashboards/tracking-timeline"
import { MisEnvios } from "@/components/dashboards/mis-envios"
import { Facturas } from "@/components/dashboards/facturas"
import { Pagos } from "@/components/dashboards/pagos"
import { Notificaciones } from "@/components/dashboards/notificaciones"
import { Configuracion } from "@/components/dashboards/configuracion"
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
import { Skeleton } from "@/components/ui/skeleton"
import type { UserRole, ClientView } from "@/app/page"

interface DashboardLayoutProps {
  user: any
  currentRole: UserRole
  currentClientView: ClientView
  onRoleChange: (role: UserRole) => void
  onClientViewChange: (view: ClientView) => void
  onLogout: () => void
  onViewTracking: (trackingId: string) => void
  onBackFromTracking: () => void
  selectedTrackingId: string | null
}

const roleLabels: Record<UserRole, string> = {
  client: "Panel del Cliente",
  operator: "Operador / Bodega",
  tracking: "Seguimiento de Envio",
}

const clientViewLabels: Record<ClientView, string> = {
  dashboard: "Panel Principal",
  envios: "Mis Envios",
  facturas: "Facturas",
  pagos: "Pagos",
  notificaciones: "Notificaciones",
  configuracion: "Configuración",
}

export default function DashboardLayout({
  user,
  currentRole,
  currentClientView,
  onRoleChange,
  onClientViewChange,
  onLogout,
  onViewTracking,
  onBackFromTracking,
  selectedTrackingId,
}: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar
        user={user}
        currentRole={currentRole}
        currentClientView={currentClientView}
        onRoleChange={onRoleChange}
        onClientViewChange={onClientViewChange}
        onLogout={onLogout}
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
            <ClientDashboard onViewTracking={onViewTracking} />
          )}
          {currentRole === "client" && currentClientView === "envios" && (
            <MisEnvios onViewDetails={onViewTracking} />
          )}
          {currentRole === "client" && currentClientView === "facturas" && (
            <Facturas />
          )}
          {currentRole === "client" && currentClientView === "pagos" && (
            <Pagos />
          )}
          {currentRole === "client" && currentClientView === "notificaciones" && (
            <Notificaciones />
          )}
          {currentRole === "client" && currentClientView === "configuracion" && (
            <Configuracion />
          )}
          {currentRole === "operator" && <OperatorDashboard />}
          {currentRole === "tracking" && (
            <TrackingTimeline
              trackingId={selectedTrackingId || "TRK-2024-001234"}
              onBack={onBackFromTracking}
            />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
