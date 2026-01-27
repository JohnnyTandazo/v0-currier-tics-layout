"use client"

import { Bell, Package, Truck, Check, AlertCircle, DollarSign, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface Notificacion {
  id: number
  title: string
  message: string
  icon: React.ReactNode
  type: "success" | "warning" | "info" | "error"
  timestamp: string
  read: boolean
}

const MOCK_NOTIFICACIONES: Notificacion[] = [
  {
    id: 1,
    title: "Paquete Entregado",
    message: "Tu paquete TRK-2024-001234 (Laptop Gamer) ha sido entregado exitosamente.",
    icon: <Check className="h-5 w-5 text-green-500" />,
    type: "success",
    timestamp: "Hace 2 horas",
    read: true,
  },
  {
    id: 2,
    title: "En Aduana",
    message: "Tu paquete TRK-2024-001235 (Zapatos Nike) está en aduana y requiere pago de aranceles.",
    icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    type: "warning",
    timestamp: "Hace 4 horas",
    read: false,
  },
  {
    id: 3,
    title: "En Tránsito",
    message: "Tu paquete TRK-2024-001236 (Monitor 4K) está en tránsito desde Miami.",
    icon: <Truck className="h-5 w-5 text-blue-500" />,
    type: "info",
    timestamp: "Hace 1 día",
    read: false,
  },
  {
    id: 4,
    title: "Pago Procesado",
    message: "Tu pago de $127.50 ha sido procesado correctamente. Referencia: PAG-2024-009876.",
    icon: <DollarSign className="h-5 w-5 text-green-500" />,
    type: "success",
    timestamp: "Hace 2 días",
    read: true,
  },
  {
    id: 5,
    title: "Listo para Retiro",
    message: "Tu paquete TRK-2024-001237 (Auriculares Sony) está listo para retiro en nuestro centro de distribución.",
    icon: <Package className="h-5 w-5 text-purple-500" />,
    type: "info",
    timestamp: "Hace 3 días",
    read: true,
  },
  {
    id: 6,
    title: "Recordatorio de Pago",
    message: "Tienes una factura pendiente de pago. Monto: $85.00. Vencimiento: 5 de febrero.",
    icon: <Clock className="h-5 w-5 text-orange-500" />,
    type: "warning",
    timestamp: "Hace 5 días",
    read: true,
  },
]

const getTypeColor = (type: string) => {
  switch (type) {
    case "success":
      return "bg-green-500/20 border-green-500/30"
    case "warning":
      return "bg-yellow-500/20 border-yellow-500/30"
    case "error":
      return "bg-red-500/20 border-red-500/30"
    case "info":
      return "bg-blue-500/20 border-blue-500/30"
    default:
      return "bg-gray-500/20 border-gray-500/30"
  }
}

const getTypeBadgeColor = (type: string) => {
  switch (type) {
    case "success":
      return "bg-green-500/20 text-green-700"
    case "warning":
      return "bg-yellow-500/20 text-yellow-700"
    case "error":
      return "bg-red-500/20 text-red-700"
    case "info":
      return "bg-blue-500/20 text-blue-700"
    default:
      return "bg-gray-500/20 text-gray-700"
  }
}

export function Notificaciones() {
  const unreadCount = MOCK_NOTIFICACIONES.filter((n) => !n.read).length

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Notificaciones</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount} nuevas
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm">
          Marcar todas como leídas
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Button variant="default" size="sm">
          Todas
        </Button>
        <Button variant="outline" size="sm">
          No leídas
        </Button>
        <Button variant="outline" size="sm">
          Paquetes
        </Button>
        <Button variant="outline" size="sm">
          Pagos
        </Button>
      </div>

      {/* Notificaciones List */}
      <div className="space-y-3">
        {MOCK_NOTIFICACIONES.map((notif) => (
          <Card
            key={notif.id}
            className={`border-l-4 transition-all ${getTypeColor(notif.type)} ${
              !notif.read ? "bg-card/50" : "bg-card"
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">{notif.icon}</div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm md:text-base">
                          {notif.title}
                        </h3>
                        {!notif.read && (
                          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notif.message}
                      </p>
                    </div>
                    <Badge variant="secondary" className={getTypeBadgeColor(notif.type)}>
                      {notif.type}
                    </Badge>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                    <span className="text-xs text-muted-foreground">
                      {notif.timestamp}
                    </span>
                    <div className="flex gap-2">
                      {!notif.read && (
                        <Button variant="ghost" size="sm" className="h-8 text-xs">
                          Marcar como leída
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-8 text-xs">
                        Descartar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State (comentado para que siempre muestre notificaciones) */}
      {/* {MOCK_NOTIFICACIONES.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">
              Sin notificaciones
            </h3>
            <p className="text-sm text-muted-foreground text-center mt-2">
              No tienes notificaciones nuevas en este momento
            </p>
          </CardContent>
        </Card>
      )} */}
    </div>
  )
}
