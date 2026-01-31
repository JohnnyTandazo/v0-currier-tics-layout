import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"

interface Stats {
  miami: number
  enCamino: number
  porPagar: number
  deuda: number
}

export function ClientDashboard() {
  const [usuario, setUsuario] = useState<any>(null)
  const [stats, setStats] = useState<Stats>({ miami: 0, enCamino: 0, porPagar: 0, deuda: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarDatos = async () => {
      const userStored = JSON.parse(localStorage.getItem("usuario") || "null")
      if (!userStored) {
        setLoading(false)
        return // No hacemos fetch si no hay usuario
      }
      setUsuario(userStored)

      try {
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

        const data = await res.json()

        // FILTRO DE PRIVACIDAD OBLIGATORIO
        const misDatos = data.filter(
          (p: any) => String(p.usuarioId || p.usuario?.id) === String(userStored.id)
        )

        // CALCULAR ESTADÍSTICAS SOLO CON MIS DATOS
        setStats({
          miami: misDatos.filter(
            (p: any) => p.estado === "EN_MIAMI" || p.estado === "PRE_ALERTA"
          ).length,
          enCamino: misDatos.filter((p: any) => p.estado === "EN_TRANSITO").length,
          porPagar: misDatos.filter(
            (p: any) => p.estado === "ENTREGADO" || p.estado === "POR_PAGAR"
          ).length,
          deuda: misDatos.reduce((acc: number, p: any) => acc + (p.precio || 0), 0),
        })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [])

  if (loading) {
    return <div>Cargando panel...</div>
  }

  if (!usuario) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="mb-4">Por favor inicia sesión para ver tu panel.</p>
        <Button onClick={() => (window.location.href = "/login")}>Ir al Login</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Paquetes en Miami</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.miami}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>En Camino</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enCamino}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Por Pagar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.porPagar}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Deuda Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.deuda.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
