"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Search,
  Download,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Filter,
  DollarSign,
  Calendar,
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

interface Factura {
  id: number
  numeroFactura: string
  fecha: string
  fechaVencimiento: string
  monto: number
  impuestos: number
  total: number
  estadoPago: "PAGADO" | "PENDIENTE" | "VENCIDO" | "PARCIAL"
  descripcion: string
  items: number
}

export function Facturas() {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const fetchFacturas = async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (!API_URL) {
        throw new Error("NEXT_PUBLIC_API_URL no está configurada")
      }
      
      const response = await fetch(`${API_URL}/api/facturas`)
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setFacturas(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setError(errorMessage)
      // Datos de respaldo para demostración
      setFacturas([
        {
          id: 1,
          numeroFactura: "FAC-2024-00156",
          fecha: "2024-01-15",
          fechaVencimiento: "2024-02-15",
          monto: 85.00,
          impuestos: 10.20,
          total: 95.20,
          estadoPago: "PAGADO",
          descripcion: "Envío internacional - Electrónicos",
          items: 3,
        },
        {
          id: 2,
          numeroFactura: "FAC-2024-00157",
          fecha: "2024-01-18",
          fechaVencimiento: "2024-02-18",
          monto: 127.50,
          impuestos: 15.30,
          total: 142.80,
          estadoPago: "PENDIENTE",
          descripcion: "Consolidación de paquetes",
          items: 5,
        },
        {
          id: 3,
          numeroFactura: "FAC-2024-00158",
          fecha: "2024-01-10",
          fechaVencimiento: "2024-01-25",
          monto: 45.00,
          impuestos: 5.40,
          total: 50.40,
          estadoPago: "VENCIDO",
          descripcion: "Envío nacional express",
          items: 1,
        },
        {
          id: 4,
          numeroFactura: "FAC-2024-00159",
          fecha: "2024-01-20",
          fechaVencimiento: "2024-02-20",
          monto: 200.00,
          impuestos: 24.00,
          total: 224.00,
          estadoPago: "PARCIAL",
          descripcion: "Importación mayorista",
          items: 8,
        },
        {
          id: 5,
          numeroFactura: "FAC-2024-00160",
          fecha: "2024-01-22",
          fechaVencimiento: "2024-02-22",
          monto: 62.50,
          impuestos: 7.50,
          total: 70.00,
          estadoPago: "PAGADO",
          descripcion: "Envío documentos urgentes",
          items: 2,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFacturas()
  }, [])

  const handleDownloadPDF = async (factura: Factura) => {
    setDownloadingId(factura.id)
    try {
      // Simular descarga de PDF
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // En producción, esto sería una llamada real al API
      // const response = await fetch(`${API_URL}/api/facturas/${factura.id}/pdf`)
      // const blob = await response.blob()
      // const url = window.URL.createObjectURL(blob)
      // const a = document.createElement('a')
      // a.href = url
      // a.download = `${factura.numeroFactura}.pdf`
      // a.click()
      
      console.log(`Descargando PDF de factura: ${factura.numeroFactura}`)
    } catch (err) {
      console.error("Error al descargar PDF:", err)
    } finally {
      setDownloadingId(null)
    }
  }

  const getStatusConfig = (estado: string) => {
    const configs: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      PAGADO: {
        color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        icon: <CheckCircle className="h-3 w-3" />,
        label: "Pagado",
      },
      PENDIENTE: {
        color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        icon: <Clock className="h-3 w-3" />,
        label: "Pendiente",
      },
      VENCIDO: {
        color: "bg-red-500/20 text-red-400 border-red-500/30",
        icon: <AlertCircle className="h-3 w-3" />,
        label: "Vencido",
      },
      PARCIAL: {
        color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        icon: <DollarSign className="h-3 w-3" />,
        label: "Parcial",
      },
    }
    return configs[estado] || configs.PENDIENTE
  }

  const filteredFacturas = useMemo(() => {
    return facturas.filter((factura) => {
      const matchesSearch =
        factura.numeroFactura.toLowerCase().includes(searchTerm.toLowerCase()) ||
        factura.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || factura.estadoPago === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [facturas, searchTerm, statusFilter])

  const totals = useMemo(() => {
    return {
      total: facturas.reduce((acc, f) => acc + f.total, 0),
      pagado: facturas.filter(f => f.estadoPago === "PAGADO").reduce((acc, f) => acc + f.total, 0),
      pendiente: facturas.filter(f => f.estadoPago === "PENDIENTE" || f.estadoPago === "PARCIAL").reduce((acc, f) => acc + f.total, 0),
      vencido: facturas.filter(f => f.estadoPago === "VENCIDO").reduce((acc, f) => acc + f.total, 0),
    }
  }, [facturas])

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="pt-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-border/50">
          <CardHeader>
            <Skeleton className="h-7 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
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
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <p className="font-medium text-red-400">Error al cargar las facturas</p>
            <p className="text-sm text-red-400/70 mt-1">{error}</p>
            <Button
              variant="outline"
              className="mt-4 border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={fetchFacturas}
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
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-500/20">
                <FileText className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totals.total.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total Facturado</p>
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
                <p className="text-2xl font-bold">${totals.pagado.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Pagado</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totals.pendiente.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Pendiente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totals.vencido.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Vencido</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card className="border-border/50 bg-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-semibold">Mis Facturas</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar factura..."
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
                  <SelectItem value="PAGADO">Pagado</SelectItem>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="VENCIDO">Vencido</SelectItem>
                  <SelectItem value="PARCIAL">Parcial</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchFacturas}
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
                <TableHead className="text-muted-foreground">Nro Factura</TableHead>
                <TableHead className="text-muted-foreground">Fecha</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Descripción</TableHead>
                <TableHead className="text-muted-foreground text-right">Monto</TableHead>
                <TableHead className="text-muted-foreground">Estado</TableHead>
                <TableHead className="text-right text-muted-foreground">PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFacturas.length > 0 ? (
                filteredFacturas.map((factura) => {
                  const statusConfig = getStatusConfig(factura.estadoPago)
                  return (
                    <TableRow key={factura.id} className="border-border/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm text-foreground">
                            {factura.numeroFactura}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-foreground">
                            {new Date(factura.fecha).toLocaleDateString("es-EC", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Vence: {new Date(factura.fechaVencimiento).toLocaleDateString("es-EC", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div>
                          <p className="text-foreground">{factura.descripcion}</p>
                          <p className="text-xs text-muted-foreground">{factura.items} item(s)</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-lg font-semibold text-foreground">
                            ${factura.total.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            IVA: ${factura.impuestos.toFixed(2)}
                          </span>
                        </div>
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
                          onClick={() => handleDownloadPDF(factura)}
                          disabled={downloadingId === factura.id}
                          className="border-border/50 hover:bg-accent/50"
                        >
                          {downloadingId === factura.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Download className="mr-1.5 h-3.5 w-3.5" />
                              PDF
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    <FileText className="mx-auto h-10 w-10 mb-3 opacity-50" />
                    <p>No se encontraron facturas</p>
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
