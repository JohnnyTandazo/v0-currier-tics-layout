"use client"

import { useState } from "react"
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
} from "lucide-react"
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

  const handleSearch = async () => {
    if (!trackingNumber) return

    try {
      const res = await fetch("http://localhost:8080/api/paquetes")
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
      // Ensure we have the package id
      let idToUpdate: any = packageFound?.id

      if (!idToUpdate) {
        // Fetch paquetes and find by tracking number
        const res = await fetch("http://localhost:8080/api/paquetes")
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

      const putRes = await fetch(`http://localhost:8080/api/paquetes/${idToUpdate}/detalles`, {
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
    } catch (error) {
      console.error("Error actualizando detalles:", error)
      alert("No se pudo actualizar los detalles. Revisa la consola.")
    }
  }

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
    </div>
  )
}
