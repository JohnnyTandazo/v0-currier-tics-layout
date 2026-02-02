"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Package,
  AlertTriangle,
  CheckCircle2,
  Scale,
  DollarSign,
  FileWarning,
  Send,
  RefreshCw,
  Check,
  Edit,
  Plane,
  Truck,
  DollarSign as DollarIcon,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PackageInfo {
  trackingId: string
  description: string
  customer: string
  prealerted: boolean
}

const statusOptions = [
  { value: "EN_MIAMI", label: "🏢 En Bodega Miami" },
  { value: "EN_TRANSITO", label: "✈️ En Tránsito a Ecuador" },
  { value: "ADUANA", label: "🛃 En Aduana" },
  { value: "CENTRO_DISTRIBUCION", label: "📦 En Centro de Distribución" },
  { value: "EN_RUTA", label: "🚚 En Ruta de Entrega" },
  { value: "ENTREGADO", label: "✅ Entregado" }
]

export function OperatorDashboard() {
  // Reception form state
  const [trackingNumber, setTrackingNumber] = useState("")
  const [weightLb, setWeightLb] = useState<string>("")
  const [weightKg, setWeightKg] = useState<string>("")
  const [price, setPrice] = useState<number>(0) // Valor FOB / precio
  const [packageFound, setPackageFound] = useState<any | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [incidenceReason, setIncidenceReason] = useState("")
  const [showIncidence, setShowIncidence] = useState(false)

  // Status update state
  const [statusTrackingNumber, setStatusTrackingNumber] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false)

  // ✅ NUEVOS ESTADOS PARA GESTIÓN
  const [pagosPendientes, setPagosPendientes] = useState<any[]>([])
  const [todosPaquetes, setTodosPaquetes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const handleSearch = async () => {
    if (!trackingNumber) return

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL no configurada")

      const res = await fetch(`${apiUrl}/api/paquetes`)
      if (!res.ok) throw new Error("Error en la respuesta del servidor")
      const paquetes = await res.json()

      const buscado = paquetes.find((p: any) => {
        const tn = String(p.trackingNumber || p.trackingId || "").toLowerCase()
        return tn === trackingNumber.toLowerCase()
      })

      if (buscado) {
        setPackageFound({
          id: buscado.id,
          trackingId: buscado.trackingNumber,
          description: buscado.descripcion,
          customer: buscado.usuario?.nombre || "-",
          status: buscado.estado,
          prealerted: true,
        })
        // Inicializar detalles editables (UX: strings para inputs)
        const libras = buscado.pesoLibras || 0
        setWeightLb(libras > 0 ? String(libras) : "")
        setWeightKg(libras > 0 ? (libras / 2.20462).toFixed(2) : "")
        setPrice(buscado.precio || 0)
        setCategory(buscado.categoria || null)
      } else {
        alert("Paquete no encontrado")
        setPackageFound(null)
      }
    } catch (error) {
      console.error("Error buscando paquete:", error)
      alert("Error conectando al backend. Revisa la consola.")
      setPackageFound(null)
    }
  }

  const calculateCategory = () => {
    const priceNum = Number(price) || 0
    // determine kg value from inputs
    let weightKgNum = 0
    if (weightKg && weightKg.trim() !== "") {
      weightKgNum = parseFloat(weightKg) || 0
    } else if (weightLb && weightLb.trim() !== "") {
      weightKgNum = (parseFloat(weightLb) || 0) / 2.20462
    }

    // Category logic based on weight (kg) and value
    if (weightKgNum <= 4 && priceNum <= 400) {
      setCategory("A")
    } else if (weightKgNum <= 4 && priceNum > 400) {
      setCategory("C")
    } else if (weightKgNum > 4) {
      setCategory("B")
    }
  }

  // UX: handlers for LB <-> KG conversion keeping empty string when cleared
  const handleLbChange = (e: any) => {
    const v = e.target.value
    if (!v) {
      setWeightLb("")
      setWeightKg("")
      return
    }
    // allow user to type; compute kg
    setWeightLb(v)
    const n = parseFloat(v)
    if (isNaN(n)) {
      setWeightKg("")
    } else {
      setWeightKg((n / 2.20462).toFixed(2))
    }
  }
  const handleKgChange = (e: any) => {
    const v = e.target.value
    if (!v) {
      setWeightKg("")
      setWeightLb("")
      return
    }
    setWeightKg(v)
    const n = parseFloat(v)
    if (isNaN(n)) {
      setWeightLb("")
    } else {
      setWeightLb((n * 2.20462).toFixed(2))
    }
  }

  const handleSubmitIncidence = () => {
    // Handle incidence submission
    setShowIncidence(false)
    setIncidenceReason("")
  }

  const handleStatusUpdate = async () => {
    if (!statusTrackingNumber || !selectedStatus) return

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL no configurada")

      // Ensure we have the package id
      let idToUpdate: any = packageFound?.id

      if (!idToUpdate) {
        // Fetch paquetes and find by tracking number
        const res = await fetch(`${apiUrl}/api/paquetes`)
        if (!res.ok) throw new Error("Error al obtener paquetes")
        const paquetes = await res.json()
        const found = paquetes.find((p: any) => {
          const tn = String(p.trackingNumber || p.trackingId || "").toLowerCase()
          return tn === statusTrackingNumber.toLowerCase()
        })
        if (!found) {
          alert("Paquete no encontrado para actualizar")
          return
        }
        idToUpdate = found.id
      }

      // PUT request to update detalles (estado + peso/precio/categoria)
      const body = {
        estado: selectedStatus,
        pesoLibras: parseFloat(weightLb) || 0,
        precio: Number(price) || 0,
        categoria: category || null,
      }

      const putRes = await fetch(`${apiUrl}/api/paquetes/${idToUpdate}/detalles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!putRes.ok) throw new Error("Error al actualizar detalles")
      const updated = await putRes.json()

      // Update UI: set success, update packageFound if it matches
      setStatusUpdateSuccess(true)
      setTimeout(() => setStatusUpdateSuccess(false), 2000)

      if (packageFound && String(packageFound.id) === String(idToUpdate)) {
        setPackageFound({
          ...packageFound,
          status: updated.estado || selectedStatus,
        })
        // reflect updated details locally (strings for inputs)
        if (updated.pesoLibras != null) {
          setWeightLb(String(updated.pesoLibras))
          setWeightKg((Number(updated.pesoLibras) / 2.20462).toFixed(2))
        }
        setPrice(updated.precio ?? price)
        setCategory(updated.categoria ?? category)
      }

      alert("Detalles actualizados correctamente")
      setStatusTrackingNumber("")
      setSelectedStatus("")
      
      // Recargar datos
      await cargarDatos()
    } catch (error) {
      console.error("Error actualizando detalles:", error)
      alert("No se pudo actualizar los detalles. Revisa la consola.")
    }
  }

  // ✅ CARGAR DATOS INICIALES
  const cargarDatos = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) return

      // Cargar todos los paquetes (endpoint de administración)
      const resPaquetes = await fetch(`${apiUrl}/api/paquetes/todos`)
      if (resPaquetes.ok) {
        const paquetes = await resPaquetes.json()
        setTodosPaquetes(Array.isArray(paquetes) ? paquetes : [])
      }

      // Cargar pagos pendientes (endpoint específico que ya filtra)
      const resPagos = await fetch(`${apiUrl}/api/pagos/pendientes`)
      if (resPagos.ok) {
        const text = await resPagos.text()
        if (text && text.trim() !== "") {
          const pagos = JSON.parse(text)
          // El backend ya devuelve solo pendientes, no necesitamos filtrar
          setPagosPendientes(Array.isArray(pagos) ? pagos : [])
        }
      }
    } catch (err) {
      console.error("Error cargando datos:", err)
    } finally {
      setLoading(false)
    }
  }

  // ✅ CONFIRMAR PAGO
  const confirmarPago = async (pagoId: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) return

      const response = await fetch(`${apiUrl}/api/pagos/${pagoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "APROBADO" })
      })

      if (response.ok) {
        alert("✅ Pago aprobado exitosamente")
        await cargarDatos()
      } else {
        alert("❌ Error al aprobar el pago")
      }
    } catch (err) {
      console.error("Error confirmando pago:", err)
      alert("❌ Error de conexión al aprobar pago")
    }
  }

  // ✅ EDITAR PAQUETE DESDE TABLA
  const editarPaquete = (paquete: any) => {
    setPackageFound({
      id: paquete.id,
      trackingId: paquete.trackingNumber || paquete.tracking,
      description: paquete.descripcion,
      customer: paquete.usuario?.nombre || "-",
      status: paquete.estado,
      prealerted: true,
    })
    setTrackingNumber(paquete.trackingNumber || paquete.tracking || "")
    setStatusTrackingNumber(paquete.trackingNumber || paquete.tracking || "")
    const libras = paquete.pesoLibras || 0
    setWeightLb(libras > 0 ? String(libras) : "")
    setWeightKg(libras > 0 ? (libras / 2.20462).toFixed(2) : "")
    setPrice(paquete.precio || 0)
    setCategory(paquete.categoria || null)
    setSelectedStatus(paquete.estado || "")
    
    // Scroll al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ✅ DEDUCIR TIPO DE PAQUETE
  const deducirTipo = (tracking: string): "NACIONAL" | "INTERNACIONAL" => {
    const trackingUpper = tracking.toUpperCase()
    if (trackingUpper.startsWith("NAC-") || trackingUpper.startsWith("SERVI-") || trackingUpper.startsWith("TRK-")) {
      return "NACIONAL"
    }
    if (trackingUpper.startsWith("USA-") || trackingUpper.startsWith("TBA-") || /^\d{10,}$/.test(tracking)) {
      return "INTERNACIONAL"
    }
    return "INTERNACIONAL"
  }

  // ✅ CARGAR AL MONTAR
  useEffect(() => {
    cargarDatos()
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Reception Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Recepción de Paquetes
            </CardTitle>
            <CardDescription>
              Buscar y registrar paquetes entrantes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tracking Search */}
            <div className="space-y-2">
              <Label htmlFor="tracking">Número de Guía</Label>
              <div className="flex gap-2">
                <Input
                  id="tracking"
                  placeholder="Ingrese número de guía..."
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSearch}>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </Button>
              </div>
            </div>

            {/* Package Info Display */}
            {packageFound && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-medium">
                    {packageFound.trackingId}
                  </span>
                  {packageFound.prealerted && (
                    <Badge className="bg-success text-success-foreground">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Pre-alertado
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p><strong>Cliente:</strong> {packageFound.customer}</p>
                  <p><strong>Descripción:</strong> {packageFound.description}</p>
                </div>
              </div>
            )}

            <Separator />

            {/* Weight Inputs: LB <-> KG (UX strings) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Peso
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  id="weightLb"
                  type="number"
                  step="0.1"
                  placeholder="Libras"
                  value={weightLb}
                  onChange={(e) => { handleLbChange(e); setCategory(null) }}
                />
                <Input
                  id="weightKg"
                  type="number"
                  step="0.01"
                  placeholder="Kilos"
                  value={weightKg}
                  onChange={(e) => { handleKgChange(e); setCategory(null) }}
                />
              </div>
            </div>

            {/* Value Input */}
            <div className="space-y-2">
              <Label htmlFor="price" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor FOB ($)
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => {
                  setPrice(parseFloat(e.target.value) || 0)
                  setCategory(null)
                }}
              />
            </div>
            {/* Calculate Button */}
            <Button
              onClick={calculateCategory}
              variant="secondary"
              className="w-full"
              disabled={!weightLb || (parseFloat(weightLb) || 0) <= 0 || price <= 0}
            >
              Calcular Categoría
            </Button>
          </CardContent>
        </Card>

        {/* Status Update Card - NEW */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Actualizar Estado
            </CardTitle>
            <CardDescription>
              Cambiar el estado de un paquete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tracking Number Input */}
            <div className="space-y-2">
              <Label htmlFor="statusTracking">Número de Guía</Label>
              <div className="flex gap-2">
                <Input
                  id="statusTracking"
                  placeholder="Ingrese número de guía..."
                  value={statusTrackingNumber}
                  onChange={(e) => setStatusTrackingNumber(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Status Select */}
            <div className="space-y-2">
              <Label htmlFor="status">Nuevo Estado</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Seleccione un estado..." />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Detalles: Peso / Precio / Categoría (editable antes de actualizar estado) */}
            <div className="space-y-2">
              <Label htmlFor="statusWeight">Peso (Libras)</Label>
              <Input
                id="statusWeight"
                type="number"
                step="0.1"
                placeholder="0.00"
                value={weightLb}
                onChange={(e) => handleLbChange(e)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="statusPrice">Valor FOB ($)</Label>
              <Input
                id="statusPrice"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="statusCategory">Categoría</Label>
              <Select value={category || ""} onValueChange={(v) => setCategory(v || null)}>
                <SelectTrigger id="statusCategory">
                  <SelectValue placeholder="Seleccione categoría..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="4x4">4x4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Update Button */}
            <Button
              onClick={handleStatusUpdate}
              className="w-full"
              disabled={!statusTrackingNumber || !selectedStatus}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar Estado
            </Button>

            {/* Success Message */}
            {statusUpdateSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-success/10 p-4 text-success">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">Estado actualizado correctamente</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Display */}
        <Card>
          <CardHeader>
            <CardTitle>Categoría del Paquete</CardTitle>
            <CardDescription>
              Basado en peso y valor declarado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {category ? (
              <div className="space-y-4">
                <div
                  className={`flex items-center justify-center rounded-lg p-8 ${
                    category === "A"
                      ? "bg-success/10 border-2 border-success"
                      : category === "B"
                        ? "bg-warning/10 border-2 border-warning"
                        : "bg-destructive/10 border-2 border-destructive"
                  }`}
                >
                  <div className="text-center">
                    <div
                      className={`text-5xl font-bold ${
                        category === "A"
                          ? "text-success"
                          : category === "B"
                            ? "text-warning-foreground"
                            : "text-destructive"
                      }`}
                    >
                      Categoría {category}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {category === "A" && "Procesamiento estándar - Sin impuestos adicionales"}
                      {category === "B" && "Regla 4x4 - Excede límite de peso"}
                      {category === "C" && "Requiere cálculo de impuestos"}
                    </p>
                  </div>
                </div>

                {category === "B" && (
                  <div className="flex items-start gap-3 rounded-lg bg-warning/10 p-4">
                    <AlertTriangle className="h-5 w-5 text-warning-foreground shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-warning-foreground">Regla 4x4 Aplicada</p>
                      <p className="text-muted-foreground">
                        El paquete excede el límite de 4kg. Se requiere procesamiento adicional para despacho aduanero.
                      </p>
                    </div>
                  </div>
                )}

                {category === "C" && (
                  <div className="flex items-start gap-3 rounded-lg bg-destructive/10 p-4">
                    <FileWarning className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-destructive">Cálculo de Impuestos Requerido</p>
                      <p className="text-muted-foreground">
                        El valor declarado excede $400 USD. Se calcularán impuestos de importación.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Package className="h-12 w-12 mb-4 opacity-50" />
                <p>Ingrese peso y valor para calcular la categoría</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incidence Reporting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Reportar Incidencia
            </CardTitle>
            <CardDescription>
              Marcar paquete como retenido o reportar problemas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showIncidence ? (
              <Button
                variant="outline"
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
                onClick={() => setShowIncidence(true)}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Marcar como Retenido
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo de Retención</Label>
                  <Textarea
                    id="reason"
                    placeholder="Ingrese el motivo de la retención..."
                    value={incidenceReason}
                    onChange={(e) => setIncidenceReason(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowIncidence(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmitIncidence}
                    className="flex-1 bg-destructive hover:bg-destructive/90"
                    disabled={!incidenceReason}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Enviar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ✅ SECCIÓN NUEVA: PAGOS POR VALIDAR */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarIcon className="h-5 w-5 text-green-600" />
            Pagos por Validar (El Cajero)
          </CardTitle>
          <CardDescription>
            Aprueba los pagos pendientes de verificación
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-4">Cargando...</p>
          ) : pagosPendientes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay pagos pendientes de validación</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagosPendientes.map((pago) => (
                  <TableRow key={pago.id}>
                    <TableCell className="font-mono text-sm">{pago.id}</TableCell>
                    <TableCell className="font-semibold">${(pago.monto || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-xs">{pago.metodoPago || "-"}</TableCell>
                    <TableCell className="font-mono text-xs">{pago.referencia || "-"}</TableCell>
                    <TableCell className="text-xs">
                      {pago.fecha ? new Date(pago.fecha).toLocaleDateString("es-EC") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => confirmarPago(pago.id)}
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Confirmar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ✅ SECCIÓN NUEVA: BANDEJA DE ENTRADA GLOBAL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Todos los Paquetes (Torre de Control)
          </CardTitle>
          <CardDescription>
            Gestiona todos los paquetes en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-4">Cargando...</p>
          ) : todosPaquetes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay paquetes registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado Actual</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todosPaquetes.map((pkg) => {
                    const tracking = pkg.trackingNumber || pkg.tracking || "-"
                    const tipo = deducirTipo(tracking)
                    return (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-mono text-sm">{pkg.id}</TableCell>
                        <TableCell className="font-mono text-sm font-medium">{tracking}</TableCell>
                        <TableCell className="text-sm">{pkg.usuario?.nombre || pkg.cliente || "-"}</TableCell>
                        <TableCell>
                          {tipo === "NACIONAL" ? (
                            <Badge className="bg-green-600 text-white gap-1">
                              <Truck className="h-3 w-3" />
                              Nacional
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-600 text-white gap-1">
                              <Plane className="h-3 w-3" />
                              Internacional
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{pkg.estado || "SIN_ESTADO"}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editarPaquete(pkg)}
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
