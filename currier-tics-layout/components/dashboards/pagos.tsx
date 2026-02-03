"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { withAuthHeaders } from "@/lib/authHeaders"

interface Usuario {
  id: number
  nombre: string
  email: string
}

interface FacturaPendiente {
  id: number
  numeroFactura: string | null
  monto: number
  saldoPendiente?: number
  estado?: string
  descripcion?: string
  fechaVencimiento: string
  usuarioId?: number
  usuario?: { id: number }
  envio?: {
    id: number
    numeroTracking?: string
    trackingNumber?: string
    descripcion: string
  }
}

interface PagoReciente {
  id: number
  fecha?: string
  monto?: number
  facturaId?: string | number
  metodoPago?: string
  estado?: "VERIFICADO" | "PENDIENTE" | "RECHAZADO" | "CONFIRMADO" | string
  referencia?: string
  usuarioId?: number
  usuario?: { id: number }
}

interface FormData {
  facturaId: string
  monto: string
  metodoPago: string
  referencia: string
  notas: string
  comprobante: File | null
}

export function Pagos() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [facturasPendientes, setFacturasPendientes] = useState<FacturaPendiente[]>([])
  const [pagosRecientes, setPagosRecientes] = useState<PagoReciente[]>([])
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

  const fetchPagosRecientes = async (apiUrl: string, usuarioId: string) => {
    try {
      const endpoint = `${apiUrl}/api/pagos?usuarioId=${usuarioId}`
      const response = await fetch(endpoint, {
        method: "GET",
        headers: withAuthHeaders({ "Content-Type": "application/json" }),
      })

      if (!response.ok) {
        setPagosRecientes([])
        return
      }

      const text = await response.text()
      if (!text || text.trim() === "") {
        setPagosRecientes([])
        return
      }

      const data = JSON.parse(text)

      if (Array.isArray(data) && data.length > 0) {
        setPagosRecientes(data)
        return
      }

      setPagosRecientes([])
    } catch (err) {
      setPagosRecientes([])
    }
  }

  // Obtener usuario del localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("usuario")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && parsed.id) {
          setUsuario(parsed)
        } else {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    } catch (err) {
      console.error("Error parsing usuario:", err)
      setLoading(false)
    }
  }, [])

  const usuarioId = usuario?.id ? String(usuario.id).split(":")[0].trim() : ""

  // Fetch pagos SOLO si hay usuario.id válido
  useEffect(() => {
    if (!usuarioId) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        const idLimpio = usuarioId
        
        if (!idLimpio || isNaN(Number(idLimpio)) || Number(idLimpio) <= 0) {
          setLoading(false)
          return
        }
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-tesis-spring-production.up.railway.app"

        // Fetch facturas pendientes
        try {
          const urlFacturas = `${apiUrl}/api/facturas/usuario/${idLimpio}`
          const resFacturas = await fetch(urlFacturas, {
            method: "GET",
            headers: withAuthHeaders({ "Content-Type": "application/json" }),
          })
          
          if (resFacturas.ok) {
            const text = await resFacturas.text()
            
            if (text && text.trim() !== "") {
              try {
                const data = JSON.parse(text)
                
                if (Array.isArray(data)) {
                  const facturasPendientes = data.filter((f: FacturaPendiente) => {
                    const estado = String(f.estado || "").toUpperCase()
                    return estado !== "PAGADO" && estado !== "PENDIENTE_VERIFICACION"
                  })
                  setFacturasPendientes(facturasPendientes)
                } else {
                  setFacturasPendientes([])
                }
              } catch (parseErr) {
                setFacturasPendientes([])
              }
            } else {
              setFacturasPendientes([])
            }
          } else {
            setFacturasPendientes([])
          }
        } catch (err) {
          setFacturasPendientes([])
        }

        // Fetch pagos recientes
        await fetchPagosRecientes(apiUrl, idLimpio)
      } catch (err) {
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [usuarioId])

  const handleFormChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmitPago = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl || !usuario) {
        return
      }

      const submitData = new FormData()
      submitData.append("facturaId", formData.facturaId)
      submitData.append("monto", formData.monto)
      submitData.append("metodoPago", formData.metodoPago)
      submitData.append("referencia", formData.referencia)
      if (formData.comprobante) {
        submitData.append("comprobante", formData.comprobante)
      }

      const response = await fetch(`${apiUrl}/api/pagos`, {
        method: "POST",
        headers: withAuthHeaders(),
        body: submitData,
      })

      if (response.ok) {
        const result = await response.json()
        setSubmitSuccess(true)
        
        setFormData({
          facturaId: "",
          monto: "",
          metodoPago: "",
          referencia: "",
          notas: "",
          comprobante: null,
        })

        setTimeout(async () => {
          const idLimpio = String(usuario.id).split(':')[0].trim()
          
          // Refetch facturas pendientes
          const resFacturas = await fetch(`${apiUrl}/api/facturas/usuario/${idLimpio}`, {
            method: "GET",
            headers: withAuthHeaders({ "Content-Type": "application/json" }),
          })
          if (resFacturas.ok) {
            const text = await resFacturas.text()
            if (text && text.trim() !== "") {
              try {
                const data = JSON.parse(text)
                if (Array.isArray(data)) {
                  const facturasPendientes = data.filter((f: FacturaPendiente) => {
                    const estado = String(f.estado || "").toUpperCase()
                    return estado !== "PAGADO" && estado !== "PENDIENTE_VERIFICACION"
                  })
                  setFacturasPendientes(facturasPendientes)
                }
              } catch (err) {}
            }
          }

          // Refetch pagos recientes
          await fetchPagosRecientes(apiUrl, idLimpio)

          setSubmitSuccess(false)
          router.refresh()
        }, 1500)
      } else {
        const errorText = await response.text()
        alert(`Error ${response.status}: ${errorText || 'No se pudo registrar el pago'}`)
      }
    } catch (err) {
      alert("Error de red al enviar el pago. Verifica tu conexión.")
    }
  }

  const getStatusConfig = (estado: string) => {
    const configs: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      CONFIRMADO: {
        color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        icon: <CheckCircle className="h-3 w-3" />,
        label: "CONFIRMADO",
      },
      VERIFICADO: {
        color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        icon: <CheckCircle className="h-3 w-3" />,
        label: "Verificado",
      },
      PENDIENTE: {
        color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        icon: <Clock className="h-3 w-3" />,
        label: "VERIFICANDO PAGO",
      },
      RECHAZADO: {
        color: "bg-red-500/20 text-red-400 border-red-500/30",
        icon: <AlertCircle className="h-3 w-3" />,
        label: "Rechazado",
      },
    }
    return configs[estado] || {
      color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      icon: <AlertCircle className="h-3 w-3" />,
      label: estado || "Pendiente",
    }
  }

  // Calcular totales usando SOLO datos filtrados del usuario
  const totalPendiente = facturasPendientes.reduce((acc, f) => acc + (f.monto || 0), 0)
  const totalPagado = pagosRecientes.reduce((acc, p) => acc + (p.monto || 0), 0)
  const totalVerificado = pagosRecientes
    .filter((p) => p.estado === "VERIFICADO")
    .reduce((acc, p) => acc + (p.monto || 0), 0)

  const facturasDisponibles = facturasPendientes.filter((f) => {
    const estado = f.estado ? f.estado.toUpperCase() : ""
    return (
      estado !== "PAGADO" &&
      estado !== "PENDIENTE_VERIFICACION" &&
      estado !== "APROBADO" &&
      (f.saldoPendiente ?? f.monto ?? 0) > 0
    )
  })

  // Estado de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando pagos...</p>
        </div>
      </div>
    )
  }

  // Sin sesión
  if (!usuario) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Sesión requerida
              </h2>
              <p className="text-gray-600 mb-6">
                Debes iniciar sesión para ver tus pagos.
              </p>
              <a
                href="/login"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Iniciar Sesión
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }


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
                <p className="text-2xl font-bold">{facturasPendientes.length}</p>
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
                <p className="text-2xl font-bold">${totalVerificado.toFixed(2)}</p>
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
                {facturasDisponibles.length === 0 ? (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-400">
                    ¡Genial! No tienes pagos pendientes.
                  </div>
                ) : (
                  <Select
                    value={formData.facturaId}
                    onValueChange={(v) => {
                      handleFormChange("facturaId", v)
                      // Auto-fill monto when factura is selected
                      const selectedFactura = facturasDisponibles.find(f => f.id.toString() === v)
                      if (selectedFactura) {
                        setFormData(prev => ({ ...prev, monto: selectedFactura.monto.toString() }))
                      }
                    }}
                  >
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue placeholder="Selecciona una factura pendiente" />
                    </SelectTrigger>
                    <SelectContent>
                      {facturasDisponibles.map((factura) => {
                        // Build descriptive label for factura
                        let label = ""
                        if (factura.envio) {
                          // Show shipment details if available
                          const tracking = factura.envio.trackingNumber || factura.envio.numeroTracking || 'Pendiente'
                          const desc = factura.envio.descripcion || 'Sin descripción'
                          label = `Envío #${tracking} (${desc}) - Costo de Envío: $${(factura.monto || 0).toFixed(2)}`
                        } else if (factura.descripcion) {
                          // Fallback to descripcion if no envio
                          label = `${factura.descripcion} - $${(factura.monto || 0).toFixed(2)}`
                        } else {
                          // Fallback to basic display
                          label = `Factura #${factura.numeroFactura || factura.id} - $${(factura.monto || 0).toFixed(2)}`
                        }
                        
                        return (
                          <SelectItem key={factura.id} value={factura.id.toString()}>
                            {label}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                )}
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
                disabled={
                  facturasDisponibles.length === 0 ||
                  !formData.facturaId ||
                  !formData.monto ||
                  !formData.metodoPago
                }
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
                  <TableHead className="text-muted-foreground">Método</TableHead>
                  <TableHead className="text-muted-foreground">Referencia</TableHead>
                  <TableHead className="text-muted-foreground text-right">Monto</TableHead>
                  <TableHead className="text-muted-foreground">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagosRecientes?.map((pago) => {
                  const estadoPago = pago.estado || "PENDIENTE"
                  const statusConfig = getStatusConfig(estadoPago)
                  const fechaPago = pago.fecha
                    ? new Date(pago.fecha).toLocaleDateString("es-EC", {
                        day: "2-digit",
                        month: "short",
                      })
                    : ""
                  return (
                    <TableRow key={pago.id} className="border-border/50">
                      <TableCell>
                        <span className="text-foreground text-sm">{fechaPago}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{pago.metodoPago || ""}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-foreground">{pago.referencia || ""}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-foreground">
                          ${(pago.monto || 0).toFixed(2)}
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
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
