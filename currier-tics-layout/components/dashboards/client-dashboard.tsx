"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Package, Plane, MapPin, DollarSign, Bell, CreditCard, AlertCircle } from "lucide-react"

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
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [stats, setStats] = useState<Stats>({ 
    miami: 0, 
    enCamino: 0, 
    porPagar: 0, 
    deuda: 0,
    totalPaquetes: 0,
    notificaciones: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

        const res = await fetch(`${apiUrl}/api/paquetes`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!res.ok) {
          throw new Error("Error al obtener paquetes")
        }

        const data = await res.json()

        // Verificar que data sea un array
        if (!Array.isArray(data)) {
          setStats({ miami: 0, enCamino: 0, porPagar: 0, deuda: 0, totalPaquetes: 0, notificaciones: 0 })
          return
        }

        // FILTRO DE PRIVACIDAD OBLIGATORIO
        const misDatos = data.filter(
          (p: any) => String(p.usuarioId || p.usuario?.id) === String(userStored.id)
        )

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

    cargarDatos()
  }, [])

  // Estado de carga con spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando panel...</p>
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
      {/* Bienvenida */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Hola, {usuario.nombre}
        </h1>
        <p className="text-gray-600 mt-1">
          Bienvenido a tu panel de control
        </p>
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
    </div>
  )
}
