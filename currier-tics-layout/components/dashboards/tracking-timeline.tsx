"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Package,
  Warehouse,
  Plane,
  Shield,
  Building2,
  CheckCircle2,
  Clock,
  Truck,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface TrackingTimelineProps {
  trackingId: string
  onBack: () => void
}

const stateToStepMap: Record<string, number> = {
  "PRE_ALERTADO": 0,
  "EN_MIAMI": 1,
  "EN_TRANSITO": 2,
  "ADUANA": 3,
  "CENTRO_DISTRIBUCION": 4,
  "EN_RUTA": 5,
  "ENTREGADO": 6,
}

export function TrackingTimeline({ trackingId, onBack }: TrackingTimelineProps) {
  const [packageData, setPackageData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPackage = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL
        if (!apiUrl) {
          throw new Error("NEXT_PUBLIC_API_URL no está configurada")
        }

        const url = `${apiUrl}/api/paquetes/track/${encodeURIComponent(trackingId)}`
        console.log("Buscando paquete en:", url)

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
        console.log("Paquete encontrado:", data)
        setPackageData(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error desconocido"
        console.error("Error al buscar paquete:", errorMessage)
        setError(errorMessage)
        setPackageData(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPackage()
  }, [trackingId])

  // Build timeline steps based on package state
  const buildTimelineSteps = () => {
    const steps = [
      {
        id: 1,
        title: "Pre-alertado",
        description: "Paquete registrado en el sistema",
        icon: Package,
        date: packageData?.prealertedAt ? new Date(packageData.prealertedAt).toLocaleDateString("es-ES") : "Pendiente",
        time: packageData?.prealertedAt ? new Date(packageData.prealertedAt).toLocaleTimeString("es-ES") : "",
        status: "pending",
        location: "En línea",
      },
      {
        id: 2,
        title: "En Bodega Miami",
        description: "Paquete recibido en instalaciones de Miami",
        icon: Warehouse,
        date: packageData?.receivedAt ? new Date(packageData.receivedAt).toLocaleDateString("es-ES") : "Pendiente",
        time: packageData?.receivedAt ? new Date(packageData.receivedAt).toLocaleTimeString("es-ES") : "",
        status: "pending",
        location: "Miami, FL",
      },
      {
        id: 3,
        title: "En Tránsito",
        description: "Salió de Miami - En camino a Ecuador",
        icon: Plane,
        date: packageData?.inTransitAt ? new Date(packageData.inTransitAt).toLocaleDateString("es-ES") : "Pendiente",
        time: packageData?.inTransitAt ? new Date(packageData.inTransitAt).toLocaleTimeString("es-ES") : "",
        status: "pending",
        location: "En vuelo",
      },
      {
        id: 4,
        title: "En Aduana",
        description: "Procesando en aduana de Ecuador",
        icon: Shield,
        date: packageData?.customsAt ? new Date(packageData.customsAt).toLocaleDateString("es-ES") : "Pendiente",
        time: packageData?.customsAt ? new Date(packageData.customsAt).toLocaleTimeString("es-ES") : "",
        status: "pending",
        location: "Guayaquil, EC",
      },
      {
        id: 5,
        title: "En Centro de Distribución",
        description: "Procesando en centro de distribución local",
        icon: Building2,
        date: packageData?.distributionAt ? new Date(packageData.distributionAt).toLocaleDateString("es-ES") : "Pendiente",
        time: packageData?.distributionAt ? new Date(packageData.distributionAt).toLocaleTimeString("es-ES") : "",
        status: "pending",
        location: "Quito, EC",
      },
      {
        id: 6,
        title: "En Ruta",
        description: "Paquete en camino al destinatario",
        icon: Truck,
        date: packageData?.onRouteAt ? new Date(packageData.onRouteAt).toLocaleDateString("es-ES") : "Pendiente",
        time: packageData?.onRouteAt ? new Date(packageData.onRouteAt).toLocaleTimeString("es-ES") : "",
        status: "pending",
        location: "En ruta",
      },
      {
        id: 7,
        title: "Entregado",
        description: "Paquete entregado al destinatario",
        icon: CheckCircle2,
        date: packageData?.deliveredAt ? new Date(packageData.deliveredAt).toLocaleDateString("es-ES") : "Pendiente",
        time: packageData?.deliveredAt ? new Date(packageData.deliveredAt).toLocaleTimeString("es-ES") : "",
        status: "pending",
        location: "Destino final",
      },
    ];

    if (packageData?.estado) {
      const currentStepIndex = stateToStepMap[packageData.estado] ?? -1;

      // Mark steps as completed up to the current state
      steps.forEach((step, index) => {
        if (index < currentStepIndex) {
          step.status = "completed";
        } else if (index === currentStepIndex) {
          step.status = "current";
        } else {
          step.status = "pending";
        }
      });
    }

    return steps;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Cargando datos del paquete...</p>
      </div>
    )
  }

  if (error || !packageData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-destructive font-semibold">{error || "Paquete no encontrado"}</p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    )
  }

  const timelineSteps = buildTimelineSteps()
  const currentStepIndex = timelineSteps.findIndex(
    (step) => step.status === "current"
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Seguimiento de Paquete</h1>
            <p className="text-muted-foreground font-mono">{trackingId}</p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className="bg-accent text-accent-foreground w-fit text-sm px-4 py-1.5"
        >
          <Clock className="mr-2 h-4 w-4" />
          Estado: {packageData?.estado || "Desconocido"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Progreso del Envío</CardTitle>
            <CardDescription>
              Sigue el viaje de tu paquete desde el origen hasta el destino
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {timelineSteps.map((step, index) => {
                const isCompleted = step.status === "completed"
                const isCurrent = step.status === "current"
                const isPending = step.status === "pending"
                const isLast = index === timelineSteps.length - 1

                return (
                  <div key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
                    {/* Vertical Line */}
                    {!isLast && (
                      <div
                        className={`absolute left-5 top-10 h-[calc(100%-2rem)] w-0.5 ${
                          isCompleted || isCurrent
                            ? "bg-primary"
                            : "bg-border"
                        }`}
                      />
                    )}

                    {/* Icon */}
                    <div
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : isCurrent
                            ? "bg-accent text-accent-foreground ring-4 ring-accent/30"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <step.icon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className={`font-semibold ${
                            isPending ? "text-muted-foreground" : ""
                          }`}
                        >
                          {step.title}
                        </h3>
                        {isCurrent && (
                          <Badge className="bg-accent text-accent-foreground">
                            Actual
                          </Badge>
                        )}
                        {isCompleted && (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {step.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {step.date} {step.time && `a las ${step.time}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {step.location}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Package Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Paquete</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <DetailRow label="Descripción" value={packageData?.descripcion || "-"} />
              <Separator />
              <DetailRow label="Peso" value={`${packageData?.pesoLibras || 0} lb`} />
              <Separator />
              <DetailRow label="Valor Declarado" value={`$${packageData?.precio != null ? packageData.precio.toFixed(2) : "0.00"}`} />
              <Separator />
              <DetailRow label="Cliente" value={packageData?.usuario?.nombre || "-"} />
              <Separator />
              <DetailRow label="Estado" value={packageData?.estado || "-"} />
            </div>

            <div className="pt-4">
              <div className="rounded-lg bg-primary/10 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <Package className="h-5 w-5" />
                  <span className="font-semibold">Progreso</span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Completado</span>
                    <span className="font-medium">
                      {packageData?.estado === "PRE_ALERTADO" 
                        ? "5%" 
                        : `${Math.round(((currentStepIndex + 1) / timelineSteps.length) * 100)}%`}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: packageData?.estado === "PRE_ALERTADO" 
                          ? "5%" 
                          : `${((currentStepIndex + 1) / timelineSteps.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}
