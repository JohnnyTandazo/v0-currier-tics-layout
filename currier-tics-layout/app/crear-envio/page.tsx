"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { withAuthHeaders } from "@/lib/authHeaders"

type Direccion = {
  id: string
  etiqueta: string
  direccion: string
  ciudad: string
}

const pasos = [
  "Origen",
  "Destino",
  "Paquete",
  "Resumen",
] as const

export default function CrearEnvioPage() {
  const [pasoActual, setPasoActual] = useState(0)
  const [direcciones, setDirecciones] = useState<Direccion[]>([])
  const [direccionSeleccionada, setDireccionSeleccionada] = useState<string>("")

  const [destino, setDestino] = useState({
    nombre: "",
    cedula: "",
    ciudad: "",
    direccion: "",
    telefono: "",
  })

  const [paquete, setPaquete] = useState({
    descripcion: "",
    peso: "",
    valor: "",
  })

  useEffect(() => {
    const fetchDirecciones = async () => {
      try {
        const response = await fetch("/api/usuarios/me/direcciones", {
          method: "GET",
          headers: withAuthHeaders({ "Content-Type": "application/json" }),
        })

        if (!response.ok) {
          throw new Error("No se pudieron cargar direcciones")
        }

        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          setDirecciones(
            data.map((item: any) => ({
              id: String(item.id),
              etiqueta: item.etiqueta || "Dirección",
              direccion: item.direccion || item.address || "Sin dirección",
              ciudad: item.ciudad || item.city || "Sin ciudad",
            }))
          )
          return
        }

        throw new Error("Sin direcciones")
      } catch {
        setDirecciones([
          {
            id: "1",
            etiqueta: "Casa",
            direccion: "Av. Principal 123",
            ciudad: "Quito",
          },
          {
            id: "2",
            etiqueta: "Oficina",
            direccion: "Calle Comercio 456",
            ciudad: "Guayaquil",
          },
        ])
      }
    }

    fetchDirecciones()
  }, [])

  const totalEstimado = useMemo(() => {
    const peso = Number(paquete.peso || 0)
    const valor = Number(paquete.valor || 0)
    const base = 2.5
    const variablePeso = peso * 1.2
    const seguro = valor * 0.01
    return (base + variablePeso + seguro).toFixed(2)
  }, [paquete.peso, paquete.valor])

  const pasoValido = useMemo(() => {
    if (pasoActual === 0) return Boolean(direccionSeleccionada)
    if (pasoActual === 1) {
      return (
        destino.nombre &&
        destino.cedula &&
        destino.ciudad &&
        destino.direccion &&
        destino.telefono
      )
    }
    if (pasoActual === 2) {
      return paquete.descripcion && paquete.peso && paquete.valor
    }
    return true
  }, [pasoActual, direccionSeleccionada, destino, paquete])

  const avanzar = () => {
    if (pasoActual < pasos.length - 1) {
      setPasoActual((prev) => prev + 1)
    }
  }

  const retroceder = () => {
    if (pasoActual > 0) {
      setPasoActual((prev) => prev - 1)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Crear Envío</h1>
          <p className="text-muted-foreground">Completa los pasos para generar tu guía</p>
        </div>
        <Badge variant="secondary">Paso {pasoActual + 1} de {pasos.length}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wizard de Envío</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            {pasos.map((paso, index) => (
              <div
                key={paso}
                className={`rounded-md border px-3 py-2 text-sm ${
                  index === pasoActual
                    ? "border-primary bg-primary/10 font-medium"
                    : "border-border text-muted-foreground"
                }`}
              >
                {index + 1}. {paso}
              </div>
            ))}
          </div>

          <Separator />

          {pasoActual === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Origen</h2>
              <Select value={direccionSeleccionada} onValueChange={setDireccionSeleccionada}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una dirección guardada" />
                </SelectTrigger>
                <SelectContent>
                  {direcciones.map((direccion) => (
                    <SelectItem key={direccion.id} value={direccion.id}>
                      {direccion.etiqueta} - {direccion.direccion}, {direccion.ciudad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {pasoActual === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Destino</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  placeholder="Nombre del destinatario"
                  value={destino.nombre}
                  onChange={(e) => setDestino({ ...destino, nombre: e.target.value })}
                />
                <Input
                  placeholder="Cédula"
                  value={destino.cedula}
                  onChange={(e) => setDestino({ ...destino, cedula: e.target.value })}
                />
                <Input
                  placeholder="Ciudad"
                  value={destino.ciudad}
                  onChange={(e) => setDestino({ ...destino, ciudad: e.target.value })}
                />
                <Input
                  placeholder="Dirección"
                  value={destino.direccion}
                  onChange={(e) => setDestino({ ...destino, direccion: e.target.value })}
                />
                <Input
                  placeholder="Teléfono"
                  value={destino.telefono}
                  onChange={(e) => setDestino({ ...destino, telefono: e.target.value })}
                />
              </div>
            </div>
          )}

          {pasoActual === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Paquete</h2>
              <Textarea
                placeholder="Descripción del contenido"
                value={paquete.descripcion}
                onChange={(e) => setPaquete({ ...paquete, descripcion: e.target.value })}
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  placeholder="Peso (lb)"
                  type="number"
                  value={paquete.peso}
                  onChange={(e) => setPaquete({ ...paquete, peso: e.target.value })}
                />
                <Input
                  placeholder="Valor declarado (USD)"
                  type="number"
                  value={paquete.valor}
                  onChange={(e) => setPaquete({ ...paquete, valor: e.target.value })}
                />
              </div>
            </div>
          )}

          {pasoActual === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Resumen</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card className="border-dashed">
                  <CardContent className="space-y-2 pt-6">
                    <p className="text-sm text-muted-foreground">Dirección origen</p>
                    <p className="font-medium">
                      {direcciones.find((d) => d.id === direccionSeleccionada)?.direccion || "-"}
                    </p>
                    <p className="text-sm text-muted-foreground">Ciudad</p>
                    <p className="font-medium">
                      {direcciones.find((d) => d.id === direccionSeleccionada)?.ciudad || "-"}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardContent className="space-y-2 pt-6">
                    <p className="text-sm text-muted-foreground">Destinatario</p>
                    <p className="font-medium">{destino.nombre || "-"}</p>
                    <p className="text-sm text-muted-foreground">Ciudad</p>
                    <p className="font-medium">{destino.ciudad || "-"}</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardContent className="flex items-center justify-between pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total estimado</p>
                    <p className="text-2xl font-semibold">${totalEstimado}</p>
                  </div>
                  <Button disabled={!pasoValido}>Generar Guía</Button>
                </CardContent>
              </Card>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={retroceder} disabled={pasoActual === 0}>
              Atrás
            </Button>
            <Button onClick={avanzar} disabled={!pasoValido || pasoActual === pasos.length - 1}>
              Continuar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
