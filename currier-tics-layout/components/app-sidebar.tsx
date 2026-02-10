"use client"

import { useEffect, useState } from "react"
import {
  Package,
  Warehouse,
  MapPin,
  User,
  Settings,
  Bell,
  ChevronDown,
  Truck,
  Home,
  FileText,
  DollarSign,
  AlertTriangle,
  ClipboardList,
  LogOut,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { withAuthHeaders } from "@/lib/authHeaders"
import type { UserRole, ClientView } from "@/app/page"

interface AppSidebarProps {
  user: any
  currentRole: UserRole
  currentClientView: ClientView
  onRoleChange: (role: UserRole) => void
  onClientViewChange: (view: ClientView) => void
  onLogout: () => void
}

const operatorNavItems = [
  { title: "Panel de Control", icon: Home, badge: null },
  // Anteriormente había: Recepción, Inventario, Incidencias, Despacho
  // Fueron eliminados para mantener la interfaz limpia y enfocada
]

const trackingNavItems = [
  { title: "Rastrear Paquete", icon: MapPin, badge: null },
  { title: "Todos los Envíos", icon: Package, badge: null },
]

export function AppSidebar({ user, currentRole, currentClientView, onRoleChange, onClientViewChange, onLogout }: AppSidebarProps) {
  const [paquetesCount, setPaquetesCount] = useState(0)
  const [enviosCount, setEnviosCount] = useState(0)

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const usuario = JSON.parse(localStorage.getItem("usuario") || "null")
        if (!usuario || !usuario.id) {
          setPaquetesCount(0)
          setEnviosCount(0)
          return
        }

        const cleanId = String(usuario.id).split(":")[0].trim()
        if (!cleanId || isNaN(Number(cleanId)) || Number(cleanId) <= 0) {
          setPaquetesCount(0)
          setEnviosCount(0)
          return
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-tesis-spring-production.up.railway.app"

        const [paquetesResponse, enviosResponse] = await Promise.all([
          fetch(`${apiUrl}/api/paquetes?usuarioId=${cleanId}`, {
            method: "GET",
            headers: withAuthHeaders({ "Content-Type": "application/json" }),
          }),
          fetch(`${apiUrl}/api/envios/usuario/${cleanId}`, {
            method: "GET",
            headers: withAuthHeaders({ "Content-Type": "application/json" }),
          }),
        ])

        if (paquetesResponse.ok) {
          const paquetesData = await paquetesResponse.json().catch(() => [])
          setPaquetesCount(Array.isArray(paquetesData) ? paquetesData.length : 0)
        } else {
          setPaquetesCount(0)
        }

        if (enviosResponse.ok) {
          const enviosData = await enviosResponse.json().catch(() => [])
          setEnviosCount(Array.isArray(enviosData) ? enviosData.length : 0)
        } else {
          setEnviosCount(0)
        }
      } catch (error) {
        console.error("Error cargando contadores del sidebar:", error)
        setPaquetesCount(0)
        setEnviosCount(0)
      }
    }

    fetchCounts()
  }, [user?.id])

  const clientNavItems = [
    { title: "Panel Principal", icon: Home, badge: null },
    { title: "Mis Paquetes", icon: Package, badge: paquetesCount > 0 ? paquetesCount : null },
    { title: "Envíos", icon: Truck, badge: enviosCount > 0 ? enviosCount : null },
    { title: "Pagos", icon: DollarSign, badge: null },
    { title: "Facturas", icon: FileText, badge: null },
  ]

  const getNavItems = () => {
    switch (currentRole) {
      case "client":
        return clientNavItems
      case "operator":
        return operatorNavItems
      case "tracking":
        return trackingNavItems
      default:
        return clientNavItems
    }
  }

  const roleLabels: Record<UserRole, string> = {
    client: "Cliente",
    operator: "Operador",
    tracking: "Seguimiento",
  }

  const handleMenuClick = (itemTitle: string) => {
    if (currentRole === "client") {
      switch (itemTitle) {
        case "Panel Principal":
          onClientViewChange("dashboard")
          break
        case "Mis Paquetes":
          onClientViewChange("paquetes")
          break
        case "Envíos":
          onClientViewChange("envios")
          break
        case "Pagos":
          onClientViewChange("pagos")
          break
        case "Facturas":
          onClientViewChange("facturas")
          break
        case "Notificaciones":
          onClientViewChange("notificaciones")
          break
        case "Configuración":
          onClientViewChange("configuracion")
          break
      }
    }
  }

  const getClientView = (itemTitle: string): ClientView | null => {
    switch (itemTitle) {
      case "Panel Principal":
        return "dashboard"
      case "Mis Paquetes":
        return "paquetes"
      case "Envíos":
        return "envios"
      case "Pagos":
        return "pagos"
      case "Facturas":
        return "facturas"
      case "Notificaciones":
        return "notificaciones"
      case "Configuración":
        return "configuracion"
      default:
        return null
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400">
            <Truck className="h-6 w-6 text-[#1a1a1a]" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight">Currier TICS</span>
            <span className="text-xs text-sidebar-foreground/70">
              Plataforma Logística
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {(user?.role === "OPERADOR" || user?.role === "ADMIN") && (
          <SidebarGroup>
            <SidebarGroupLabel>Selector de Rol</SidebarGroupLabel>
            <SidebarGroupContent>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex w-full items-center justify-between rounded-md bg-sidebar-accent px-3 py-2 text-sm font-medium text-sidebar-accent-foreground transition-colors hover:bg-sidebar-accent/80">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Vista {roleLabels[currentRole]}</span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => onRoleChange("client")}> 
                    <User className="mr-2 h-4 w-4" />
                    Panel del Cliente
                  </DropdownMenuItem>
                  {(user?.role === "OPERADOR" || user?.role === "ADMIN") ? (
                    <DropdownMenuItem onClick={() => onRoleChange("operator")}> 
                      <Warehouse className="mr-2 h-4 w-4" />
                      Operador / Bodega
                    </DropdownMenuItem>
                  ) : null}
                  {/* Opción de seguimiento eliminada completamente */}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarSeparator />

        {currentRole === "tracking" ? (
          <SidebarGroup>
            <SidebarGroupLabel>Detalle del Envío</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="text-muted-foreground text-sm p-4">Visualizando el detalle del envío.</div>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel>Navegación</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {getNavItems().map((item, index) => (
                  // Solo mostrar botones de navegación si no es tracking
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      isActive={currentRole === "client" && currentClientView === getClientView(item.title)}
                      onClick={() => handleMenuClick(item.title)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge !== null && (
                        <Badge
                          variant="secondary"
                          className="ml-auto bg-primary/20 text-primary-foreground text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarSeparator />

        {/* Acciones Rápidas - Solo para cliente, no para operador */}
        {currentRole === "client" && (
          <SidebarGroup>
            <SidebarGroupLabel>Acciones Rápidas</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={currentRole === "client" && currentClientView === "notificaciones"}
                    onClick={() => handleMenuClick("Notificaciones")}
                  >
                    <Bell className="h-4 w-4" />
                    <span>Notificaciones</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={currentRole === "client" && currentClientView === "configuracion"}
                    onClick={() => handleMenuClick("Configuración")}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Configuración</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-3">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-amber-400 text-[#1a1a1a] text-sm font-semibold">
              {user?.nombre?.substring(0, 2).toUpperCase() || "JP"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user?.nombre || "Invitado"}</span>
            <span className="text-xs text-sidebar-foreground/70">
              {user?.email || "sin correo"}
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent bg-transparent"
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
