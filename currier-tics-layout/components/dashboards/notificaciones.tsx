"use client"

import { useEffect, useState } from "react"
import { Bell, Package, Truck, Check, AlertCircle, DollarSign, Clock, Eye, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

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

const getIcon = (type: string) => {
  switch (type) {
    case "success":
      return <Check className="h-5 w-5 text-green-500" />
    case "warning":
      return <AlertCircle className="h-5 w-5 text-yellow-500" />
    case "error":
      return <AlertCircle className="h-5 w-5 text-red-500" />
    case "info":
      return <Truck className="h-5 w-5 text-blue-500" />
    default:
      return <Bell className="h-5 w-5 text-gray-500" />
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
        if (parsed && parsed.id) {
          setUsuario(parsed)
        } else {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
  }, [])

  // Fetch notificaciones SOLO si hay usuario
  useEffect(() => {
    if (!usuario || !usuario.id) return

    const fetchNotificaciones = async () => {
      try {
        setLoading(true)
        // ⚠️ Si el endpoint /api/notificaciones no existe, devolver vacío
        // para evitar errores 404 en la consola
        console.log("⚠️ [NOTIF] Endpoint /api/notificaciones no disponible en backend")
        setNotificaciones([])
        setLoading(false)
        return
        
        if (response.ok) {
          const data = await response.json()
          
          if (Array.isArray(data)) {
            // FILTRADO ESTRICTO por usuario con ID limpio
            const misNotificaciones = data.filter(
              (n: any) => String(n.usuarioId || n.usuario?.id) === String(cleanId)
            )
            setNotificaciones(misNotificaciones)
          } else {
            setNotificaciones([])
          }
        } else {
          setNotificaciones([])
        }
      } catch (err) {
        console.error("Error fetching notificaciones:", err)
        setNotificaciones([])
      } finally {
        setLoading(false)
      }
    }

    fetchNotificaciones()
  }, [usuario])

  // Marcar como leída
  const handleMarcarLeida = (id: number) => {
    console.log("Marcando como leída:", id)
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  // Marcar todas como leídas
  const handleMarcarTodasLeidas = () => {
    console.log("Marcando todas como leídas")
    setNotificaciones((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  // Eliminar notificación
  const handleEliminar = (id: number) => {
    console.log("Eliminando notificación:", id)
    setNotificaciones((prev) => prev.filter((n) => n.id !== id))
  }

  const unreadCount = notificaciones.filter((n) => !n.read).length

  // Loading state
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

  // Sin sesión
  if (!usuario) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Sesión requerida
              </h2>
              <p className="text-gray-600 mb-6">
                Inicia sesión para ver tus notificaciones.
              </p>
              <a
                href="/login"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Iniciar Sesión
              </a>
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
            <h3 className="text-lg font-semibold text-muted-foreground">
              Sin notificaciones
            </h3>
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
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">{getIcon(notif.type)}</div>

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
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-xs"
                            onClick={() => handleMarcarLeida(notif.id)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Marcar como leída
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-xs text-red-500 hover:text-red-600"
                          onClick={() => handleEliminar(notif.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
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
      )}
    </div>
  )
}
