"use client"

import { useState, useEffect } from "react"
import { Package, Eye, Trash2, AlertCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import { formatearFecha } from "@/lib/formatDate"

interface MisPaquetesProps {
  onViewTracking: (trackingId: string) => void
}

interface Paquete {
  id: number
  trackingNumber: string
  descripcion: string
  pesoLibras: number
  estado: string
  tipo_envio: string
  fechaRegistro?: string
  usuarioId: number
}

export function MisPaquetes({ onViewTracking }: MisPaquetesProps) {
  const [paquetes, setPaquetes] = useState<Paquete[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchPaquetes = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const usuario = JSON.parse(localStorage.getItem("usuario") || "null")
        if (!usuario || !usuario.id) {
          setPaquetes([])
          setError("Usuario no autenticado")
          return
        }

        const usuarioId = usuario.id
        const cleanId = usuarioId.toString().split(':')[0].trim()

        if (!cleanId || isNaN(Number(cleanId)) || Number(cleanId) <= 0) {
          setError("ID de usuario inválido")
          setPaquetes([])
          return
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-tesis-spring-production.up.railway.app"
        const url = `${apiUrl}/api/paquetes?usuarioId=${cleanId}`

        const response = await fetch(url)
        if (!response.ok) {
          setPaquetes([])
          return
        }

        const text = await response.text()
        if (!text || text.trim() === "") {
          setPaquetes([])
          return
        }

        const data = JSON.parse(text)
        setPaquetes(Array.isArray(data) ? data : [])
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error desconocido"
        setError(errorMessage)
        setPaquetes([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPaquetes()
  }, [])

  const filteredPaquetes = paquetes.filter((pkg) =>
    pkg.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const internacionales = filteredPaquetes.filter((p) => p.tipo_envio === "INTERNACIONAL" || p.tipo_envio === "internacional")
  const nacionales = filteredPaquetes.filter((p) => p.tipo_envio === "NACIONAL" || p.tipo_envio === "nacional")

  const getStatusColor = (estado: string) => {
    const estado_upper = estado.toUpperCase()
    if (estado_upper === "PRE_ALERTADO") return "bg-slate-500"
    if (estado_upper === "EN_MIAMI") return "bg-blue-500"
    if (estado_upper === "ADUANA") return "bg-yellow-500"
    if (estado_upper === "ENTREGADO") return "bg-green-500"
    if (estado_upper === "EN_TRANSITO") return "bg-purple-500"
    return "bg-gray-500"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Cargando paquetes...</p>
        </div>
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
              <p className="font-medium text-red-800">Error al cargar paquetes</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mis Paquetes</h1>
          <p className="text-muted-foreground">Gestiona tus importaciones y envíos</p>
        </div>
        <Badge variant="secondary" className="w-fit">
          Total: {filteredPaquetes.length}
        </Badge>
      </div>

      {/* Search */}
      <Card className="border-border/50 bg-card">
        <CardContent className="pt-6">
          <Input
            placeholder="Buscar por número de tracking o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-background"
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="todos" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="todos">Todos ({filteredPaquetes.length})</TabsTrigger>
          <TabsTrigger value="internacionales">Internacionales ({internacionales.length})</TabsTrigger>
          <TabsTrigger value="nacionales">Nacionales ({nacionales.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="todos">
          <Card>
            <CardHeader>
              <CardTitle>Todos tus Paquetes</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPaquetes.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-muted-foreground">No tienes paquetes registrados</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Peso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPaquetes.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-mono text-sm">{pkg.trackingNumber}</TableCell>
                        <TableCell>{pkg.descripcion}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={pkg.tipo_envio === "INTERNACIONAL" ? "bg-blue-500/20" : "bg-green-500/20"}>
                            {pkg.tipo_envio}
                          </Badge>
                        </TableCell>
                        <TableCell>{pkg.pesoLibras} lb</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(pkg.estado)} text-white`}>
                            {pkg.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewTracking(pkg.trackingNumber)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Rastrear
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="internacionales">
          <Card>
            <CardHeader>
              <CardTitle>Paquetes Internacionales</CardTitle>
              <CardDescription>Importaciones desde el exterior</CardDescription>
            </CardHeader>
            <CardContent>
              {internacionales.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-muted-foreground">No tienes paquetes internacionales</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Peso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {internacionales.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-mono text-sm">{pkg.trackingNumber}</TableCell>
                        <TableCell>{pkg.descripcion}</TableCell>
                        <TableCell>{pkg.pesoLibras} lb</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(pkg.estado)} text-white`}>
                            {pkg.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewTracking(pkg.trackingNumber)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Rastrear
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nacionales">
          <Card>
            <CardHeader>
              <CardTitle>Paquetes Nacionales</CardTitle>
              <CardDescription>Envíos dentro del país</CardDescription>
            </CardHeader>
            <CardContent>
              {nacionales.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-muted-foreground">No tienes paquetes nacionales</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Peso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nacionales.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-mono text-sm">{pkg.trackingNumber}</TableCell>
                        <TableCell>{pkg.descripcion}</TableCell>
                        <TableCell>{pkg.pesoLibras} lb</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(pkg.estado)} text-white`}>
                            {pkg.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewTracking(pkg.trackingNumber)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Rastrear
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
