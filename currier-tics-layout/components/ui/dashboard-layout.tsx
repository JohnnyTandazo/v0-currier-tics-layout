"use client"

import { Suspense, lazy } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ClientDashboard } from "@/components/dashboards/client-dashboard"
import { OperatorDashboard } from "@/components/dashboards/operator-dashboard"
import { TrackingTimeline } from "@/components/dashboards/tracking-timeline"
import { EnvioTimeline } from "@/components/dashboards/envio-timeline"
import { MisPaquetes } from "@/components/dashboards/mis-paquetes"
import { MisEnvios } from "@/components/dashboards/mis-envios"
import MisDocumentos from "@/components/dashboards/mis-documentos"
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
import type { UserRole } from "@/app/page";

interface DashboardLayoutProps {
  user: any
  currentRole: UserRole
  currentClientView: ClientView
  onRoleChange: (role: UserRole) => void
  onClientViewChange: (view: ClientView) => void
  onLogout: () => void
  onViewTracking: (trackingId: string) => void
  onViewEnvioDetails: (envioId: string) => void
  onBackFromTracking: () => void
  selectedTrackingId: string | null
  trackingMode: "paquetes" | "envios"
}

const roleLabels: Record<UserRole, string> = {
  client: "Panel del Cliente",
  operator: "Operador / Bodega",
  tracking: "Seguimiento",
}

const clientViewLabels: Record<ClientView, string> = {
  dashboard: "Panel Principal",
  envios: "Mis Envios",
  facturas: "Facturas",
  paquetes: "Mis Paquetes",
  pagos: "Pagos",
  notificaciones: "Notificaciones",
  configuracion: "Configuración",
}

export type ClientView = "dashboard" | "envios" | "facturas" | "paquetes" | "pagos" | "notificaciones" | "configuracion";

export default function DashboardLayout({
  user,
  currentRole,
  currentClientView,
  onRoleChange,
  onClientViewChange,
  onLogout,
  onViewTracking,
  onViewEnvioDetails,
  onBackFromTracking,
  selectedTrackingId,
  trackingMode,
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
            <MisEnvios onViewDetails={onViewEnvioDetails} />
          )}
          {currentRole === "client" && currentClientView === "facturas" && (
            <MisDocumentos />
          )}
          {currentRole === "client" && currentClientView === "paquetes" && (
            <MisPaquetes onViewTracking={onViewTracking} />
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
          {currentRole === "operator" && (
            <OperatorDashboard />
          )}
          {currentRole === "tracking" && (
            trackingMode === "envios" ? (
              <EnvioTimeline
                envioId={selectedTrackingId || "1"}
                onBack={onBackFromTracking}
              />
            ) : (
              <TrackingTimeline
                trackingId={selectedTrackingId || "TRK-2024-001234"}
                onBack={onBackFromTracking}
              />
            )
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
