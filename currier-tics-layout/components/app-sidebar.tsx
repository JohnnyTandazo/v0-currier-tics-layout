"use client"

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
import type { UserRole, ClientView } from "@/app/page"

interface AppSidebarProps {
  user: any
  currentRole: UserRole
  currentClientView: ClientView
  onRoleChange: (role: UserRole) => void
  onClientViewChange: (view: ClientView) => void
  onLogout: () => void
}

const clientNavItems = [
  { title: "Panel Principal", icon: Home, badge: null },
  { title: "Mis Paquetes", icon: Package, badge: "12" },
  { title: "Envíos", icon: Truck, badge: "3" },
  { title: "Facturas", icon: FileText, badge: null },
  { title: "Pagos", icon: DollarSign, badge: null },
]

const operatorNavItems = [
  { title: "Recepción", icon: Warehouse, badge: null },
  { title: "Inventario", icon: ClipboardList, badge: "47" },
  { title: "Incidencias", icon: AlertTriangle, badge: "2" },
  { title: "Despacho", icon: Truck, badge: null },
]

const trackingNavItems = [
  { title: "Rastrear Paquete", icon: MapPin, badge: null },
  { title: "Todos los Envíos", icon: Package, badge: null },
]

export function AppSidebar({ user, currentRole, currentClientView, onRoleChange, onClientViewChange, onLogout }: AppSidebarProps) {
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
        case "Envíos":
          onClientViewChange("envios")
          break
        case "Facturas":
          onClientViewChange("facturas")
          break
        case "Pagos":
          onClientViewChange("pagos")
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
      case "Envíos":
        return "envios"
      case "Facturas":
        return "facturas"
      case "Pagos":
        return "pagos"
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
                <DropdownMenuItem onClick={() => onRoleChange("operator")}>
                  <Warehouse className="mr-2 h-4 w-4" />
                  Operador / Bodega
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRoleChange("tracking")}>
                  <MapPin className="mr-2 h-4 w-4" />
                  Seguimiento de Envío
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {getNavItems().map((item, index) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    isActive={currentRole === "client" && currentClientView === getClientView(item.title)}
                    onClick={() => handleMenuClick(item.title)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                    {item.badge && (
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

        <SidebarSeparator />

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
                  <Badge
                    variant="destructive"
                    className="ml-auto text-xs"
                  >
                    5
                  </Badge>
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
