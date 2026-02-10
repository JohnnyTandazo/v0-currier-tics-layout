"use client"

import { useEffect, useState } from "react"
import { Bell, Truck, Check, AlertCircle, Eye, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { withAuthHeaders } from "@/lib/authHeaders" // Importante: Asegúrate de tener este archivo

// Interfaces para datos de facturas y pagos
interface FacturaData {
  id: number;
  monto: number;
  estado: string;
}
interface PagoData {
  id: number;
  monto: number;
  estado: string;
  fecha: string;
}

interface Notificacion {
  id: number
  title: string
  message: string
  type: "success" | "warning" | "info" | "error"
  timestamp: string
  read: boolean
  usuarioId?: number
  usuario?: { id: number }
}

interface Usuario {
  id: number
  nombre: string
}

const getTypeColor = (type: string) => {
  switch (type) {
    case "success": return "bg-green-500/20 border-green-500/30"
    case "warning": return "bg-yellow-500/20 border-yellow-500/30"
    case "error": return "bg-red-500/20 border-red-500/30"
    case "info": return "bg-blue-500/20 border-blue-500/30"
    default: return "bg-gray-500/20 border-gray-500/30"
  }
}

const getTypeBadgeColor = (type: string) => {
  switch (type) {
    case "success": return "bg-green-500/20 text-green-700"
    case "warning": return "bg-yellow-500/20 text-yellow-700"
    case "error": return "bg-red-500/20 text-red-700"
    case "info": return "bg-blue-500/20 text-blue-700"
    default: return "bg-gray-500/20 text-gray-700"
  }
}

const getIcon = (type: string) => {
  switch (type) {
    case "success": return <Check className="h-5 w-5 text-green-500" />
    case "warning": return <AlertCircle className="h-5 w-5 text-yellow-500" />
    case "error": return <AlertCircle className="h-5 w-5 text-red-500" />
    case "info": return <Truck className="h-5 w-5 text-blue-500" />
    default: return <Bell className="h-5 w-5 text-gray-500" />
  }
}

export function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [loading, setLoading] = useState(true)
  const [usuario, setUsuario] = useState<Usuario | null>(null)

  // Obtener usuario del localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("usuario")
      if (stored) {
        const parsed = JSON.parse(stored)
        setUsuario(parsed)
      } else {
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
  }, [])

  // Lógica sintética de notificaciones basada en facturas y pagos
  useEffect(() => {
    const cargarNotificaciones = async () => {
      // 1. Validar usuario e ID limpio
      if (!usuario || !usuario.id) {
        setLoading(false)
        return
      }
      
      // LIMPIEZA CLAVE: Quitamos basura del ID (ej: "16:email...")
      const idLimpio = String(usuario.id).split(":")[0].trim()
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-tesis-spring-production.up.railway.app"

      try {
        // 2. Fetch en paralelo usando withAuthHeaders (que sabemos que funciona)
        const [facturasRes, pagosRes] = await Promise.all([
          fetch(`${apiUrl}/api/facturas/usuario/${idLimpio}`, { 
            headers: withAuthHeaders({ "Content-Type": "application/json" }) 
          }),
          fetch(`${apiUrl}/api/pagos`, { 
            headers: withAuthHeaders({ "Content-Type": "application/json" }) 
          })
        ])

        let tempNotificaciones: Notificacion[] = []
        let notifId = 1

        // 3. Procesar Facturas
        if (facturasRes.ok) {
          const facturas: FacturaData[] = await facturasRes.json()
          if (Array.isArray(facturas)) {
             facturas.forEach((factura) => {
              if (["PENDIENTE", "POR_PAGAR"].includes(factura.estado?.toUpperCase())) {
                tempNotificaciones.push({
                  id: notifId++,
                  title: "Factura Pendiente",
                  message: `Tienes una factura de $${factura.monto.toFixed(2)} sin pagar.`,
                  type: "warning",
                  timestamp: "Acción requerida",
                  read: false,
                  usuarioId: usuario.id,
                })
              }
            })
          }
        }

        // 4. Procesar Pagos
        if (pagosRes.ok) {
          const pagos: PagoData[] = await pagosRes.json()
          if (Array.isArray(pagos)) {
             // Tomar solo los últimos 5 para no llenar la pantalla
             pagos.slice(0, 5).forEach((pago) => {
              const estado = pago.estado?.toUpperCase()
              if (["VERIFICADO", "APROBADO"].includes(estado)) {
                tempNotificaciones.push({
                  id: notifId++,
                  title: "Pago Aprobado",
                  message: `Tu pago de $${pago.monto.toFixed(2)} ha sido validado.`,
                  type: "success",
                  timestamp: pago.fecha ? new Date(pago.fecha).toLocaleDateString() : "Reciente",
                  read: true, // Si está aprobado, sale como leído (opcional)
                  usuarioId: usuario.id,
                })
              } else if (estado === "RECHAZADO") {
                tempNotificaciones.push({
                  id: notifId++,
                  title: "Pago Rechazado",
                  message: `Tu pago de $${pago.monto.toFixed(2)} fue rechazado.`,
                  type: "error",
                  timestamp: pago.fecha ? new Date(pago.fecha).toLocaleDateString() : "Reciente",
                  read: false,
                  usuarioId: usuario.id,
                })
              } else if (estado === "PENDIENTE") {
                tempNotificaciones.push({
                  id: notifId++,
                  title: "Pago en Revisión",
                  message: `Verificando pago de $${pago.monto.toFixed(2)}...`,
                  type: "info",
                  timestamp: pago.fecha ? new Date(pago.fecha).toLocaleDateString() : "Reciente",
                  read: false,
                  usuarioId: usuario.id,
                })
              }
            })
          }
        }

        // 5. Ordenar: warning (deudas) primero
        tempNotificaciones.sort((a, b) => {
          if (a.type === "warning" && b.type !== "warning") return -1
          if (a.type !== "warning" && b.type === "warning") return 1
          return 0
        })

        setNotificaciones(tempNotificaciones)

      } catch (err) {
        console.error("Error cargando notificaciones", err)
        setNotificaciones([])
      } finally {
        setLoading(false)
      }
    }

    cargarNotificaciones()
  }, [usuario])

  // Handlers visuales (no afectan BD)
  const handleMarcarLeida = (id: number) => {
    setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const handleMarcarTodasLeidas = () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleEliminar = (id: number) => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id))
  }

  const unreadCount = notificaciones.filter((n) => !n.read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando notificaciones...</p>
        </div>
      </div>
    )
  }

  if (!usuario) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Sesión requerida</h2>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarcarTodasLeidas}>
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Lista de notificaciones */}
      {notificaciones.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">Sin notificaciones</h3>
            <p className="text-sm text-muted-foreground text-center mt-2">
              No tienes notificaciones nuevas en este momento
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notificaciones.map((notif) => (
            <Card
              key={notif.id}
              className={`border-l-4 transition-all ${getTypeColor(notif.type)} ${
                !notif.read ? "bg-card/50" : "bg-card"
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">{getIcon(notif.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm md:text-base">{notif.title}</h3>
                          {!notif.read && (
                            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                      </div>
                      <Badge variant="secondary" className={getTypeBadgeColor(notif.type)}>
                        {notif.type}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                      <span className="text-xs text-muted-foreground">{notif.timestamp}</span>
                      <div className="flex gap-2">
                        {!notif.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => handleMarcarLeida(notif.id)}
                          >
                            <Eye className="h-3 w-3 mr-1" /> Marcar como leída
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-red-500 hover:text-red-600"
                          onClick={() => handleEliminar(notif.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> Descartar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}