"use client"

import { useState, useEffect } from "react"
import {
  Package,
  Plane,
  MapPin,
  DollarSign,
  Plus,
  Eye,
  CreditCard,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PreAlertModal } from "@/components/modals/pre-alert-modal"

interface ClientDashboardProps {
  onViewTracking: (trackingId: string) => void
}

interface Paquete {
  id: number
  trackingNumber: string
  descripcion: string
  pesoLibras: number
  estado: string
  userId: string
}

const summaryCards = [
  {
    title: "Paquetes en Miami",
    value: "4",
    description: "Esperando consolidación",
    icon: Package,
    color: "bg-primary",
  },
  {
    title: "En Camino",
    value: "2",
    description: "En tránsito a Ecuador",
    icon: Plane,
    color: "bg-accent",
  },
  {
    title: "Listos para Retiro",
    value: "3",
    description: "En centro de distribución",
    icon: MapPin,
    color: "bg-success",
  },
  {
    title: "Deuda / Por Pagar",
    value: "$127.50",
    description: "Pago pendiente",
    icon: DollarSign,
    color: "bg-warning",
  },
]

const nationalShipments = [
  {
    id: "NAT-2024-005678",
    description: "Documentos - Quito",
    weight: "0.3 kg",
    status: "Entregado",
    statusColor: "bg-success",
  },
  {
    id: "NAT-2024-005679",
    description: "Paquete - Guayaquil",
    weight: "2.1 kg",
    status: "En Tránsito",
    statusColor: "bg-accent",
  },
  {
    id: "NAT-2024-005680",
    description: "Frágil - Cuenca",
    weight: "4.5 kg",
    status: "Procesando",
    statusColor: "bg-primary",
  },
]

// Función auxiliar para darle color según el estado
const getStatusColor = (estado: string) => {
  if (estado === "PRE_ALERTADO") return "bg-slate-500"
  if (estado === "EN_MIAMI") return "bg-blue-500"
  if (estado === "ADUANA") return "bg-yellow-500"
  if (estado === "ENTREGADO") return "bg-green-500"
  return "bg-gray-500"
}

export function ClientDashboard({ onViewTracking }: ClientDashboardProps) {
  const [isPreAlertOpen, setIsPreAlertOpen] = useState(false)
  const [paquetes, setPaquetes] = useState<Paquete[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPaquetes = async () => {
      setLoading(true)
      setError(null)

      try {
        const userId = localStorage.getItem("userId")

        if (!userId) {
          // Redirect to login if no user is found
          window.location.href = "/"
          return
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL
        if (!apiUrl) {
          throw new Error("NEXT_PUBLIC_API_URL no está configurada")
        }

        const url = `${apiUrl}/api/paquetes?userId=${userId}`
        console.log("Conectando a:", url)

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log("Datos recibidos del Backend:", data)

        // Filter data to ensure only the logged-in user's packages are displayed
        const filteredData = Array.isArray(data)
          ? data.filter((pkg) => pkg.userId === userId)
          : []

        console.log("Datos filtrados para el usuario:", filteredData)
        setPaquetes(filteredData)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error desconocido"
        console.error("Error conectando al Backend:", errorMessage)
        setError(errorMessage)
        setPaquetes([])
      } finally {
        setLoading(false)
      }
    }

    fetchPaquetes()
  }, [])

  if (loading) {
    return <div>Cargando panel...</div>
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center justify-center py-10">
            <div className="text-center">
              <p className="font-medium text-red-800">Error al conectar</p>
              <p className="text-sm text-red-600">{error}</p>
              <p className="mt-2 text-xs text-red-500">
                Verifica que NEXT_PUBLIC_API_URL esté configurada correctamente
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.color}`}
              >
                <card.icon className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pre-Alert Button */}
      <div className="flex justify-end">
        <Button onClick={() => setIsPreAlertOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Pre-alertar Paquete
        </Button>
      </div>

      {/* Tabs for Imports vs National */}
      <Tabs defaultValue="imports" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="imports">Mis Importaciones</TabsTrigger>
          <TabsTrigger value="national">Mis Envíos Nacionales</TabsTrigger>
        </TabsList>

        <TabsContent value="imports">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Importaciones Internacionales</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número de Guía</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paquetes && paquetes.length > 0 ? (
                    paquetes.map((pkg: Paquete) => (
                      <TableRow key={pkg.id}>
                        {/* Columna 1: Número de Guía (Tracking) */}
                        <TableCell className="font-mono text-sm">
                          {pkg.trackingNumber}
                        </TableCell>

                        {/* Columna 2: Descripción */}
                        <TableCell>{pkg.descripcion}</TableCell>

                        {/* Columna 3: Peso (Le agregamos 'lb' para que se vea pro) */}
                        <TableCell>{pkg.pesoLibras} lb</TableCell>

                        {/* Columna 4: Estado con color dinámico */}
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`${getStatusColor(pkg.estado)} text-white`}
                          >
                            {pkg.estado}
                          </Badge>
                        </TableCell>

                        {/* Columna 5: Botones */}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewTracking(pkg.trackingNumber)}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              Rastrear
                            </Button>
                            
                            {/* Solo mostramos botón Pagar si ya pasó aduana */}
                            {pkg.estado === "ADUANA" && (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                <CreditCard className="mr-1 h-3 w-3" />
                                Pagar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        No hay paquetes disponibles
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="national">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Envíos Nacionales</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número de Guía</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nationalShipments.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-mono text-sm">
                        {pkg.id}
                      </TableCell>
                      <TableCell>{pkg.description}</TableCell>
                      <TableCell>{pkg.weight}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`${pkg.statusColor} text-white`}
                        >
                          {pkg.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewTracking(pkg.id)}
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          Rastrear
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pre-Alert Modal */}
      <PreAlertModal open={isPreAlertOpen} onOpenChange={setIsPreAlertOpen} />
    </div>
  )
}
