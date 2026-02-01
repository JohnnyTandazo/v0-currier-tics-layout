"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  ClipboardList,
  Shield,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

interface EnvioTimelineProps {
  envioId: string
  onBack: () => void
}

const stateToStepMap: Record<string, number> = {
  PROCESANDO: 0,
  EN_ADUANA: 1,
  EN_TRANSITO: 2,
  RETENIDO: 3,
  ENTREGADO: 4,
}

const estadosDisponibles = [
  "PROCESANDO",
  "EN_ADUANA",
  "EN_TRANSITO",
  "RETENIDO",
  "ENTREGADO",
] as const

export function EnvioTimeline({ envioId, onBack }: EnvioTimelineProps) {
  const [envio, setEnvio] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>("CLIENTE")
  const [currentEstado, setCurrentEstado] = useState<string>("PROCESANDO")
  const [isUpdatingEstado, setIsUpdatingEstado] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchEnvio = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const url = `/api/envios/${encodeURIComponent(envioId)}`
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            errorData.message || `Error ${response.status}: ${response.statusText}`
          )
        }

        const data = await response.json()
        setEnvio(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error desconocido"
        setError(errorMessage)
        setEnvio(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEnvio()
  }, [envioId])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const savedUser = localStorage.getItem("usuario")
    if (!savedUser) {
      return
    }

    try {
      const parsedUser = JSON.parse(savedUser)
      const rol = parsedUser?.rol || parsedUser?.role || "CLIENTE"
      setUserRole(String(rol).toUpperCase())
    } catch {
      setUserRole("CLIENTE")
    }
  }, [])

  useEffect(() => {
    if (envio?.estado) {
      setCurrentEstado(envio.estado)
    }
  }, [envio])

  const canEditEstado = userRole === "ADMIN" || userRole === "OPERADOR"

  const handleEstadoChange = async (nuevoEstado: string) => {
    if (!envioId || isUpdatingEstado || nuevoEstado === currentEstado) {
      return
    }

    setIsUpdatingEstado(true)
    try {
      const url = `/api/envios/${encodeURIComponent(envioId)}/estado?nuevoEstado=${encodeURIComponent(nuevoEstado)}`
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const text = await response.text().catch(() => "")
        throw new Error(text || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json().catch(() => null)
      setEnvio((prev: any) => ({
        ...(prev || {}),
        ...(data || {}),
        estado: nuevoEstado,
      }))
      setCurrentEstado(nuevoEstado)
      toast({
        title: "Estado actualizado",
        description: `Nuevo estado: ${nuevoEstado}`,
      })
    } catch (err) {
      console.error("❌ Error al actualizar estado:", err)
      setCurrentEstado(envio?.estado || "PROCESANDO")
      toast({
        title: "No se pudo actualizar",
        description: "Intenta nuevamente en unos segundos.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingEstado(false)
    }
  }

  const timelineSteps = useMemo(() => {
    const steps = [
      {
        id: 1,
        title: "Procesando",
        description: "Envío registrado y en preparación",
        icon: ClipboardList,
        status: "pending",
      },
      {
        id: 2,
        title: "En Aduana",
        description: "Procesamiento en aduana",
        icon: Shield,
        status: "pending",
      },
      {
        id: 3,
        title: "En Tránsito",
        description: "Envío en camino",
        icon: Truck,
        status: "pending",
      },
      {
        id: 4,
        title: "Retenido",
        description: "Envío retenido para revisión",
        icon: AlertTriangle,
        status: "pending",
      },
      {
        id: 5,
        title: "Entregado",
        description: "Envío entregado al destinatario",
        icon: CheckCircle2,
        status: "pending",
      },
    ]

    if (envio?.estado) {
      const currentStepIndex = stateToStepMap[envio.estado] ?? -1
      steps.forEach((step, index) => {
        if (index < currentStepIndex) {
          step.status = "completed"
        } else if (index === currentStepIndex) {
          step.status = "current"
        } else {
          step.status = "pending"
        }
      })
    }

    return steps
  }, [envio])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Cargando datos del envío...</p>
      </div>
    )
  }

  if (error || !envio) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-destructive font-semibold">{error || "Envío no encontrado"}</p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    )
  }

  const currentStepIndex = timelineSteps.findIndex(
    (step) => step.status === "current"
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Seguimiento de Envío</h1>
            <p className="text-muted-foreground font-mono">ID: {envioId}</p>
          </div>
        </div>
        {canEditEstado ? (
          <div className="flex items-center gap-2 rounded-md border border-border bg-accent/40 px-3 py-1.5 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Estado:</span>
            <select
              className="bg-transparent text-sm font-medium outline-none"
              value={currentEstado}
              onChange={(event) => handleEstadoChange(event.target.value)}
              disabled={isUpdatingEstado}
            >
              {estadosDisponibles.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <Badge
            variant="secondary"
            className="bg-accent text-accent-foreground w-fit text-sm px-4 py-1.5"
          >
            <Clock className="mr-2 h-4 w-4" />
            Estado: {envio?.estado || "Desconocido"}
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles del envío</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Tracking</p>
            <p className="font-medium">{envio?.numeroTracking || envio?.trackingId || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Categoría</p>
            <p className="font-medium">{envio?.categoria || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Peso (lb)</p>
            <p className="font-medium">{envio?.pesoLibras ?? envio?.peso ?? "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valor declarado</p>
            <p className="font-medium">{envio?.valorDeclarado ?? "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Fecha creación</p>
            <p className="font-medium">{
              envio?.fechaCreacion
                ? new Date(envio.fechaCreacion).toLocaleString("es-ES")
                : "N/A"
            }</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Destinatario</p>
            <div>
              <p className="font-medium">{envio?.destinatarioNombre || envio?.destinatario || "Sin nombre"}</p>
              <p className="text-sm text-muted-foreground">{envio?.destinatarioCiudad || "Sin ciudad"}</p>
              {envio?.destinatarioDireccion && (
                <p className="text-sm text-muted-foreground">{envio.destinatarioDireccion}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="space-y-4">
        {timelineSteps.map((step, index) => {
          const Icon = step.icon
          const isActive = index === currentStepIndex
          const isCompleted = step.status === "completed"
          return (
            <div
              key={step.id}
              className="flex items-start gap-4"
            >
              <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border ${
                isCompleted
                  ? "bg-primary text-primary-foreground border-primary"
                  : isActive
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-muted text-muted-foreground border-border"
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{step.title}</p>
                  {isActive && (
                    <Badge variant="secondary">Actual</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
