"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Home,
  Package,
  User,
  Loader2,
  AlertCircle,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
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

interface CreateEnvioWizardProps {
  onClose?: () => void
  onSuccess?: () => void
}

const pasos = ["Remitente", "Destinatario", "Paquete"] as const

// Función auxiliar a prueba de balas para extraer el ID seguro
const getSafeUserId = (): number | null => {
  if (typeof window === "undefined") return null // Evitar error de servidor

  try {
    // INTENTO 1: Buscar en el objeto 'usuario' (donde confirmamos que está el dato)
    const usuarioStr = localStorage.getItem("usuario")
    if (usuarioStr) {
      const usuarioObj = JSON.parse(usuarioStr)
      if (usuarioObj && usuarioObj.id) {
        const cleanId = Number(usuarioObj.id)
        console.log("✅ ID extraído de localStorage['usuario']:", cleanId)
        return cleanId
      }
    }

    // INTENTO 2: Buscar en 'userId' por si acaso
    const simpleId = localStorage.getItem("userId")
    if (simpleId) {
      const cleanId = Number(simpleId)
      console.log("✅ ID extraído de localStorage['userId']:", cleanId)
      return cleanId
    }

    console.warn("⚠️ No se encontró ID en localStorage")
    return null
  } catch (error) {
    console.error("🔥 Error extrayendo ID:", error)
    return null
  }
}

export function CreateEnvioWizard({ onClose, onSuccess }: CreateEnvioWizardProps) {
  const { toast } = useToast()
  const router = useRouter()

  const [pasoActual, setPasoActual] = useState(0)
  const [userId, setUserId] = useState<number | null>(null)
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

  // EFECTO 1: Obtener el ID del usuario al montar (UNA SOLA VEZ)
  useEffect(() => {
    const safeId = getSafeUserId()
    if (safeId) {
      console.log("🔐 Wizard: ID de usuario obtenido:", safeId)
      setUserId(safeId)
    } else {
      console.error("🚨 Wizard: No se encontró ID de usuario")
      toast({
        title: "Error",
        description: "Error: Usuario no identificado",
        variant: "destructive",
      })
      setIsLoadingDirecciones(false)
    }
  }, [toast])

  // EFECTO 2: Cargar direcciones SOLO cuando el ID cambia (y si no las tenemos ya)
  useEffect(() => {
    if (!userId || direcciones.length > 0) {
      // Si no tenemos ID o ya cargamos direcciones, NO hacer nada
      setIsLoadingDirecciones(false)
      return
    }

    const cargarDirecciones = async () => {
      console.log("⚡ Wizard: Fetching direcciones para ID:", userId)
      setIsLoadingDirecciones(true)
      try {
        // ✅ LIMPIAR ID CORRUPTO: Extraer antes del : (1:1 → 1)
        const cleanId = String(userId).split(':')[0].trim()
        console.log("🛠️ Limpiando ID corrupto:", userId, "-> ID Final:", cleanId)
        
        if (!cleanId || isNaN(Number(cleanId)) || Number(cleanId) <= 0) {
          throw new Error("ID de usuario inválido después de limpiar")
        }
        
        const url = `/api/direcciones?usuarioId=${cleanId}`
        console.log("📥 GET:", url)

        const response = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        if (!response.ok) {
          throw new Error("No se pudieron cargar las direcciones")
        }

        const data = await response.json()
        if (Array.isArray(data)) {
          console.log("✅ Direcciones cargadas en Wizard:", data.length)
          setDirecciones(data)
          // Auto-seleccionar la primera dirección principal o la primera disponible
          const principal = data.find((d) => d.esPrincipal)
          if (principal) {
            reset({ direccionOrigenId: principal.id })
          }
        }
      } catch (error) {
        console.error("🔥 Error al cargar direcciones:", error)
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
  }, [userId, reset, toast])

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
    const cleanUserId = getSafeUserId()

    if (!cleanUserId) {
      toast({
        title: "Error",
        description: "Error: Usuario no identificado",
        variant: "destructive",
      })
      return
    }

    // Generar un tracking temporal si no lo tengo
    const trackingId = `NAC-${Date.now().toString().slice(-6)}`

    setIsSaving(true)
    try {
      // Payload EXACTO según contrato Backend
      const payload = {
        usuarioId: cleanUserId,
        numeroTracking: trackingId,
        descripcion: data.descripcion,
        pesoLibras: Number(data.peso),
        valorDeclarado: Number(data.valorDeclarado),
        estado: "PENDIENTE",
        categoria: "A",
        usuario: {
          id: cleanUserId,
        },
        // Nuevos campos de Destino (Snapshot)
        destinatarioNombre: data.nombreDestinatario || "Destinatario",
        destinatarioCiudad: data.ciudadDestino || "Ciudad",
        destinatarioDireccion: data.direccionDestino || "Dirección",
        destinatarioTelefono: data.telefonoDestinatario || "",
        destinatarioCedula: data.cedulaDestinatario || "",
      }

      console.log("📤 Enviando Payload:", JSON.stringify(payload, null, 2))

      // 🔥 DEBUG GIGANTE - VER EXACTAMENTE QUÉ SE ENVÍA
      console.log("╔════════════════════════════════════════════════════════╗")
      console.log("║         📦 [DEBUG] PAYLOAD A ENVIAR - VERIFICAR       ║")
      console.log("╚════════════════════════════════════════════════════════╝")
      console.log(JSON.stringify(payload, null, 2))
      console.log("╔════════════════════════════════════════════════════════╗")
      console.log("║ ¿destinatarioNombre tiene datos? →", payload.destinatarioNombre)
      console.log("║ ¿destinatarioCiudad tiene datos? →", payload.destinatarioCiudad)
      console.log("║ ¿destinatarioDireccion tiene datos? →", payload.destinatarioDireccion)
      console.log("╚════════════════════════════════════════════════════════╝")
      
      alert("✋ PAUSA DEBUG: Revisa la consola del navegador (F12) antes de que continúe")

      const response = await fetch("/api/envios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const text = await response.text().catch(() => "")
        console.error("🔥 Error POST /api/envios:", response.status, text)
        throw new Error(text || "No se pudo crear el envío")
      }

      const responseData = await response.json()
      console.log("✅ Envío creado con tracking:", trackingId, responseData)

      toast({
        title: "✅ Solicitud creada",
        description: `Guía generada: ${trackingId}`,
      })

      // 🔄 Refrescar datos en tiempo real
      router.refresh()
      
      onSuccess?.()
      onClose?.()
    } catch (error) {
      console.error("🚨 Error al crear envío:", error)
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto">
      {/* Progress Bar - 3 pasos */}
      <div className="grid grid-cols-3 gap-2">
        {pasos.map((paso, index) => (
          <div
            key={paso}
            className={`rounded-md border px-2 py-1 text-center text-xs transition-all ${
              index === pasoActual
                ? "border-primary bg-primary/10 font-semibold text-primary"
                : index < pasoActual
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-border text-muted-foreground"
            }`}
          >
            {index < pasoActual ? "✓" : index + 1}
          </div>
        ))}
      </div>

      <Separator />

      {/* PASO 1: REMITENTE */}
      {pasoActual === 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Home className="h-5 w-5 text-blue-600" />
            ¿Dónde recogemos el paquete?
          </h3>

          {isLoadingDirecciones ? (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando direcciones...
            </div>
          ) : direcciones.length === 0 ? (
            // Sin direcciones guardadas
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-4 space-y-3">
                <div className="flex gap-2 text-sm text-amber-900">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">No tienes direcciones guardadas</p>
                    <p className="text-xs">Crea una en Configuración para entregas rápidas</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-amber-900 border-amber-300 hover:bg-amber-100"
                  onClick={() => {
                    window.open("/dashboard/configuracion", "_blank")
                  }}
                >
                  <Settings className="h-4 w-4" />
                  Ir a Configuración
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="direccionOrigen" className="text-sm">
                Seleccionar dirección de recogida
              </Label>
              <Controller
                name="direccionOrigenId"
                control={control}
                rules={{ required: "Debes seleccionar una dirección" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="direccionOrigen"
                      className={`text-sm ${
                        errors.direccionOrigenId ? "border-destructive" : ""
                      }`}
                    >
                      <SelectValue placeholder="Elige una dirección" />
                    </SelectTrigger>
                    <SelectContent>
                      {direcciones.map((dir) => (
                        <SelectItem key={dir.id} value={dir.id} className="text-sm">
                          <div className="flex items-center gap-2">
                            {dir.esPrincipal && (
                              <span className="text-xs font-semibold text-green-600">★</span>
                            )}
                            {dir.alias} - {dir.ciudad}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.direccionOrigenId && (
                <p className="text-xs text-destructive">{errors.direccionOrigenId.message}</p>
              )}
            </div>
          )}

          {/* Preview de dirección seleccionada */}
          {direccionSeleccionada && (
            <Card className="border-dashed bg-muted/50">
              <CardContent className="space-y-1 pt-3 text-sm">
                <div className="flex items-start gap-2">
                  <Home className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{direccionSeleccionada.alias}</p>
                    <p className="text-xs text-muted-foreground">
                      {direccionSeleccionada.callePrincipal}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {direccionSeleccionada.ciudad}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* PASO 2: DESTINATARIO */}
      {pasoActual === 1 && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Datos del Destinatario
          </h3>
          <p className="text-xs text-muted-foreground">
            ℹ️ Estos datos solo se usan para esta solicitud, no se guardan en tu perfil
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="cedula" className="text-xs">
                Cédula o Pasaporte *
              </Label>
              <Controller
                name="cedulaDestinatario"
                control={control}
                rules={{
                  required: "Requerido",
                  minLength: { value: 10, message: "Inválida" },
                }}
                render={({ field }) => (
                  <Input
                    id="cedula"
                    placeholder="1234567890"
                    {...field}
                    className={`text-sm h-9 ${
                      errors.cedulaDestinatario ? "border-destructive" : ""
                    }`}
                  />
                )}
              />
              {errors.cedulaDestinatario && (
                <p className="text-xs text-destructive">{errors.cedulaDestinatario.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="nombre" className="text-xs">
                Nombre Completo *
              </Label>
              <Controller
                name="nombreDestinatario"
                control={control}
                rules={{ required: "Requerido" }}
                render={({ field }) => (
                  <Input
                    id="nombre"
                    placeholder="Juan Pérez"
                    {...field}
                    className={`text-sm h-9 ${
                      errors.nombreDestinatario ? "border-destructive" : ""
                    }`}
                  />
                )}
              />
              {errors.nombreDestinatario && (
                <p className="text-xs text-destructive">{errors.nombreDestinatario.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="telefonoDestino" className="text-xs">
                Teléfono *
              </Label>
              <Controller
                name="telefonoDestinatario"
                control={control}
                rules={{ required: "Requerido", minLength: { value: 7, message: "Inválido" } }}
                render={({ field }) => (
                  <Input
                    id="telefonoDestino"
                    placeholder="+593 98 123 4567"
                    {...field}
                    className={`text-sm h-9 ${
                      errors.telefonoDestinatario ? "border-destructive" : ""
                    }`}
                  />
                )}
              />
              {errors.telefonoDestinatario && (
                <p className="text-xs text-destructive">{errors.telefonoDestinatario.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="ciudadDestino" className="text-xs">
                Ciudad Destino *
              </Label>
              <Controller
                name="ciudadDestino"
                control={control}
                rules={{ required: "Requerido" }}
                render={({ field }) => (
                  <Input
                    id="ciudadDestino"
                    placeholder="Guayaquil"
                    {...field}
                    className={`text-sm h-9 ${errors.ciudadDestino ? "border-destructive" : ""}`}
                  />
                )}
              />
              {errors.ciudadDestino && (
                <p className="text-xs text-destructive">{errors.ciudadDestino.message}</p>
              )}
            </div>

            <div className="col-span-2 space-y-1">
              <Label htmlFor="direccionDestino" className="text-xs">
                Dirección Exacta de Entrega *
              </Label>
              <Controller
                name="direccionDestino"
                control={control}
                rules={{ required: "Requerido" }}
                render={({ field }) => (
                  <Input
                    id="direccionDestino"
                    placeholder="Av. Principal 123, entre Calle 1 y Calle 2"
                    {...field}
                    className={`text-sm h-9 ${
                      errors.direccionDestino ? "border-destructive" : ""
                    }`}
                  />
                )}
              />
              {errors.direccionDestino && (
                <p className="text-xs text-destructive">{errors.direccionDestino.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PASO 3: DETALLES DEL PAQUETE */}
      {pasoActual === 2 && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Detalles del Paquete
          </h3>

          <div className="space-y-2">
            <Label htmlFor="descripcion" className="text-xs">
              Descripción del Contenido *
            </Label>
            <Controller
              name="descripcion"
              control={control}
              rules={{ required: "Requerida", minLength: { value: 5, message: "Mín. 5 car." } }}
              render={({ field }) => (
                <textarea
                  id="descripcion"
                  placeholder="Ej: Ropa, zapatos, accesorios..."
                  className={`w-full rounded-md border px-3 py-2 text-sm resize-none h-20 ${
                    errors.descripcion ? "border-destructive" : "border-input"
                  }`}
                  {...field}
                />
              )}
            />
            {errors.descripcion && (
              <p className="text-xs text-destructive">{errors.descripcion.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="peso" className="text-xs">
                Peso (Libras) *
              </Label>
              <Controller
                name="peso"
                control={control}
                rules={{
                  required: "Requerido",
                  pattern: { value: /^\d+(\.\d{1,2})?$/, message: "Inválido" },
                }}
                render={({ field }) => (
                  <Input
                    id="peso"
                    type="number"
                    step="0.1"
                    placeholder="2.5"
                    {...field}
                    className={`text-sm h-9 ${errors.peso ? "border-destructive" : ""}`}
                  />
                )}
              />
              {errors.peso && (
                <p className="text-xs text-destructive">{errors.peso.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="valor" className="text-xs">
                Valor Declarado (USD) *
              </Label>
              <Controller
                name="valorDeclarado"
                control={control}
                rules={{
                  required: "Requerido",
                  pattern: { value: /^\d+(\.\d{1,2})?$/, message: "Inválido" },
                }}
                render={({ field }) => (
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    placeholder="50.00"
                    {...field}
                    className={`text-sm h-9 ${errors.valorDeclarado ? "border-destructive" : ""}`}
                  />
                )}
              />
              {errors.valorDeclarado && (
                <p className="text-xs text-destructive">{errors.valorDeclarado.message}</p>
              )}
            </div>
          </div>

          {/* Costo estimado */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="flex items-center justify-between pt-3 pb-3 px-3">
              <p className="text-xs font-medium text-blue-900">Costo Estimado</p>
              <p className="text-lg font-bold text-blue-600">${costoEstimado}</p>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground italic">
            💡 El costo incluye: tarifa base + peso + seguro (1% del valor declarado)
          </p>
        </div>
      )}

      <Separator />

      {/* Botones de navegación */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={retroceder}
          disabled={pasoActual === 0}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Atrás
        </Button>

        {pasoActual < pasos.length - 1 ? (
          <Button type="button" size="sm" onClick={avanzar} disabled={isLoadingDirecciones}>
            Continuar
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" size="sm" disabled={isSaving} className="gap-1 bg-blue-600 hover:bg-blue-700">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Crear Solicitud
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  )
}
