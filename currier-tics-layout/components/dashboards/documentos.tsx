"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Printer, Package, Truck, Loader2, FileText, AlertCircle } from "lucide-react"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { ShippingLabel } from "@/components/pdf/shipping-label"

// Función segura para extraer ID del localStorage
const getSafeUserId = (): number | null => {
  if (typeof window === "undefined") return null
  try {
    const usuarioStr = localStorage.getItem("usuario")
    if (usuarioStr) {
      const usuarioObj = JSON.parse(usuarioStr)
      if (usuarioObj && usuarioObj.id) {
        return Number(usuarioObj.id)
      }
    }
    const simpleId = localStorage.getItem("userId")
    if (simpleId) return Number(simpleId)
    return null
  } catch (error) {
    console.error("Error extrayendo ID:", error)
    return null
  }
}

interface Paquete {
  id: number
  tracking: string
  trackingNumber?: string
  descripcion: string
  peso: number
  tienda?: string
  precio?: number
  estado: string
  fechaCreacion?: string
}

interface Envio {
  id: number
  numeroTracking: string
  descripcion: string
  pesoLibras: number
  valorDeclarado: number
  estado: string
  ciudad?: string
  direccion?: string
  fechaCreacion?: string
  usuario?: {
    nombre?: string
    email?: string
  }
}

export function Documentos() {
  const [paquetes, setPaquetes] = useState<Paquete[]>([])
  const [envios, setEnvios] = useState<Envio[]>([])
  const [isLoadingPaquetes, setIsLoadingPaquetes] = useState(true)
  const [isLoadingEnvios, setIsLoadingEnvios] = useState(true)
  const [userId, setUserId] = useState<number | null>(null)

  // Obtener ID del usuario
  useEffect(() => {
    const id = getSafeUserId()
    if (id) {
      setUserId(id)
    }
  }, [])

  // Cargar paquetes (importaciones)
  useEffect(() => {
    if (!userId) {
      setIsLoadingPaquetes(false)
      return
    }

    const cargarPaquetes = async () => {
      try {
        const response = await fetch(`/api/paquetes?usuarioId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          setPaquetes(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error("Error cargando paquetes:", error)
      } finally {
        setIsLoadingPaquetes(false)
      }
    }

    cargarPaquetes()
  }, [userId])

  // Cargar envíos nacionales
  useEffect(() => {
    if (!userId) {
      setIsLoadingEnvios(false)
      return
    }

    const cargarEnvios = async () => {
      try {
        const response = await fetch(`/api/envios?usuarioId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          setEnvios(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error("Error cargando envíos:", error)
      } finally {
        setIsLoadingEnvios(false)
      }
    }

    cargarEnvios()
  }, [userId])

  const getEstadoBadgeVariant = (estado: string): "default" | "secondary" | "destructive" | "outline" => {
    const estadoUpper = estado?.toUpperCase() || ""
    if (estadoUpper.includes("ENTREGADO") || estadoUpper.includes("COMPLETADO")) return "default"
    if (estadoUpper.includes("PENDIENTE") || estadoUpper.includes("PROCESO")) return "secondary"
    if (estadoUpper.includes("CANCELADO") || estadoUpper.includes("RECHAZADO")) return "destructive"
    return "outline"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mis Documentos</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tus facturas y guías de envío
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="importaciones" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="importaciones" className="gap-2">
            <Package className="h-4 w-4" />
            Importaciones (Entradas)
          </TabsTrigger>
          <TabsTrigger value="envios" className="gap-2">
            <Truck className="h-4 w-4" />
            Envíos Nacionales (Salidas)
          </TabsTrigger>
        </TabsList>

        {/* Tab Content: Importaciones */}
        <TabsContent value="importaciones" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Paquetes Importados
              </CardTitle>
              <CardDescription>
                Historial de tus importaciones internacionales
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPaquetes ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : paquetes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="font-medium text-muted-foreground">No tienes importaciones registradas</p>
                  <p className="text-sm text-muted-foreground/70">
                    Tus paquetes importados aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tracking</TableHead>
                        <TableHead>Tienda</TableHead>
                        <TableHead className="text-right">Peso (lb)</TableHead>
                        <TableHead className="text-right">Total ($)</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paquetes.map((paquete) => (
                        <TableRow key={paquete.id}>
                          <TableCell className="font-mono text-sm">
                            {paquete.tracking || paquete.trackingNumber || `PKG-${paquete.id}`}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              {paquete.tienda || paquete.descripcion || "—"}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {paquete.peso?.toFixed(2) || "0.00"}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ${paquete.precio?.toFixed(2) || "0.00"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getEstadoBadgeVariant(paquete.estado)}>
                              {paquete.estado || "Pendiente"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Content: Envíos Nacionales */}
        <TabsContent value="envios" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Envíos Nacionales
              </CardTitle>
              <CardDescription>
                Gestiona tus envíos dentro del país
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingEnvios ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : envios.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="font-medium text-muted-foreground">No tienes envíos registrados</p>
                  <p className="text-sm text-muted-foreground/70">
                    Crea tu primer envío desde el wizard
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tracking (NAC)</TableHead>
                        <TableHead>Destino</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {envios.map((envio) => (
                        <TableRow key={envio.id}>
                          <TableCell className="font-mono text-sm font-semibold">
                            {envio.numeroTracking}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{envio.ciudad || "Sin ciudad"}</p>
                              <p className="text-xs text-muted-foreground">
                                {envio.direccion || "Sin dirección"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getEstadoBadgeVariant(envio.estado)}>
                              {envio.estado || "Pendiente"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <PDFDownloadLink
                              document={<ShippingLabel envio={envio} />}
                              fileName={`guia-${envio.numeroTracking}.pdf`}
                            >
                              {({ loading }) => (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={loading}
                                  className="gap-2"
                                >
                                  <Printer className="h-4 w-4" />
                                  {loading ? "Generando..." : "Guía"}
                                </Button>
                              )}
                            </PDFDownloadLink>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
