"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Search,
  Eye,
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Filter,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface Envio {
  id: number
  trackingId: string
  fecha: string
  destinatario: string
  direccion: string
  estado: "EN_TRANSITO" | "ENTREGADO" | "RETENIDO" | "PROCESANDO" | "EN_ADUANA"
  peso: number
  descripcion: string
}

interface MisEnviosProps {
  onViewDetails: (trackingId: string) => void
}

export function MisEnvios({ onViewDetails }: MisEnviosProps) {
  const [envios, setEnvios] = useState<Envio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const fetchEnvios = async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (!API_URL) {
        throw new Error("NEXT_PUBLIC_API_URL no está configurada")
      }
      
      const response = await fetch(`${API_URL}/api/envios`)
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setEnvios(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setError(errorMessage)
      // Datos de respaldo para demostración
      setEnvios([
        {
          id: 1,
          trackingId: "TRK-2024-001234",
          fecha: "2024-01-15",
          destinatario: "Juan Pérez",
          direccion: "Av. Principal 123, Quito",
          estado: "EN_TRANSITO",
          peso: 2.5,
          descripcion: "Electrónicos",
        },
        {
          id: 2,
          trackingId: "TRK-2024-001235",
          fecha: "2024-01-14",
          destinatario: "María García",
          direccion: "Calle Secundaria 456, Guayaquil",
          estado: "ENTREGADO",
          peso: 1.2,
          descripcion: "Ropa",
        },
        {
          id: 3,
          trackingId: "TRK-2024-001236",
          fecha: "2024-01-13",
          destinatario: "Carlos López",
          direccion: "Jr. Los Pinos 789, Cuenca",
          estado: "RETENIDO",
          peso: 5.0,
          descripcion: "Documentos",
        },
        {
          id: 4,
          trackingId: "TRK-2024-001237",
          fecha: "2024-01-12",
          destinatario: "Ana Martínez",
          direccion: "Av. Central 321, Quito",
          estado: "EN_ADUANA",
          peso: 3.8,
          descripcion: "Accesorios",
        },
        {
          id: 5,
          trackingId: "TRK-2024-001238",
          fecha: "2024-01-11",
          destinatario: "Pedro Sánchez",
          direccion: "Calle Norte 654, Manta",
          estado: "PROCESANDO",
          peso: 0.8,
          descripcion: "Libros",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEnvios()
  }, [])

  const getStatusConfig = (estado: string) => {
    const configs: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      EN_TRANSITO: {
        color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        icon: <Truck className="h-3 w-3" />,
        label: "En Tránsito",
      },
      ENTREGADO: {
        color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        icon: <CheckCircle className="h-3 w-3" />,
        label: "Entregado",
      },
      RETENIDO: {
        color: "bg-red-500/20 text-red-400 border-red-500/30",
        icon: <AlertTriangle className="h-3 w-3" />,
        label: "Retenido",
      },
      EN_ADUANA: {
        color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        icon: <Package className="h-3 w-3" />,
        label: "En Aduana",
      },
      PROCESANDO: {
        color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
        icon: <RefreshCw className="h-3 w-3" />,
        label: "Procesando",
      },
    }
    return configs[estado] || configs.PROCESANDO
  }

  const filteredEnvios = useMemo(() => {
    return envios.filter((envio) => {
      const matchesSearch =
        envio.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        envio.destinatario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        envio.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || envio.estado === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [envios, searchTerm, statusFilter])

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-10 w-64" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-500/30 bg-red-950/20">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
            <p className="font-medium text-red-400">Error al cargar los envíos</p>
            <p className="text-sm text-red-400/70 mt-1">{error}</p>
            <Button
              variant="outline"
              className="mt-4 border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={fetchEnvios}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                <Truck className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{envios.filter(e => e.estado === "EN_TRANSITO").length}</p>
                <p className="text-xs text-muted-foreground">En Tránsito</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{envios.filter(e => e.estado === "ENTREGADO").length}</p>
                <p className="text-xs text-muted-foreground">Entregados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                <Package className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{envios.filter(e => e.estado === "EN_ADUANA").length}</p>
                <p className="text-xs text-muted-foreground">En Aduana</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{envios.filter(e => e.estado === "RETENIDO").length}</p>
                <p className="text-xs text-muted-foreground">Retenidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-border/50 bg-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-semibold">Mis Envíos</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID, destinatario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-64 bg-background/50 border-border/50"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-background/50 border-border/50">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="EN_TRANSITO">En Tránsito</SelectItem>
                  <SelectItem value="ENTREGADO">Entregado</SelectItem>
                  <SelectItem value="RETENIDO">Retenido</SelectItem>
                  <SelectItem value="EN_ADUANA">En Aduana</SelectItem>
                  <SelectItem value="PROCESANDO">Procesando</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchEnvios}
                className="border-border/50"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground">ID Rastreo</TableHead>
                <TableHead className="text-muted-foreground">Fecha</TableHead>
                <TableHead className="text-muted-foreground">Destinatario</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Descripción</TableHead>
                <TableHead className="text-muted-foreground">Estado</TableHead>
                <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnvios.length > 0 ? (
                filteredEnvios.map((envio) => {
                  const statusConfig = getStatusConfig(envio.estado)
                  return (
                    <TableRow key={envio.id} className="border-border/50">
                      <TableCell className="font-mono text-sm text-foreground">
                        {envio.trackingId}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(envio.fecha).toLocaleDateString("es-EC", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{envio.destinatario}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {envio.direccion}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {envio.descripcion}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`gap-1.5 ${statusConfig.color}`}
                        >
                          {statusConfig.icon}
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewDetails(envio.trackingId)}
                          className="border-border/50 hover:bg-accent/50"
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Ver Detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    <Package className="mx-auto h-10 w-10 mb-3 opacity-50" />
                    <p>No se encontraron envíos</p>
                    <p className="text-sm">Intenta con otros términos de búsqueda</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
