"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Eye,
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  Filter,
  Loader2,
  Plus,
  Plane,
  Building2,
  Palmtree,
  DollarSign
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog"

// Ajusta esta ruta si te da error, pero debería ser la correcta según tu estructura
import { CreateEnvioWizard } from "./create-envio-wizard" 

import { safeFetch } from "@/lib/safeFetch"
import { defensiveFetch, createFallbackEnvio } from "@/lib/defensiveFetch"
import { formatearFecha } from "@/lib/formatDate"
import { useToast } from "@/hooks/use-toast"

// --- INTERFACES ---
interface Envio {
  id: number
  trackingId: string
  fecha: string
  destinatario: string
  destinatarioCiudad?: string
  destinatarioDireccion?: string
  direccion: string
  estado: "EN_TRANSITO" | "ENTREGADO" | "RETENIDO" | "PROCESANDO" | "EN_ADUANA"
  estadoPago?: "PAGADA" | "PENDIENTE" | "VENCIDA" | "ANULADA" | "DESCONOCIDO" | "PAGADO"
  peso: number
  descripcion: string
  usuarioId: number
}

interface EnvioDetalles extends Envio {
  origen?: string
  destino?: string
  contenido?: string
  referencia?: string
  [key: string]: any
}

interface MisEnviosProps {
  onViewDetails?: (envioId: string) => void
}

// --- COMPONENTE PRINCIPAL ---
export function MisEnvios({ onViewDetails }: MisEnviosProps) {
  const [envios, setEnvios] = useState<Envio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [usuario, setUsuario] = useState<any>(null)
  const [loadingDetalles, setLoadingDetalles] = useState(false)
  
  // Estado para el Modal de Nuevo Envío
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  
  const { toast } = useToast()
  const router = useRouter()

  // --- LÓGICA DE DETALLES ---
  const handleVerDetalles = async (envioId: number | undefined) => {
    try {
      setLoadingDetalles(true)
      if (!envioId) {
        alert("Error: ID de envío inválido")
        return
      }
      const url = `/api/envios/${envioId}`
      const { data, error, status } = await defensiveFetch<EnvioDetalles>(
        url,
        {
          method: "GET",
          fallbackData: createFallbackEnvio(envioId),
        }
      )

      if (status === 403) {
        toast({ title: "Acceso denegado", variant: "destructive" })
        return
      }

      if (error || !data) {
        alert(`Error al cargar detalles. ID: ${envioId}`)
        return
      }

      if (onViewDetails) {
        onViewDetails(String(envioId))
        return
      }
      
      alert(`Detalles del envío:\nID: ${envioId}\nEstado: ${data.estado}`)
    } catch (err) {
      console.error(err)
      alert("Error de conexión.")
    } finally {
      setLoadingDetalles(false)
    }
  }

  // --- CARGA DE ENVÍOS ---
  useEffect(() => {
    const fetchEnvios = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const usuarioStored = JSON.parse(localStorage.getItem("usuario") || "null")
        
        if (!usuarioStored || !usuarioStored.id) {
          setUsuario(null)
          setEnvios([])
          setIsLoading(false)
          return
        }

        const getCleanId = (id: any) => String(id).replace(/[^0-9]/g, '')
        const idLimpio = getCleanId(usuarioStored.id)
        
        if (!idLimpio || isNaN(Number(idLimpio))) {
          setUsuario(null)
          return
        }
        
        setUsuario(usuarioStored)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-tesis-spring-production.up.railway.app"
        const url = `${apiUrl}/api/envios/usuario/${idLimpio}`
        const facturasUrl = `${apiUrl}/api/facturas/usuario/${idLimpio}`
        
        const [fetchedData, facturasData] = await Promise.all([safeFetch(url), safeFetch(facturasUrl)])

        if (!Array.isArray(fetchedData)) {
          setEnvios([])
          return
        }

        let data = fetchedData
        const facturasArray = Array.isArray(facturasData) ? facturasData : []
        const facturaMap = new Map<string, string>()
        
        facturasArray.forEach((f: any) => {
          const envioId = f.envioId || f.envio?.id
          if (envioId) {
            const estadoFactura = (f.estado || "PENDIENTE").toUpperCase()
            const estadoNormalizado = estadoFactura === "PAGADO" ? "PAGADA" : estadoFactura
            facturaMap.set(String(envioId), estadoNormalizado)
          }
        })

        const normalizedEnvios = data.map((p: any, index: number) => {
          const finalId = p.id || p.idEnvio || p.paqueteId
          const realTrackingId = p.numeroTracking || p.trackingId || p.numeroGuia
          
          return {
            id: finalId,
            trackingId: realTrackingId || `PKG-${index}`,
            fecha: p.fechaCreacion || p.fecha || new Date().toISOString(),
            destinatario: p.destinatarioNombre || p.destinatario || "SIN-DESTINATARIO",
            destinatarioCiudad: p.destinatarioCiudad || "Sin ciudad",
            destinatarioDireccion: p.destinatarioDireccion || "SIN-DIRECCIÓN",
            direccion: p.destinatarioDireccion || "SIN-DIRECCIÓN",
            estado: p.estado || "PROCESANDO",
            estadoPago: (facturaMap.get(String(finalId)) || "PENDIENTE"),
            peso: p.pesoLibras || p.peso || 0,
            descripcion: p.descripcion || "SIN-DESCRIPCIÓN",
            usuarioId: p.usuario?.id || usuarioStored.id,
          } as Envio
        })

        const misEnvios = normalizedEnvios.filter((p: Envio) => String(p.usuarioId) === String(idLimpio))
        setEnvios(misEnvios)

      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        setEnvios([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchEnvios()
  }, [])

  // --- FILTROS ---
  const filteredEnvios = useMemo(() => {
    if (!Array.isArray(envios)) return []
    return envios.filter((envio) => {
      const trackingId = envio?.trackingId || ""
      const destinatario = envio?.destinatario || ""
      const descripcion = envio?.descripcion || ""
      const estado = envio?.estado || ""
      
      const matchesSearch =
        trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        destinatario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        descripcion.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || estado === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [envios, searchTerm, statusFilter])

  // --- RENDERS DE CARGA Y ERROR ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando envíos...</p>
        </div>
      </div>
    )
  }

  if (!usuario) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sesión requerida</h2>
            <Button onClick={() => router.push('/login')} className="bg-blue-600">Iniciar Sesión</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- RENDER PRINCIPAL ---
  return (
    <div className="space-y-6">
      {/* Tarjetas de Estadísticas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* En Tránsito */}
        <Card>
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
        {/* Entregados */}
        <Card>
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
        {/* En Aduana */}
        <Card>
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
        {/* Retenidos */}
        <Card>
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

      {/* Buscador y Filtros */}
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
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
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
              
              {/* ✅ AQUÍ ESTÁ EL BOTÓN QUE ABRE EL DIALOG */}
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsCreateDialogOpen(true)}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plane className="h-4 w-4" />
                Nuevo Envío
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* Tabla de Resultados */}
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>ID Rastreo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Destinatario</TableHead>
                <TableHead className="hidden md:table-cell">Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnvios.length > 0 ? (
                filteredEnvios.map((envio) => {
                  const statusConfig = getStatusConfig(envio.estado)
                  const pagoStatusConfig = getPagoStatusConfig(envio.estadoPago)
                  return (
                    <TableRow key={envio.id}>
                      <TableCell className="font-mono text-sm">
                        {envio.trackingId || `[ID:${envio.id}]`}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatearFecha(envio.fecha)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{envio.destinatario}</p>
                          <p className="text-xs text-muted-foreground">{envio.destinatarioCiudad}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {envio.descripcion}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1.5 ${statusConfig.color}`}>
                          {statusConfig.icon} {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1.5 ${pagoStatusConfig.color}`}>
                          {pagoStatusConfig.icon} {pagoStatusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerDetalles(envio.id)}
                          disabled={loadingDetalles}
                        >
                          {loadingDetalles ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3 mr-1" />}
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    <Package className="mx-auto h-10 w-10 mb-3 opacity-50" />
                    <p>No se encontraron envíos</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ✅ EL MODAL (DIALOG) ESTÁ AQUÍ AL FINAL */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Envío</DialogTitle>
            <DialogDescription>
              Completa los pasos para generar un nuevo envío nacional
            </DialogDescription>
          </DialogHeader>
          <CreateEnvioWizard
            onClose={() => setIsCreateDialogOpen(false)}
            onSuccess={() => {
              window.location.reload()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- CONFIGURACIÓN DE BADGES ---
const getStatusConfig = (estado: string) => {
  // Normalizamos a mayúsculas por seguridad
  const normalized = estado?.toUpperCase() || "PENDIENTE";
  const configs: Record<string, { color: string; icon: any; label: string }> = {
    EN_ALMACEN: { 
      color: "bg-slate-500/20 text-slate-600 border-slate-500/30", 
      icon: <Package className="h-3 w-3" />, 
      label: "En Almacén" 
    },
    EN_MIAMI: { 
      color: "bg-indigo-500/20 text-indigo-500 border-indigo-500/30", 
      icon: <Palmtree className="h-3 w-3" />, 
      label: "En Miami" 
    },
    EN_TRANSITO: { 
      color: "bg-blue-500/20 text-blue-500 border-blue-500/30", 
      icon: <Truck className="h-3 w-3" />, 
      label: "En Tránsito" 
    },
    ADUANA: { 
      color: "bg-amber-500/20 text-amber-600 border-amber-500/30", 
      icon: <Building2 className="h-3 w-3" />, 
      label: "En Aduana" 
    },
    ENTREGADO: { 
      color: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30", 
      icon: <CheckCircle className="h-3 w-3" />, 
      label: "Entregado" 
    },
    RETENIDO: { 
      color: "bg-red-500/20 text-red-600 border-red-500/30", 
      icon: <AlertTriangle className="h-3 w-3" />, 
      label: "Retenido" 
    },
    PAGADO: {
       color: "bg-green-500/20 text-green-700 border-green-500/30",
       icon: <DollarSign className="h-3 w-3" />,
       label: "Pagado"
    }
  };
  return configs[normalized] || { color: "bg-gray-100 text-gray-500", icon: null, label: normalized };
}

const getPagoStatusConfig = (estado?: string) => {
  const configs: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    PAGADA: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: <CheckCircle className="h-3 w-3" />, label: "Pagada" },
    PAGADO: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: <CheckCircle className="h-3 w-3" />, label: "Pagado" },
    PENDIENTE: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: <Clock className="h-3 w-3" />, label: "Pendiente" },
    VENCIDA: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <AlertTriangle className="h-3 w-3" />, label: "Vencida" },
    ANULADA: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <AlertCircle className="h-3 w-3" />, label: "Anulada" },
    DESCONOCIDO: { color: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: <AlertCircle className="h-3 w-3" />, label: "Sin Factura" },
  }
  return configs[estado || "PENDIENTE"] || configs.PENDIENTE
}