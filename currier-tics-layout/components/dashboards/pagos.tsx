"use client"

import { useState, useRef } from "react"
import {
  Upload,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  ImageIcon,
  X,
  Send,
  History,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Separator } from "@/components/ui/separator"

interface FacturaPendiente {
  id: number
  numeroFactura: string
  total: number
  fechaVencimiento: string
}

interface PagoReciente {
  id: number
  fecha: string
  monto: number
  facturaId: string
  metodoPago: string
  estado: "VERIFICADO" | "PENDIENTE" | "RECHAZADO"
  referencia: string
}

interface FormData {
  facturaId: string
  monto: string
  metodoPago: string
  referencia: string
  notas: string
  comprobante: File | null
}

// ✅ MOCK DATA
const MOCK_FACTURAS_PENDIENTES: FacturaPendiente[] = [
  {
    id: 1,
    numeroFactura: "FAC-2024-00157",
    total: 142.80,
    fechaVencimiento: "2024-02-18",
  },
  {
    id: 2,
    numeroFactura: "FAC-2024-00159",
    total: 224.00,
    fechaVencimiento: "2024-02-20",
  },
]

const MOCK_PAGOS_RECIENTES: PagoReciente[] = [
  {
    id: 1,
    fecha: "2024-01-22",
    monto: 95.20,
    facturaId: "FAC-2024-00156",
    metodoPago: "Transferencia Bancaria",
    estado: "VERIFICADO",
    referencia: "TRF-2024-001234",
  },
  {
    id: 2,
    fecha: "2024-01-20",
    monto: 70.00,
    facturaId: "FAC-2024-00160",
    metodoPago: "Tarjeta de Crédito",
    estado: "VERIFICADO",
    referencia: "TAR-2024-005678",
  },
  {
    id: 3,
    fecha: "2024-01-18",
    monto: 50.40,
    facturaId: "FAC-2024-00158",
    metodoPago: "Efectivo",
    estado: "PENDIENTE",
    referencia: "EFC-2024-009012",
  },
]

export function Pagos() {
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState<FormData>({
    facturaId: "",
    monto: "",
    metodoPago: "",
    referencia: "",
    notas: "",
    comprobante: null,
  })

  const handleFormChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmitPago = () => {
    console.log("Registrando pago:", formData)
    setSubmitSuccess(true)
    setTimeout(() => setSubmitSuccess(false), 3000)
  }

  const getStatusConfig = (estado: string) => {
    const configs: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      VERIFICADO: {
        color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        icon: <CheckCircle className="h-3 w-3" />,
        label: "Verificado",
      },
      PENDIENTE: {
        color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        icon: <Clock className="h-3 w-3" />,
        label: "Pendiente",
      },
      RECHAZADO: {
        color: "bg-red-500/20 text-red-400 border-red-500/30",
        icon: <AlertCircle className="h-3 w-3" />,
        label: "Rechazado",
      },
    }
    return configs[estado] || configs.PENDIENTE
  }

  const totalPendiente = MOCK_FACTURAS_PENDIENTES.reduce((acc, f) => acc + f.total, 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/50 bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                <DollarSign className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalPendiente.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total Pendiente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                <FileText className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{MOCK_FACTURAS_PENDIENTES.length}</p>
                <p className="text-xs text-muted-foreground">Facturas Pendientes</p>
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
                <p className="text-2xl font-bold">
                  {MOCK_PAGOS_RECIENTES.filter((p: PagoReciente) => p.estado === "VERIFICADO").length}
                </p>
                <p className="text-xs text-muted-foreground">Pagos Verificados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Form */}
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-primary" />
              Registrar Nuevo Pago
            </CardTitle>
            <CardDescription>
              Sube tu comprobante de pago para procesar tu factura
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitSuccess && (
              <div className="mb-6 flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="font-medium text-emerald-400">Pago registrado exitosamente</p>
                  <p className="text-sm text-emerald-400/70">
                    Tu pago será verificado en las próximas horas
                  </p>
                </div>
              </div>
            )}
            
            <form onSubmit={(e) => { e.preventDefault(); handleSubmitPago() }} className="space-y-5">
              {/* Factura Selection */}
              <div className="space-y-2">
                <Label htmlFor="factura" className="text-foreground">
                  Seleccionar Factura
                </Label>
                <Select
                  value={formData.facturaId}
                  onValueChange={(v) => handleFormChange("facturaId", v)}
                >
                  <SelectTrigger className="bg-background/50 border-border/50">
                    <SelectValue placeholder="Selecciona una factura pendiente" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_FACTURAS_PENDIENTES.map((factura) => (
                      <SelectItem key={factura.id} value={factura.id.toString()}>
                        <div className="flex items-center justify-between gap-4">
                          <span>{factura.numeroFactura}</span>
                          <span className="text-muted-foreground">
                            ${factura.total.toFixed(2)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="monto" className="text-foreground">
                  Monto a Pagar ($)
                </Label>
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.monto}
                  onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
                  className="bg-background/50 border-border/50"
                  required
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="metodo" className="text-foreground">
                  Método de Pago
                </Label>
                <Select
                  value={formData.metodoPago}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, metodoPago: value }))}
                >
                  <SelectTrigger className="bg-background/50 border-border/50">
                    <SelectValue placeholder="Selecciona el método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                    <SelectItem value="deposito">Depósito Bancario</SelectItem>
                    <SelectItem value="efectivo">Efectivo en Oficina</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta de Crédito/Débito</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reference Number */}
              <div className="space-y-2">
                <Label htmlFor="referencia" className="text-foreground">
                  Número de Referencia / Comprobante
                </Label>
                <Input
                  id="referencia"
                  placeholder="Ej: TRF-123456789"
                  value={formData.referencia}
                  onChange={(e) => setFormData(prev => ({ ...prev, referencia: e.target.value }))}
                  className="bg-background/50 border-border/50"
                  required
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label className="text-foreground">Subir Comprobante</Label>
                <div className="relative">
                  {formData.comprobante ? (
                    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/50 p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                        <ImageIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {formData.comprobante.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(formData.comprobante.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleFormChange("comprobante", null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/50 bg-background/30 p-6 transition-colors hover:border-primary/50 hover:bg-background/50">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm font-medium text-foreground">
                        Arrastra o haz clic para subir
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        PNG, JPG o PDF (máx. 5MB)
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFormChange("comprobante", file)
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notas" className="text-foreground">
                  Notas Adicionales (opcional)
                </Label>
                <Textarea
                  id="notas"
                  placeholder="Información adicional sobre el pago..."
                  value={formData.notas}
                  onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                  className="bg-background/50 border-border/50 min-h-[80px]"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!formData.facturaId || !formData.monto || !formData.metodoPago}
              >
                <Send className="mr-2 h-4 w-4" />
                Registrar Pago
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-primary" />
              Historial de Pagos Recientes
            </CardTitle>
            <CardDescription>
              Últimos pagos registrados y su estado de verificación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Fecha</TableHead>
                  <TableHead className="text-muted-foreground">Factura</TableHead>
                  <TableHead className="text-muted-foreground text-right">Monto</TableHead>
                  <TableHead className="text-muted-foreground">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_PAGOS_RECIENTES.length > 0 ? (
                  MOCK_PAGOS_RECIENTES.map((pago) => {
                    const statusConfig = getStatusConfig(pago.estado)
                    return (
                      <TableRow key={pago.id} className="border-border/50">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-foreground text-sm">
                              {new Date(pago.fecha).toLocaleDateString("es-EC", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {pago.metodoPago}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-foreground">
                            {pago.facturaId}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-foreground">
                            ${pago.monto.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`gap-1 text-xs ${statusConfig.color}`}
                          >
                            {statusConfig.icon}
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                      <CreditCard className="mx-auto h-10 w-10 mb-3 opacity-50" />
                      <p>No hay pagos recientes</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
