"use client"

import { useMemo, useState, useEffect } from "react"
import {
  Search,
  Eye,
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Filter,
  Loader2,
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
import { safeFetch } from "@/lib/safeFetch"
import { defensiveFetch, createFallbackEnvio } from "@/lib/defensiveFetch"
import { formatearFecha } from "@/lib/formatDate"

interface Envio {
  id: number
  trackingId: string
  fecha: string
  destinatario: string
  direccion: string
  estado: "EN_TRANSITO" | "ENTREGADO" | "RETENIDO" | "PROCESANDO" | "EN_ADUANA"
  peso: number
  descripcion: string
  usuarioId: number
}

interface EnvioDetalles extends Envio {
  // Campos adicionales que pueden venir en los detalles
  origen?: string
  destino?: string
  contenido?: string
  referencia?: string
  [key: string]: any
}

interface MisEnviosProps {
  onViewDetails?: (trackingId: string) => void
}

export function MisEnvios({ onViewDetails }: MisEnviosProps) {
  const [envios, setEnvios] = useState<Envio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [usuario, setUsuario] = useState<any>(null)
  const [loadingDetalles, setLoadingDetalles] = useState(false)

  // ✅ FUNCIÓN DEFENSIVA PARA CARGAR DETALLES
  const handleVerDetalles = async (trackingCode: number | string | undefined) => {
    try {
      setLoadingDetalles(true)
      
      // ✅ VALIDACIÓN 1: Verificar que el trackingCode sea válido
      if (!trackingCode || trackingCode === "undefined" || trackingCode === "null") {
        console.error("❌ [Frontend] Tracking code inválido o vacío:", trackingCode)
        alert("Error: Código de rastreo inválido")
        setLoadingDetalles(false)
        return
      }

      // ✅ USAR TRACKING CODE (convertir a string si es número)
      const trackingId = String(trackingCode).trim()
      
      if (!trackingId || trackingId.length === 0) {
        console.error("❌ [Frontend] Tracking code vacío:", trackingCode)
        alert("Error: Código de rastreo vacío")
        setLoadingDetalles(false)
        return
      }

      console.log("🔍 [Frontend] Cargando detalles del envío - Tracking:", trackingId)
      console.log("📡 [Frontend] Tracking Code - Tipo:", typeof trackingId, "Valor:", trackingId)

      // ✅ LLAMAR AL ENDPOINT POR TRACKING CODE
      const url = `/api/envios/${trackingId}`
      console.log("📡 [Frontend] URL endpoint:", url)

      const { data, error, status } = await defensiveFetch<EnvioDetalles>(
        url,
        {
          method: "GET",
          fallbackData: createFallbackEnvio(trackingId),
        }
      )

      if (error) {
        console.error("❌ [Frontend] Error al cargar detalles")
        console.error("❌ URL:", url)
        console.error("❌ Error:", error, "Status:", status)
        alert(`Error al cargar detalles:\n\n${error}\n\nTracking: ${trackingId}`)
        setLoadingDetalles(false)
        return
      }

      if (!data) {
        console.warn("⚠️ [Frontend] No hay datos para tracking:", trackingId)
        alert("No se pudieron cargar los detalles del envío.")
        setLoadingDetalles(false)
        return
      }

      console.log("✅ [Frontend] ÉXITO - Datos del envío:", data)

      const isFallback = (data as any)._fallback
      const mensaje = isFallback
        ? "⚠️ Datos no disponibles (usando fallback)"
        : "✅ Detalles del envío"

      alert(
        `${mensaje}\n\nTracking: ${data.trackingId}\nEstado: ${data.estado}\nDestinatario: ${data.destinatario}`
      )
    } catch (err: any) {
      console.error("💥 [Frontend ERROR] Error crítico:", err)
      console.error("💥 [Frontend ERROR] Stack:", err.stack)
      alert("Error de conexión. Por favor, intenta de nuevo.")
    } finally {
      setLoadingDetalles(false)
    }
  }

  useEffect(() => {
    const fetchEnvios = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Primero verificamos el usuario
        const usuarioStored = JSON.parse(localStorage.getItem("usuario") || "null")
        
        if (!usuarioStored || !usuarioStored.id) {
          console.log("Usuario no autenticado")
          setUsuario(null)
          setEnvios([])
          setIsLoading(false)
          return
        }
        
        setUsuario(usuarioStored)
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL
        if (!apiUrl) {
          throw new Error("NEXT_PUBLIC_API_URL is not configured")
        }

        const url = `${apiUrl}/api/paquetes`
        const data = await safeFetch(url)
        
        // Verificar que data sea un array antes de filtrar
        if (!Array.isArray(data)) {
          console.error("❌ Datos no son array:", data)
          setEnvios([])
          return
        }
        
        // 🔥 LOG URGENTE: Ver estructura real de datos del backend
        console.log("🔥 DATOS RECIBIDOS DEL BACKEND - Primera instancia:")
        if (data.length > 0) {
          console.log("🔥 Estructura completa objeto 0:", data[0])
          console.log("🔥 Campos disponibles en objeto 0:", Object.keys(data[0]))
          console.log("🔥 ========================================")
          console.log("🔥 TRACKING IDs DISPONIBLES:")
          console.log("    p.trackingId:", data[0].trackingId)
          console.log("    p.tracking:", data[0].tracking)
          console.log("    p.numeroGuia:", data[0].numeroGuia)
          console.log("    p.numero_guia:", data[0].numero_guia)
          console.log("    p.trackingNumber:", data[0].trackingNumber)
          console.log("    p.numeroTracking:", data[0].numeroTracking)
          console.log("    p.numero_tracking:", data[0].numero_tracking)
          console.log("🔥 ========================================")
          console.log("🔥 IDs NUMÉRICOS DISPONIBLES:")
          console.log("    p.id:", data[0].id)
          console.log("    p.idEnvio:", data[0].idEnvio)
          console.log("    p.id_envio:", data[0].id_envio)
          console.log("    p.paqueteId:", data[0].paqueteId)
          console.log("    p.id_paquete:", data[0].id_paquete)
          console.log("🔥 ========================================")
          
          // Mostrar los primeros 3 registros para ver patrones
          console.log("🔥 PRIMEROS 3 REGISTROS COMPLETOS:")
          data.slice(0, 3).forEach((item: any, idx: number) => {
            console.log(`  [${idx}] trackingId: "${item.trackingId || item.numeroGuia || item.numeroTracking || 'N/A'}" | id: ${item.id}`)
          })
        }
        
        console.log("USUARIO LOGUEADO:", usuarioStored)
        console.log("DATOS RAW:", data.length, "registros")

        // ✅ MAPEO DE CAMPOS: Normalizar estructura del backend
        const normalizedEnvios = data.map((p: any, index: number) => {
          // CRÍTICO: Validar que siempre haya un ID válido
          const finalId = p.id || p.idEnvio || p.id_envio || p.paqueteId || p.id_paquete || p.numeroGuia || p.numero_guia || p.referencia || p.reference
          
          // CRÍTICO: El backend usa "numeroTracking" como campo principal (según Spring Boot)
          const realTrackingId = p.numeroTracking || p.numero_tracking || p.trackingNumber || p.trackingId || p.tracking || p.numeroGuia || p.numero_guia
          
          if (!finalId) {
            console.error("⚠️ [MAPEO] Objeto en índice", index, "NO TIENE ningún campo de ID:")
            console.error("    Objeto completo:", p)
            console.error("    Campos:", Object.keys(p))
          }
          
          if (!realTrackingId) {
            console.warn("⚠️ [MAPEO] Objeto en índice", index, "NO TIENE trackingId. Generando fallback PKG-" + index)
          }
          
          const envioNormalizado = {
            // CRÍTICO: Usar el ID real del backend, NUNCA el índice
            id: finalId || undefined,
            trackingId: realTrackingId || `PKG-${index}`,
            fecha: p.fechaCreacion || p.fecha || p.createdAt || new Date().toISOString(),
            destinatario: p.destinatario || p.recipient || p.nombre_destinatario || "SIN-DESTINATARIO",
            direccion: p.direccion || p.address || p.direccion_envio || "SIN-DIRECCIÓN",
            estado: p.estado || p.status || "PROCESANDO",
            peso: p.pesoLibras || p.peso || p.weight || 0,
            descripcion: p.descripcion || p.description || "SIN-DESCRIPCIÓN",
            usuarioId: p.usuario?.id || p.usuarioId || p.id_usuario || p.usuario_id || usuarioStored.id,
          }

          console.log(`✅ [MAPEO ${index}] ID: ${envioNormalizado.id} | trackingId: "${envioNormalizado.trackingId}"`)
          return envioNormalizado
        })

        console.log("✅ ENVÍOS NORMALIZADOS (primero):", normalizedEnvios[0])

        // FILTRADO ESTRICTO por usuario
        const misEnvios = normalizedEnvios.filter((p: Envio) => {
          const myUserId = usuarioStored.id
          return String(p.usuarioId) === String(myUserId)
        })

        console.log("ENVÍOS FILTRADOS:", misEnvios.length, "registros")
        console.log("🔥 PRIMER ENVÍO DESPUÉS DE NORMALIZAR:", misEnvios[0])
        
        // 🔥 LOGS ESPECÍFICOS PARA DEBUG: Buscar el objeto RAW del backend que corresponde al ID 10
        if (misEnvios.length > 0 && misEnvios[0].id === 10) {
          const objetoRawID10 = data.find((p: any) => p.id === 10)
          console.log("🔥🔥🔥 OBJETO RAW DEL BACKEND PARA ID 10:")
          console.log("    trackingNumber:", objetoRawID10?.trackingNumber)
          console.log("    trackingId:", objetoRawID10?.trackingId)
          console.log("    numeroGuia:", objetoRawID10?.numeroGuia)
          console.log("    OBJETO COMPLETO:", objetoRawID10)
        }
        
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Cargando envíos...</p>
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
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Sesión requerida
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              Debes iniciar sesión para ver tus envíos.
            </p>
            <a
              href="/login"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Iniciar Sesión
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center justify-center py-10">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="font-medium text-red-800">Error loading shipments</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
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
                <CheckCircle className="h-5 w-4" />
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{envios.filter((e: Envio) => e.estado === "ENTREGADO").length}</p>
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
                className="border-border/50"
              >
                <Filter className="h-4 w-4" />
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
                        {envio.trackingId || `[ID:${envio.id}]` || "[VACÍO]"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatearFecha(envio.fecha)}
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
                          onClick={() => {
                            console.log("🖱️ [Frontend] Click en Ver Detalles")
                            console.log("  ├─ envio.trackingId:", envio.trackingId, "tipo:", typeof envio.trackingId)
                            console.log("  ├─ envio.id (ID numérico interno):", envio.id)
                            console.log("  └─ objeto completo:", envio)
                            // ✅ Usar trackingId en lugar de ID numérico
                            handleVerDetalles(envio.trackingId)
                          }}
                          disabled={loadingDetalles}
                          className="border-border/50 hover:bg-accent/50"
                        >
                          {loadingDetalles ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                          )}
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
      icon: <Filter className="h-3 w-3" />,
      label: "Procesando",
    },
  }
  return configs[estado] || configs.PROCESANDO
}
