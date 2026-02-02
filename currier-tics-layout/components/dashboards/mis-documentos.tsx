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

export default function MisDocumentos() {
  const [envios, setEnvios] = useState<any[]>([])
  const [paquetes, setPaquetes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEnvio, setSelectedEnvio] = useState<any>(null)

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargar Envíos con ID sanitizado
        const user = localStorage.getItem("usuario")
        if (user) {
          const usuarioObj = JSON.parse(user)
          // ✅ SANITIZAR ID ANTES DE LLAMAR AL BACKEND
          const idLimpio = String(usuarioObj.id).split(':')[0].trim()
          console.log("🛠️ [MIS-DOCS] Sanitizando ID:", usuarioObj.id, "-> ID Limpio:", idLimpio)
          
          if (!idLimpio || isNaN(Number(idLimpio)) || Number(idLimpio) <= 0) {
            console.error("❌ [MIS-DOCS] ID inválido:", idLimpio)
            setEnvios([])
          } else {
            try {
              const resEnvios = await fetch(`/api/envios/usuario/${idLimpio}`)
              const textEnvios = await resEnvios.text()
              
              console.log("📊 [MIS-DOCS] Response status:", resEnvios.status)
              console.log("📊 [MIS-DOCS] Response length:", textEnvios.length)
              
              if (!textEnvios || textEnvios.trim() === "") {
                console.warn("⚠️ [MIS-DOCS] Respuesta vacía")
                setEnvios([])
              } else {
                const dataEnvios = JSON.parse(textEnvios)
                console.log("✅ [MIS-DOCS] Envíos cargados:", dataEnvios.length)
                setEnvios(Array.isArray(dataEnvios) ? dataEnvios : [])
              }
            } catch (envioError) {
              console.error("❌ [MIS-DOCS] Error fetching envios:", envioError)
              setEnvios([])
            }
          }
        }

        // Cargar Paquetes (Importaciones)
        try {
          const resPaquetes = await fetch("/api/paquetes")
          const textPaquetes = await resPaquetes.text()
          
          if (!textPaquetes || textPaquetes.trim() === "") {
            setPaquetes([])
          } else {
            const dataPaquetes = JSON.parse(textPaquetes)
            setPaquetes(Array.isArray(dataPaquetes) ? dataPaquetes : [])
          }
        } catch (paqueteError) {
          console.error("❌ Error fetching paquetes:", paqueteError)
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
                              onClick={() => setSelectedEnvio(env)}
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
                          <Button size="sm" variant="ghost" disabled>
                            <FileText className="mr-2 h-4 w-4" /> Próximamente
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
