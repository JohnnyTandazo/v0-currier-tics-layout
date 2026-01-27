"use client"

import { useMemo, useState } from "react"
import {
  Search,
  Download,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
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

// ✅ MOCK DATA - No hay llamadas a API
const MOCK_FACTURAS: Factura[] = [
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
]

export function Facturas() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const handleDownloadPDF = (factura: Factura) => {
    console.log(`Descargando PDF de factura: ${factura.numeroFactura}`)
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
    return MOCK_FACTURAS.filter((factura) => {
      const matchesSearch =
        factura.numeroFactura.toLowerCase().includes(searchTerm.toLowerCase()) ||
        factura.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || factura.estadoPago === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [searchTerm, statusFilter])

  const totals = useMemo(() => {
    return {
      total: MOCK_FACTURAS.reduce((acc, f) => acc + f.total, 0),
      pagado: MOCK_FACTURAS.filter(f => f.estadoPago === "PAGADO").reduce((acc, f) => acc + f.total, 0),
      pendiente: MOCK_FACTURAS.filter(f => f.estadoPago === "PENDIENTE" || f.estadoPago === "PARCIAL").reduce((acc, f) => acc + f.total, 0),
      vencido: MOCK_FACTURAS.filter(f => f.estadoPago === "VENCIDO").reduce((acc, f) => acc + f.total, 0),
    }
  }, [])

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
                          className="border-border/50 hover:bg-accent/50"
                        >
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                          PDF
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
