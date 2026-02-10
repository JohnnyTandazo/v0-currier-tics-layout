"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, Truck, Printer, FileText, Loader2, Eye } from "lucide-react"
import { PDFPreviewModal } from "@/components/pdf/pdf-preview-modal"
import { securePdfDownload } from "@/lib/securePdfDownload"
import { getAuthToken, withAuthHeaders } from "@/lib/authHeaders"

export default function MisDocumentos() {
  const [envios, setEnvios] = useState<any[]>([])
  const [paquetes, setPaquetes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEnvio, setSelectedEnvio] = useState<any>(null)
  const [usuarioEmail, setUsuarioEmail] = useState<string | null>(null)
  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [usuarioToken, setUsuarioToken] = useState<string | null>(null)
  const [facturasByPaqueteId, setFacturasByPaqueteId] = useState<Record<string, number>>({})
  const [facturasByEnvioId, setFacturasByEnvioId] = useState<Record<string, number>>({})
  const [facturasByNumero, setFacturasByNumero] = useState<Record<string, number>>({})
  const [facturasByTracking, setFacturasByTracking] = useState<Record<string, number>>({})

  const toNumber = (value: any): number => {
    if (value === null || value === undefined || value === "") return 0
    const numeric = typeof value === "string" ? Number(value.replace(/[^0-9.]/g, "")) : Number(value)
    return Number.isFinite(numeric) ? numeric : 0
  }

  const formatMoney = (value: number): string => {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const getTotalLabel = (pkg: any): string => {
    const totalDirect = toNumber(
      pkg.total ??
        pkg.totalFactura ??
        pkg.montoTotal ??
        pkg.precioTotal ??
        pkg.monto ??
        pkg.precio
    )

    const envio = toNumber(
      pkg.costoEnvio ??
        pkg.costo_envio ??
        pkg.envioCosto ??
        pkg.shippingCost ??
        pkg.costo
    )
    const impuestos = toNumber(pkg.impuestos ?? pkg.iva ?? pkg.tax ?? pkg.impuesto)
    const totalSumado = envio + impuestos

    if (totalDirect > 0) return `$${formatMoney(totalDirect)}`
    if (totalSumado > 0) return `$${formatMoney(totalSumado)}`
    return "Pendiente"
  }

  const handleDownloadGuia = async (envioId: number) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-tesis-spring-production.up.railway.app"
    await securePdfDownload({
      url: `${apiUrl}/api/pdf/guia/${envioId}`,
      nombreArchivo: `guia-${envioId}.pdf`,
      token: getAuthToken() || usuarioToken || undefined,
    })
  }

  const handleDownloadFactura = async (facturaId: number) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-tesis-spring-production.up.railway.app"
    await securePdfDownload({
      url: `${apiUrl}/api/facturas/${facturaId}/pdf`,
      nombreArchivo: `factura-${facturaId}.pdf`,
      token: getAuthToken() || usuarioToken || undefined,
    })
  }

  const normalizeTracking = (value: string): string => {
    return value.replace(/\s+/g, "").toUpperCase()
  }

  const extractTrackingFromDescripcion = (descripcion: string): string | null => {
    if (!descripcion) return null

    const normalized = descripcion.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    const match = normalized.match(/(?:importacion|envio)\s+([^:]+)/i)
    const trackingRaw = match?.[1]?.trim()
    if (!trackingRaw) return null

    return normalizeTracking(trackingRaw)
  }

  const getFacturaId = (pkg: any): number | null => {
    const facturaDirecta = pkg?.facturaId || pkg?.factura?.id
    if (facturaDirecta) return Number(facturaDirecta)

    const paqueteId = String(pkg?.id || "").trim()
    const envioId = String(pkg?.envioId || pkg?.envio?.id || "").trim()
    const tracking = String(pkg?.trackingNumber || pkg?.numeroTracking || pkg?.trackingId || pkg?.tracking || "").trim()
    const trackingKey = tracking ? normalizeTracking(tracking) : ""

    if (paqueteId && facturasByPaqueteId[paqueteId]) {
      return facturasByPaqueteId[paqueteId]
    }

    if (envioId && facturasByEnvioId[envioId]) {
      return facturasByEnvioId[envioId]
    }

    if (paqueteId) {
      const numeroFactura = `FCT-PKG-${paqueteId}`.toUpperCase()
      if (facturasByNumero[numeroFactura]) {
        return facturasByNumero[numeroFactura]
      }
    }

    if (trackingKey && facturasByTracking[trackingKey]) {
      return facturasByTracking[trackingKey]
    }

    return null
  }

  const handleClickFactura = (pkg: any) => {
    const facturaId = getFacturaId(pkg)
    if (!facturaId) {
      alert("Factura no disponible para este paquete.")
      return
    }
    handleDownloadFactura(facturaId)
  }

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const user = localStorage.getItem("usuario")
        if (!user) {
          setEnvios([])
          setPaquetes([])
          return
        }

        const usuarioObj = JSON.parse(user)
        const idLimpio = String(usuarioObj.id).split(":")[0].trim()
        const emailUsuario = usuarioObj?.email ? String(usuarioObj.email).trim() : null
        const token = getAuthToken() || (usuarioObj?.token ? String(usuarioObj.token).trim() : null)

        setUsuarioEmail(emailUsuario)
        setUsuarioId(idLimpio)
        setUsuarioToken(token)

        if (!idLimpio || isNaN(Number(idLimpio)) || Number(idLimpio) <= 0) {
          setEnvios([])
          setPaquetes([])
          return
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-tesis-spring-production.up.railway.app"

        try {
          const url = `${apiUrl}/api/envios/usuario/${idLimpio}`

          if (url.includes("/usuario/:") || url.match(/\/usuario\/\d+:/)) {
            setEnvios([])
          } else {
            console.log("📍 [MIS-DOCS] URL FINAL:", url)

            const resEnvios = await fetch(url, {
              method: "GET",
              headers: withAuthHeaders({ "Content-Type": "application/json" }),
            })

            if (!resEnvios.ok) {
              setEnvios([])
            } else {
              const textEnvios = await resEnvios.text()

              if (!textEnvios || textEnvios.trim() === "") {
                setEnvios([])
              } else {
                const dataEnvios = JSON.parse(textEnvios)
                setEnvios(Array.isArray(dataEnvios) ? dataEnvios : [])
              }
            }
          }
        } catch (envioError) {
          setEnvios([])
        }

        try {
          const urlFacturas = `${apiUrl}/api/facturas/usuario/${idLimpio}`
          const resFacturas = await fetch(urlFacturas, {
            method: "GET",
            headers: withAuthHeaders({ "Content-Type": "application/json" }),
          })

          if (resFacturas.ok) {
            const textFacturas = await resFacturas.text()
            if (textFacturas && textFacturas.trim() !== "") {
              const facturasData = JSON.parse(textFacturas)
              const facturasArray = Array.isArray(facturasData) ? facturasData : []

              const byPaquete: Record<string, number> = {}
              const byEnvio: Record<string, number> = {}
              const byNumero: Record<string, number> = {}
              const byTracking: Record<string, number> = {}

              facturasArray.forEach((factura: any) => {
                const facturaId = factura?.id || factura?.facturaId
                const envioId = factura?.envioId || factura?.envio_id || factura?.envio?.id
                const numeroFacturaRaw = factura?.numeroFactura || factura?.numero_factura
                const numeroFactura = numeroFacturaRaw ? String(numeroFacturaRaw).trim().toUpperCase() : ""
                const descripcion = factura?.descripcion ? String(factura.descripcion) : ""

                if (facturaId && envioId) {
                  byEnvio[String(envioId).trim()] = Number(facturaId)
                }
                if (facturaId && numeroFactura) {
                  byNumero[numeroFactura] = Number(facturaId)

                  const match = numeroFactura.match(/FCT-PKG-(\d+)/i)
                  if (match?.[1]) {
                    const paqueteKey = String(Number(match[1]))
                    byPaquete[paqueteKey] = Number(facturaId)
                  }
                }

                if (facturaId && descripcion) {
                  const trackingKey = extractTrackingFromDescripcion(descripcion)
                  if (trackingKey) {
                    byTracking[trackingKey] = Number(facturaId)
                  }
                }
              })

              setFacturasByPaqueteId(byPaquete)
              setFacturasByEnvioId(byEnvio)
              setFacturasByNumero(byNumero)
              setFacturasByTracking(byTracking)
            }
          }
        } catch (facturaError) {
          setFacturasByPaqueteId({})
          setFacturasByEnvioId({})
          setFacturasByNumero({})
          setFacturasByTracking({})
        }

        try {
          const urlPaquetes = `${apiUrl}/api/paquetes?usuarioId=${encodeURIComponent(idLimpio)}`

          const resPaquetes = await fetch(urlPaquetes, {
            method: "GET",
            headers: withAuthHeaders({ "Content-Type": "application/json" }),
          })
          const textPaquetes = await resPaquetes.text()

          if (!textPaquetes || textPaquetes.trim() === "") {
            setPaquetes([])
          } else {
            const dataPaquetes = JSON.parse(textPaquetes)
            const paquetesArray = Array.isArray(dataPaquetes) ? dataPaquetes : []

            const filtrados = paquetesArray.filter((item: any) => {
              const usuarioIdItem = String(item?.usuarioId || item?.usuario?.id || "").trim()
              if (usuarioIdItem) {
                return usuarioIdItem === String(idLimpio)
              }

              const emailItem = item?.usuario?.email ? String(item.usuario.email).trim() : ""
              return emailUsuario ? emailItem.toLowerCase() === emailUsuario.toLowerCase() : false
            })

            setPaquetes(filtrados)
          }
        } catch (paqueteError) {
          setPaquetes([])
        }
      } finally {
        setIsLoading(false)
      }
    }

    cargarDatos()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mis Documentos</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tus facturas y guías de envío
        </p>
      </div>

      <Tabs defaultValue="recibidos" className="w-full">
        <TabsList>
          <TabsTrigger value="recibidos">
            <Package className="mr-2 h-4 w-4" /> Documentos de Recibidos
          </TabsTrigger>
          <TabsTrigger value="envios">
            <Truck className="mr-2 h-4 w-4" /> Guías de Mis Envíos
          </TabsTrigger>
        </TabsList>

        {/* TAB RECIBIDOS */}
        <TabsContent value="recibidos">
          <Card>
            <CardHeader>
              <CardTitle>Documentos de Recibidos</CardTitle>
              <CardDescription>Facturas de los paquetes que recibes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking</TableHead>
                      <TableHead>Tienda/Origen</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Factura</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paquetes.map((pkg: any) => {
                      const tracking = pkg.trackingNumber || pkg.numeroTracking || pkg.trackingId || pkg.tracking || "—"
                      const origen = pkg.tienda || pkg.origen || pkg.descripcion || "—"
                      const totalLabel = getTotalLabel(pkg)
                      const facturaId = getFacturaId(pkg)
                      
                      return (
                        <TableRow key={pkg.id}>
                          <TableCell className="font-mono">
                            {tracking}
                          </TableCell>
                          <TableCell>{origen}</TableCell>
                          <TableCell className="font-semibold">{totalLabel}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => facturaId && handleDownloadFactura(facturaId)}
                              disabled={!facturaId}
                              title="Descargar PDF"
                              className="cursor-pointer"
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              {facturaId ? "Ver Pre-Factura" : "Pre-factura aun no disponible"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {paquetes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center p-8 text-muted-foreground">
                          No hay documentos de recibidos.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB ENVIOS */}
        <TabsContent value="envios">
          <Card>
            <CardHeader>
              <CardTitle>Guías de Mis Envíos</CardTitle>
              <CardDescription>Descarga las guías de tus envíos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Guía PDF</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {envios.map((env: any) => {
                      const tracking = env.trackingNumber || env.numeroTracking || env.trackingId || "—"
                      const ciudad = env.destinatarioCiudad || env.ciudad || "Sin ciudad"
                      const nombre = env.destinatarioNombre || env.tienda || "Sin nombre"
                      const estado = env.estado || "PENDIENTE"
                      
                      return (
                        <TableRow key={env.id}>
                          <TableCell className="font-bold font-mono">
                            {tracking}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{ciudad}</p>
                              <p className="text-xs text-muted-foreground">{nombre}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{estado}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {tracking !== "—" && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleDownloadGuia(env.id)}
                                title="Descargar PDF"
                                className="cursor-pointer"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Guía
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {envios.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center p-8 text-muted-foreground">
                          No hay envíos creados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PDFPreviewModal
        isOpen={!!selectedEnvio}
        onClose={() => setSelectedEnvio(null)}
        envio={selectedEnvio}
      />
    </div>
  )
}
