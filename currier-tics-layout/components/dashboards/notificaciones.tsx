"use client"

import { useEffect, useState } from "react"
import { Bell, Truck, Check, AlertCircle, Eye, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { withAuthHeaders } from "@/lib/authHeaders"

// Interfaces
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
    case "success": return "bg-green-500/10 border-green-500/30"
    case "warning": return "bg-amber-500/10 border-amber-500/30"
    case "error": return "bg-red-500/10 border-red-500/30"
    case "info": return "bg-blue-500/10 border-blue-500/30"
    default: return "bg-gray-500/10 border-gray-500/30"
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
    case "success": return <Check className="h-5 w-5 text-green-600" />
    case "warning": return <AlertCircle className="h-5 w-5 text-amber-600" />
    case "error": return <AlertCircle className="h-5 w-5 text-red-600" />
    case "info": return <Truck className="h-5 w-5 text-blue-600" />
    default: return <Bell className="h-5 w-5 text-gray-600" />
  }
}

export function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [loading, setLoading] = useState(true)
  const [usuario, setUsuario] = useState<Usuario | null>(null)

  // 1. Obtener usuario
  useEffect(() => {
    try {
      const stored = localStorage.getItem("usuario")
      if (stored) {
        setUsuario(JSON.parse(stored))
      } else {
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
  }, [])

  // 2. Fetch Inteligente + Filtro de "Descartadas"
  useEffect(() => {
    const cargarNotificaciones = async () => {
      if (!usuario || !usuario.id) {
        setLoading(false)
        return
      }
      
      const idLimpio = String(usuario.id).split(":")[0].trim()
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-tesis-spring-production.up.railway.app"

      try {
        const [facturasRes, pagosRes] = await Promise.all([
          fetch(`${apiUrl}/api/facturas/usuario/${idLimpio}`, { 
            headers: withAuthHeaders({ "Content-Type": "application/json" }) 
          }),
          fetch(`${apiUrl}/api/pagos`, { 
            headers: withAuthHeaders({ "Content-Type": "application/json" }) 
          })
        ])

        let tempNotificaciones: Notificacion[] = []
        
        // Usamos IDs predecibles:
        // Facturas: 10000 + ID
        // Pagos: 20000 + ID
        
        // 3. Procesar Facturas
        if (facturasRes.ok) {
          const facturas: FacturaData[] = await facturasRes.json()
          if (Array.isArray(facturas)) {
             facturas.forEach((factura) => {
              if (["PENDIENTE", "POR_PAGAR"].includes(factura.estado?.toUpperCase())) {
                tempNotificaciones.push({
                  id: 10000 + factura.id,
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
             pagos.slice(0, 5).forEach((pago) => {
              const estado = pago.estado?.toUpperCase()
              const idNotif = 20000 + pago.id
              const fechaStr = pago.fecha ? new Date(pago.fecha).toLocaleDateString() : "Reciente"

              if (["VERIFICADO", "APROBADO"].includes(estado)) {
                tempNotificaciones.push({
                  id: idNotif,
                  title: "Pago Aprobado",
                  message: `Tu pago de $${pago.monto.toFixed(2)} ha sido validado.`,
                  type: "success",
                  timestamp: fechaStr,
                  read: true, 
                  usuarioId: usuario.id,
                })
              } else if (estado === "RECHAZADO") {
                tempNotificaciones.push({
                  id: idNotif,
                  title: "Pago Rechazado",
                  message: `Tu pago de $${pago.monto.toFixed(2)} fue rechazado.`,
                  type: "error",
                  timestamp: fechaStr,
                  read: false,
                  usuarioId: usuario.id,
                })
              } else if (estado === "PENDIENTE") {
                tempNotificaciones.push({
                  id: idNotif,
                  title: "Pago en Revisión",
                  message: `Verificando pago de $${pago.monto.toFixed(2)}...`,
                  type: "info",
                  timestamp: fechaStr,
                  read: false,
                  usuarioId: usuario.id,
                })
              }
            })
          }
        }

        // 5. FILTRO MÁGICO: Quitar las que están en la lista negra del LocalStorage
        const storedDismissed = localStorage.getItem("dismissedNotifications")
        const dismissedIds = storedDismissed ? JSON.parse(storedDismissed) : []
        
        // Filtramos solo las que NO están en la lista de descartadas
        const notificacionesFinales = tempNotificaciones.filter(n => !dismissedIds.includes(n.id))

        // 6. Ordenar
        notificacionesFinales.sort((a, b) => {
          if (a.type === "warning" && b.type !== "warning") return -1
          if (a.type !== "warning" && b.type === "warning") return 1
          return 0
        })

        setNotificaciones(notificacionesFinales)

      } catch (err) {
        console.error("Error cargando notificaciones", err)
        setNotificaciones([])
      } finally {
        setLoading(false)
      }
    }

    cargarNotificaciones()
  }, [usuario])

  // --- HANDLERS ---

  // Ahora Descartar guarda en LocalStorage para siempre
  const handleEliminar = (id: number) => {
    // 1. Quitar de la vista visualmente
    setNotificaciones((prev) => prev.filter((n) => n.id !== id))
    
    // 2. Guardar ID en la lista negra del navegador
    const storedDismissed = localStorage.getItem("dismissedNotifications")
    const dismissedIds = storedDismissed ? JSON.parse(storedDismissed) : []
    
    if (!dismissedIds.includes(id)) {
        dismissedIds.push(id)
        localStorage.setItem("dismissedNotifications", JSON.stringify(dismissedIds))
    }
  }

  const handleMarcarLeida = (id: number) => {
    setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const handleMarcarTodasLeidas = () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const unreadCount = notificaciones.filter((n) => !n.read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando notificaciones...</p>
      </div>
    )
  }

  if (!usuario) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-800">Sesión requerida</h2>
        </div>
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
        <Card className="border-dashed bg-gray-50/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="bg-gray-100 p-3 rounded-full mb-3">
                <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600">Estás al día</h3>
            <p className="text-sm text-gray-500 text-center mt-1">
              No tienes notificaciones pendientes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notificaciones.map((notif) => (
            <Card
              key={notif.id}
              className={`border-l-4 transition-all hover:shadow-md ${getTypeColor(notif.type)} ${
                !notif.read ? "bg-white shadow-sm" : "bg-gray-50 opacity-90"
              }`}
            >
              <CardContent className="pt-5 pb-5 px-5">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">{getIcon(notif.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold text-sm md:text-base ${notif.read ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notif.title}
                          </h3>
                          {!notif.read && (
                            <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{notif.message}</p>
                      </div>
                      <Badge variant="secondary" className={`whitespace-nowrap ${getTypeBadgeColor(notif.type)}`}>
                        {notif.timestamp}
                      </Badge>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="flex items-center justify-end mt-3 gap-3 border-t border-gray-100 pt-3">
                        {!notif.read && (
                          <button
                            onClick={() => handleMarcarLeida(notif.id)}
                            className="flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> Marcar leída
                          </button>
                        )}
                        <button
                          onClick={() => handleEliminar(notif.id)}
                          className="flex items-center text-xs font-medium text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Descartar
                        </button>
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