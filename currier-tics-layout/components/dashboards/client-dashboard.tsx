"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import { Package, Plane, MapPin, DollarSign, Bell, CreditCard, AlertCircle, Eye, Plus, Loader2 } from "lucide-react"
import { safeFetch } from "@/lib/safeFetch"
import { formatearFecha } from "@/lib/formatDate"
import { PreAlertModal } from "../modals/pre-alert-modal"
import { PaymentModal } from "./payment-modal"

interface Paquete {
  id: number
  trackingNumber?: string
  tracking?: string
  descripcion: string
  estado: string
  usuarioId?: number
  usuario?: { id: number }
  precio?: number
  pagado?: boolean
  fechaCreacion?: string
  createdAt?: string
}

interface Stats {
  miami: number
  enCamino: number
  porPagar: number
  deuda: number
  totalPaquetes: number
  notificaciones: number
}

interface Usuario {
  id: number
  nombre: string
  email: string
}

interface ClientDashboardProps {
  onViewTracking: (trackingId: string) => void
}

export function ClientDashboard({ onViewTracking }: ClientDashboardProps) {
  const router = useRouter()
  const [isPreAlertOpen, setIsPreAlertOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paqueteAPagar, setPaqueteAPagar] = useState<Paquete | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [paquetes, setPaquetes] = useState<Paquete[]>([])
  const [stats, setStats] = useState<Stats>({ 
    miami: 0, 
    enCamino: 0, 
    porPagar: 0, 
    deuda: 0,
    totalPaquetes: 0,
    notificaciones: 0
  })
  const [loading, setLoading] = useState(true)

  // Función para cargar datos
  const cargarDatos = async () => {
    try {
      const userStored = JSON.parse(localStorage.getItem("usuario") || "null")
      if (!userStored || !userStored.id) {
        setLoading(false)
        return
      }
      setUsuario(userStored)

      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) {
        throw new Error("NEXT_PUBLIC_API_URL no está configurada")
      }

      // Usar safeFetch para evitar errores de JSON parsing
      const data = await safeFetch(`${apiUrl}/api/paquetes`)

      // Verificar que data sea un array
      if (!Array.isArray(data)) {
        setStats({ miami: 0, enCamino: 0, porPagar: 0, deuda: 0, totalPaquetes: 0, notificaciones: 0 })
        return
      }

      // FILTRO DE PRIVACIDAD OBLIGATORIO
      const misDatos = data.filter(
        (p: any) => String(p.usuarioId || p.usuario?.id) === String(userStored.id)
      )

      // Guardar los paquetes filtrados para la tabla
      setPaquetes(misDatos)

      // CALCULAR ESTADÍSTICAS SOLO CON MIS DATOS
      setStats({
        totalPaquetes: misDatos.length,
        miami: misDatos.filter(
          (p: any) => p.estado === "EN_MIAMI" || p.estado === "PRE_ALERTA" || p.estado === "PRE_ALERTADO"
        ).length,
        enCamino: misDatos.filter((p: any) => p.estado === "EN_TRANSITO").length,
        porPagar: misDatos.filter(
          (p: any) => p.estado === "ENTREGADO" || p.estado === "POR_PAGAR" || p.estado === "ADUANA"
        ).length,
        deuda: misDatos
          .filter((p: any) => !p.pagado)
          .reduce((acc: number, p: any) => acc + (p.precio || 0), 0),
        notificaciones: 0,
      })
    } catch (e) {
      console.error("Error cargando datos:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  // Función para obtener el badge del estado
  const getEstadoBadge = (estado: string) => {
    const estadoNormalizado = estado?.toUpperCase() || ""
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      EN_MIAMI: { variant: "secondary", label: "En Miami" },
      PRE_ALERTADO: { variant: "outline", label: "Pre-alertado" },
      PRE_ALERTA: { variant: "outline", label: "Pre-alerta" },
      EN_TRANSITO: { variant: "default", label: "En Tránsito" },
      ENTREGADO: { variant: "secondary", label: "Entregado" },
      POR_PAGAR: { variant: "destructive", label: "Por Pagar" },
      ADUANA: { variant: "destructive", label: "En Aduana" },
      PENDIENTE: { variant: "secondary", label: "Pendiente" },
    }

    const { variant, label } = config[estadoNormalizado] || { variant: "outline" as const, label: estado }
    return <Badge variant={variant}>{label}</Badge>
  }

  // Abrir modal de pago
  const handleAbrirModalPago = (paquete: Paquete) => {
    setPaqueteAPagar(paquete)
    setIsPaymentModalOpen(true)
  }

  // Confirmar pago
  const handleConfirmarPago = async () => {
    if (!paqueteAPagar) return

    try {
      setLoading(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) throw new Error("API URL no configurada")

      const response = await fetch(`${apiUrl}/api/paquetes/${paqueteAPagar.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          estado: "PAGADO", 
          pagado: true,
          fechaPago: new Date().toISOString()
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.message || errorData.error || "Error desconocido"
        throw new Error(errorMessage)
      }

      setIsPaymentModalOpen(false)
      setPaqueteAPagar(null)
      alert("✅ Pago procesado correctamente")
      await cargarDatos()
    } catch (error: any) {
      console.error("Error al procesar pago:", error)
      alert(`❌ Error al procesar el pago: ${error.message || "Error de conexión"}`)
    } finally {
      setLoading(false)
    }
  }

  // Función para manejar pago - Redirigir a Facturas
  const handlePagar = (paqueteId: number) => {
    router.push(`/dashboard/facturas?action=pagar&id=${paqueteId}`)
  }

  // Verificar si debe mostrar botón de pagar
  const mostrarBotonPagar = (paquete: Paquete) => {
    const estadoNormalizado = paquete.estado?.toUpperCase() || ""
    return (estadoNormalizado === "POR_PAGAR" || estadoNormalizado === "ENTREGADO" || estadoNormalizado === "ADUANA") && !paquete.pagado
  }

  // Estado de carga con spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Cargando datos...</p>
        </div>
      </div>
    )
  }

  // Sin sesión iniciada
  if (!usuario) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Sesión no iniciada
              </h2>
              <p className="text-gray-600 mb-6">
                Por favor, inicia sesión para ver tu dashboard.
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
    <div className="space-y-6">
      {/* Header con Bienvenida y Botón Pre-Alertar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Hola, {usuario.nombre}
          </h1>
          <p className="text-gray-600 mt-1">
            Bienvenido a tu panel de control
          </p>
        </div>
        
        {/* Botón Pre-Alertar Paquete */}
        <Button
          onClick={() => setIsPreAlertOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          size="lg"
        >
          <Plus className="h-5 w-5" />
          📦 Pre-Alertar Paquete
        </Button>
      </div>

      {/* Tarjetas de estadísticas con diseño profesional */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Total Paquetes */}
        <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Paquetes
            </CardTitle>
            <Package className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalPaquetes}</div>
            <p className="text-xs text-gray-500 mt-1">Registrados</p>
          </CardContent>
        </Card>

        {/* En Miami */}
        <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              En Miami
            </CardTitle>
            <MapPin className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.miami}</div>
            <p className="text-xs text-gray-500 mt-1">Esperando envío</p>
          </CardContent>
        </Card>

        {/* En Tránsito */}
        <Card className="border-l-4 border-l-yellow-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              En Tránsito
            </CardTitle>
            <Plane className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.enCamino}</div>
            <p className="text-xs text-gray-500 mt-1">En camino</p>
          </CardContent>
        </Card>

        {/* Por Pagar */}
        <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Por Pagar
            </CardTitle>
            <CreditCard className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.porPagar}</div>
            <p className="text-xs text-gray-500 mt-1">Pendientes</p>
          </CardContent>
        </Card>

        {/* Deuda Total */}
        <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Deuda Total
            </CardTitle>
            <DollarSign className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">${stats.deuda.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">Pendiente</p>
          </CardContent>
        </Card>

        {/* Notificaciones */}
        <Card className="border-l-4 border-l-orange-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Notificaciones
            </CardTitle>
            <Bell className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.notificaciones}</div>
            <p className="text-xs text-gray-500 mt-1">Sin leer</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Envíos Recientes */}
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Envíos Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paquetes.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No tienes envíos registrados</p>
              <p className="text-gray-400 text-sm mt-1">
                Tus paquetes aparecerán aquí cuando sean registrados
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Tracking</TableHead>
                    <TableHead className="font-semibold">Descripción</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold">Fecha</TableHead>
                    <TableHead className="font-semibold text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paquetes.slice(0, 10).map((paquete) => (
                    <TableRow key={paquete.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm text-blue-600 font-medium">
                        {paquete.trackingNumber || paquete.tracking || "-"}
                      </TableCell>
                      <TableCell className="text-gray-700 max-w-[200px] truncate">
                        {paquete.descripcion || "Sin descripción"}
                      </TableCell>
                      <TableCell>
                        {getEstadoBadge(paquete.estado)}
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {formatearFecha(paquete.fechaCreacion || paquete.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewTracking(paquete.trackingNumber || paquete.tracking || "")}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Rastrear
                          </Button>
                          {mostrarBotonPagar(paquete) && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handlePagar(paquete.id)}
                              className="bg-green-600 hover:bg-green-700"
                              disabled={loading}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Pagar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Pre-Alertar */}
      <PreAlertModal open={isPreAlertOpen} onOpenChange={setIsPreAlertOpen} />

      {/* Modal de Pago */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false)
          setPaqueteAPagar(null)
        }}
        onConfirm={handleConfirmarPago}
        monto={paqueteAPagar?.precio || 0}
        descripcion={`Pago de paquete ${paqueteAPagar?.trackingNumber || paqueteAPagar?.tracking || ""}`}
      />
    </div>
  )
}
