"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, Truck, Printer, FileText, Loader2, Eye } from "lucide-react"
import { PDFDownloadLink } from "@react-pdf/renderer"
import ShippingLabel from "@/components/pdf/shipping-label"
import { PDFPreviewModal } from "@/components/pdf/pdf-preview-modal"
import { securePdfDownload } from "@/lib/securePdfDownload"
import { withAuthHeaders } from "@/lib/authHeaders"

export default function MisDocumentos() {
  const [envios, setEnvios] = useState<any[]>([])
  const [paquetes, setPaquetes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEnvio, setSelectedEnvio] = useState<any>(null)
  const [usuarioEmail, setUsuarioEmail] = useState<string | null>(null)
  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [usuarioToken, setUsuarioToken] = useState<string | null>(null)

  const handleDownloadGuia = async (envioId: number) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-tesis-spring-production.up.railway.app"
    await securePdfDownload({
      url: `${apiUrl}/api/pdf/guia/${envioId}`,
      nombreArchivo: `guia-${envioId}.pdf`,
      token: usuarioToken || undefined,
    })
  }

  const handleDownloadFactura = async (paqueteId: number) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-tesis-spring-production.up.railway.app"
    await securePdfDownload({
      url: `${apiUrl}/api/pdf/factura/${paqueteId}`,
      nombreArchivo: `factura-${paqueteId}.pdf`,
      token: usuarioToken || undefined,
    })
  }

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargar Envíos con ID sanitizado
        const user = localStorage.getItem("usuario")
        if (user) {
          const usuarioObj = JSON.parse(user)
          const idLimpio = String(usuarioObj.id).split(':')[0].trim()
          const emailUsuario = usuarioObj?.email ? String(usuarioObj.email).trim() : null
          const token = usuarioObj?.token ? String(usuarioObj.token).trim() : null

          setUsuarioEmail(emailUsuario)
          setUsuarioId(idLimpio)
          setUsuarioToken(token)
          
          if (!idLimpio || isNaN(Number(idLimpio)) || Number(idLimpio) <= 0) {
            setEnvios([])
          } else {
            try {
              const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-tesis-spring-production.up.railway.app"
              const url = `${apiUrl}/api/envios/usuario/${idLimpio}`
              
              if (url.includes('/usuario/:') || url.match(/\/usuario\/\d+:/)) {
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
          }
        }

        // Cargar Paquetes (Importaciones)
        try {
          const idLimpio = usuarioId || (user ? String(JSON.parse(user).id).split(':')[0].trim() : "")
          const urlPaquetes = idLimpio
            ? `/api/paquetes?usuarioId=${encodeURIComponent(idLimpio)}`
            : `/api/paquetes`

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

            // ✅ FILTRO DE SEGURIDAD CLIENT-SIDE (fallback)
            const emailUsuario = usuarioEmail || (user ? String(JSON.parse(user).email || "").trim() : "")
            const idUsuario = idLimpio

            const filtrados = paquetesArray.filter((item: any) => {
              const emailItem = item?.usuario?.email ? String(item.usuario.email).trim() : ""
              const usuarioIdItem = String(item?.usuarioId || item?.usuario?.id || "").trim()

              if (emailUsuario) {
                return emailItem.toLowerCase() === emailUsuario.toLowerCase()
              }

              return idUsuario ? usuarioIdItem === String(idUsuario) : false
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

      <Tabs defaultValue="envios" className="w-full">
        <TabsList>
          <TabsTrigger value="envios">
            <Truck className="mr-2 h-4 w-4" /> Envíos Nacionales
          </TabsTrigger>
          <TabsTrigger value="importaciones">
            <Package className="mr-2 h-4 w-4" /> Importaciones
          </TabsTrigger>
        </TabsList>

        {/* TAB ENVIOS */}
        <TabsContent value="envios">
          <Card>
            <CardHeader>
              <CardTitle>Mis Guías de Remisión</CardTitle>
              <CardDescription>Descarga las guías de tus envíos nacionales</CardDescription>
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
                    {envios.map((env: any) => (
                      <TableRow key={env.id}>
                        <TableCell className="font-bold font-mono">
                          {env.numeroTracking}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{env.destinatarioCiudad || env.ciudad || "Sin ciudad"}</p>
                            <p className="text-xs text-muted-foreground">{env.destinatarioNombre || "Sin nombre"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{env.estado}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {env.numeroTracking && (
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
                    ))}
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

        {/* TAB IMPORTACIONES */}
        <TabsContent value="importaciones">
          <Card>
            <CardHeader>
              <CardTitle>Facturas de Importación</CardTitle>
              <CardDescription>Historial de tus paquetes importados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking USA</TableHead>
                      <TableHead>Tienda</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Factura</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paquetes.map((pkg: any) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-mono">
                          {pkg.trackingId || pkg.tracking || "—"}
                        </TableCell>
                        <TableCell>{pkg.tienda || pkg.descripcion || "—"}</TableCell>
                        <TableCell className="font-semibold">
                          ${pkg.precioTotal || pkg.precio || "0.00"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => handleDownloadFactura(pkg.id)}
                            title="Descargar PDF"
                            className="cursor-pointer"
                          >
                            <FileText className="mr-2 h-4 w-4" /> Ver Factura
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {paquetes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center p-8 text-muted-foreground">
                          No hay importaciones registradas.
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
