"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Home,
  Package,
  User,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

interface Direccion {
  id: string
  alias: string
  callePrincipal: string
  calleSecundaria?: string
  ciudad: string
  telefono: string
  referencia?: string
  esPrincipal?: boolean
}

interface FormEnvio {
  // Paso 1: Remitente
  direccionOrigenId: string
  // Paso 2: Destinatario
  cedulaDestinatario: string
  nombreDestinatario: string
  telefonoDestinatario: string
  ciudadDestino: string
  direccionDestino: string
  // Paso 3: Paquete
  descripcion: string
  peso: string
  valorDeclarado: string
}

const pasos = ["Remitente", "Destinatario", "Paquete", "Confirmación"] as const

export default function CrearEnvioPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [pasoActual, setPasoActual] = useState(0)
  const [direcciones, setDirecciones] = useState<Direccion[]>([])
  const [isLoadingDirecciones, setIsLoadingDirecciones] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const {
    control,
    watch,
    handleSubmit,
    formState: { errors },
    trigger,
    reset,
  } = useForm<FormEnvio>({
    mode: "onChange",
    defaultValues: {
      direccionOrigenId: "",
      cedulaDestinatario: "",
      nombreDestinatario: "",
      telefonoDestinatario: "",
      ciudadDestino: "",
      direccionDestino: "",
      descripcion: "",
      peso: "",
      valorDeclarado: "",
    },
  })

  const formValues = watch()

  const direccionSeleccionada = useMemo(() => {
    if (!formValues.direccionOrigenId) return null
    return direcciones.find((d) => d.id === formValues.direccionOrigenId)
  }, [formValues.direccionOrigenId, direcciones])

  const costoEstimado = useMemo(() => {
    const peso = Number(formValues.peso || 0)
    const valor = Number(formValues.valorDeclarado || 0)
    const costoBase = 2.5
    const costoPeso = peso * 1.2
    const seguro = valor * 0.01
    return (costoBase + costoPeso + seguro).toFixed(2)
  }, [formValues.peso, formValues.valorDeclarado])

  useEffect(() => {
    const cargarDirecciones = async () => {
      setIsLoadingDirecciones(true)
      try {
        const response = await fetch("/api/direcciones", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        if (!response.ok) {
          throw new Error("No se pudieron cargar las direcciones")
        }

        const data = await response.json()
        if (Array.isArray(data)) {
          setDirecciones(data)
          // Auto-seleccionar la primera dirección principal o la primera disponible
          const principal = data.find((d) => d.esPrincipal)
          if (principal) {
            reset({ ...formValues, direccionOrigenId: principal.id })
          }
        }
      } catch (error) {
        console.error("Error al cargar direcciones:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar tus direcciones guardadas",
          variant: "destructive",
        })
      } finally {
        setIsLoadingDirecciones(false)
      }
    }

    cargarDirecciones()
  }, [])

  const validarPaso = useCallback(async (): Promise<boolean> => {
    if (pasoActual === 0) {
      return await trigger("direccionOrigenId")
    }
    if (pasoActual === 1) {
      return await trigger([
        "cedulaDestinatario",
        "nombreDestinatario",
        "telefonoDestinatario",
        "ciudadDestino",
        "direccionDestino",
      ])
    }
    if (pasoActual === 2) {
      return await trigger(["descripcion", "peso", "valorDeclarado"])
    }
    return true
  }, [pasoActual, trigger])

  const avanzar = async () => {
    const esValido = await validarPaso()
    if (esValido && pasoActual < pasos.length - 1) {
      setPasoActual((prev) => prev + 1)
    }
  }

  const retroceder = () => {
    if (pasoActual > 0) {
      setPasoActual((prev) => prev - 1)
    }
  }

  const onSubmit = async (data: FormEnvio) => {
    setIsSaving(true)
    try {
      const payload = {
        direccionOrigenId: data.direccionOrigenId,
        cedulaDestinatario: data.cedulaDestinatario,
        nombreDestinatario: data.nombreDestinatario,
        telefonoDestinatario: data.telefonoDestinatario,
        ciudadDestino: data.ciudadDestino,
        direccionDestino: data.direccionDestino,
        descripcion: data.descripcion,
        pesoLibras: Number(data.peso),
        valorDeclarado: Number(data.valorDeclarado),
      }

      const response = await fetch("/api/envios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const text = await response.text().catch(() => "")
        throw new Error(text || "No se pudo crear el envío")
      }

      const envioCreado = await response.json().catch(() => null)

      toast({
        title: "✅ Envío creado",
        description: `Guía #${envioCreado?.id || "Generada"} generada correctamente.`,
      })

      router.push("/dashboard/envios")
    } catch (error) {
      toast({
        title: "Error al crear envío",
        description: error instanceof Error ? error.message : "Intenta nuevamente",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Crear Envío</h1>
          <p className="text-muted-foreground">Completa los pasos para generar tu guía</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generador de Envíos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
            {pasos.map((paso, index) => (
              <div
                key={paso}
                className={`rounded-md border px-3 py-2 text-center text-sm transition-all ${
                  index === pasoActual
                    ? "border-primary bg-primary/10 font-semibold text-primary"
                    : index < pasoActual
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-border text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  {index < pasoActual ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                  <span className="hidden sm:inline">{paso}</span>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* PASO 1: REMITENTE */}
            {pasoActual === 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Home className="h-5 w-5" />
                  <span>¿Desde dónde envías?</span>
                </div>

                {isLoadingDirecciones ? (
                  <div className="rounded-md border border-border p-4 text-sm text-muted-foreground">
                    Cargando direcciones...
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="direccionOrigen">Seleccionar dirección</Label>
                    <Controller
                      name="direccionOrigenId"
                      control={control}
                      rules={{ required: "Debes seleccionar una dirección" }}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger
                            id="direccionOrigen"
                            className={errors.direccionOrigenId ? "border-destructive" : ""}
                          >
                            <SelectValue placeholder="Elige una dirección guardada" />
                          </SelectTrigger>
                          <SelectContent>
                            {direcciones.map((dir) => (
                              <SelectItem key={dir.id} value={dir.id}>
                                {dir.alias} - {dir.callePrincipal}, {dir.ciudad}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.direccionOrigenId && (
                      <p className="text-sm text-destructive">
                        {errors.direccionOrigenId.message}
                      </p>
                    )}
                  </div>
                )}

                {direccionSeleccionada && (
                  <Card className="border-dashed bg-muted/50">
                    <CardContent className="space-y-2 pt-4">
                      <p className="text-sm font-semibold">{direccionSeleccionada.alias}</p>
                      <p className="text-sm text-muted-foreground">
                        {direccionSeleccionada.callePrincipal}
                        {direccionSeleccionada.calleSecundaria && `, ${direccionSeleccionada.calleSecundaria}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {direccionSeleccionada.ciudad}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Tel: {direccionSeleccionada.telefono}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* PASO 2: DESTINATARIO */}
            {pasoActual === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <User className="h-5 w-5" />
                  <span>¿A quién va el envío?</span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cedula">Cédula / RUC</Label>
                    <Controller
                      name="cedulaDestinatario"
                      control={control}
                      rules={{
                        required: "La cédula es requerida",
                        minLength: { value: 10, message: "Cédula inválida" },
                      }}
                      render={({ field }) => (
                        <Input
                          id="cedula"
                          placeholder="1234567890"
                          {...field}
                          className={errors.cedulaDestinatario ? "border-destructive" : ""}
                        />
                      )}
                    />
                    {errors.cedulaDestinatario && (
                      <p className="text-sm text-destructive">
                        {errors.cedulaDestinatario.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Controller
                      name="nombreDestinatario"
                      control={control}
                      rules={{ required: "El nombre es requerido" }}
                      render={({ field }) => (
                        <Input
                          id="nombre"
                          placeholder="Juan Pérez"
                          {...field}
                          className={errors.nombreDestinatario ? "border-destructive" : ""}
                        />
                      )}
                    />
                    {errors.nombreDestinatario && (
                      <p className="text-sm text-destructive">
                        {errors.nombreDestinatario.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefonoDestino">Teléfono</Label>
                    <Controller
                      name="telefonoDestinatario"
                      control={control}
                      rules={{
                        required: "El teléfono es requerido",
                        minLength: { value: 7, message: "Teléfono inválido" },
                      }}
                      render={({ field }) => (
                        <Input
                          id="telefonoDestino"
                          placeholder="+593 998765432"
                          {...field}
                          className={errors.telefonoDestinatario ? "border-destructive" : ""}
                        />
                      )}
                    />
                    {errors.telefonoDestinatario && (
                      <p className="text-sm text-destructive">
                        {errors.telefonoDestinatario.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ciudadDestino">Ciudad Destino</Label>
                    <Controller
                      name="ciudadDestino"
                      control={control}
                      rules={{ required: "La ciudad es requerida" }}
                      render={({ field }) => (
                        <Input
                          id="ciudadDestino"
                          placeholder="Guayaquil"
                          {...field}
                          className={errors.ciudadDestino ? "border-destructive" : ""}
                        />
                      )}
                    />
                    {errors.ciudadDestino && (
                      <p className="text-sm text-destructive">
                        {errors.ciudadDestino.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="direccionDestino">Dirección Exacta</Label>
                    <Controller
                      name="direccionDestino"
                      control={control}
                      rules={{ required: "La dirección es requerida" }}
                      render={({ field }) => (
                        <Input
                          id="direccionDestino"
                          placeholder="Av. Amazonas 123, Casa 4B"
                          {...field}
                          className={errors.direccionDestino ? "border-destructive" : ""}
                        />
                      )}
                    />
                    {errors.direccionDestino && (
                      <p className="text-sm text-destructive">
                        {errors.direccionDestino.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PASO 3: PAQUETE */}
            {pasoActual === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Package className="h-5 w-5" />
                  <span>Detalles del Paquete</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción del Contenido</Label>
                  <Controller
                    name="descripcion"
                    control={control}
                    rules={{
                      required: "La descripción es requerida",
                      minLength: { value: 5, message: "Mínimo 5 caracteres" },
                    }}
                    render={({ field }) => (
                      <textarea
                        id="descripcion"
                        placeholder="Ej: Ropa, zapatos, accesorios..."
                        className={`w-full rounded-md border px-3 py-2 text-sm resize-none ${
                          errors.descripcion ? "border-destructive" : "border-input"
                        }`}
                        rows={3}
                        {...field}
                      />
                    )}
                  />
                  {errors.descripcion && (
                    <p className="text-sm text-destructive">{errors.descripcion.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="peso">Peso Aproximado (lb)</Label>
                    <Controller
                      name="peso"
                      control={control}
                      rules={{
                        required: "El peso es requerido",
                        pattern: { value: /^\d+(\.\d{1,2})?$/, message: "Peso inválido" },
                        min: { value: 0.1, message: "Peso mínimo 0.1 lb" },
                      }}
                      render={({ field }) => (
                        <Input
                          id="peso"
                          type="number"
                          step="0.1"
                          placeholder="2.5"
                          {...field}
                          className={errors.peso ? "border-destructive" : ""}
                        />
                      )}
                    />
                    {errors.peso && (
                      <p className="text-sm text-destructive">{errors.peso.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor Declarado (USD)</Label>
                    <Controller
                      name="valorDeclarado"
                      control={control}
                      rules={{
                        required: "El valor es requerido",
                        pattern: { value: /^\d+(\.\d{1,2})?$/, message: "Valor inválido" },
                      }}
                      render={({ field }) => (
                        <Input
                          id="valor"
                          type="number"
                          step="0.01"
                          placeholder="50.00"
                          {...field}
                          className={errors.valorDeclarado ? "border-destructive" : ""}
                        />
                      )}
                    />
                    {errors.valorDeclarado && (
                      <p className="text-sm text-destructive">
                        {errors.valorDeclarado.message}
                      </p>
                    )}
                  </div>
                </div>

                <Card className="border-dashed bg-blue-50">
                  <CardContent className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <p className="text-sm text-muted-foreground">Costo Estimado</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">${costoEstimado}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* PASO 4: CONFIRMACIÓN */}
            {pasoActual === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Resumen del Envío</span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Remitente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      <p className="font-medium">{direccionSeleccionada?.alias}</p>
                      <p className="text-muted-foreground">
                        {direccionSeleccionada?.callePrincipal}
                      </p>
                      <p className="text-muted-foreground">{direccionSeleccionada?.ciudad}</p>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Destinatario</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      <p className="font-medium">{formValues.nombreDestinatario}</p>
                      <p className="text-muted-foreground">
                        Cédula: {formValues.cedulaDestinatario}
                      </p>
                      <p className="text-muted-foreground">{formValues.ciudadDestino}</p>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Paquete</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      <p className="font-medium">{formValues.descripcion}</p>
                      <p className="text-muted-foreground">
                        Peso: {formValues.peso} lb
                      </p>
                      <p className="text-muted-foreground">
                        Valor: ${formValues.valorDeclarado}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-primary bg-primary/5">
                    <CardContent className="flex flex-col items-center justify-center pt-6">
                      <p className="text-sm text-muted-foreground">Total a pagar</p>
                      <p className="text-3xl font-bold text-primary">${costoEstimado}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            <Separator />

            {/* Botones de Navegación */}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={retroceder} disabled={pasoActual === 0}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>

              {pasoActual < pasos.length - 1 ? (
                <Button onClick={avanzar} disabled={isLoadingDirecciones}>
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? "Generando..." : "Generar Envío"}
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
