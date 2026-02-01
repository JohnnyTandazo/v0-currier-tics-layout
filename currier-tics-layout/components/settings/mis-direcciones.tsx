"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Home,
  Building2,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Phone,
  MapPinIcon,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
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

interface FormDireccion {
  alias: string
  callePrincipal: string
  calleSecundaria: string
  ciudad: string
  telefono: string
  referencia: string
  esPrincipal: boolean
}

const ICON_TYPES = [
  { id: "home", label: "Casa", icon: Home },
  { id: "building", label: "Oficina", icon: Building2 },
  { id: "pin", label: "Otro", icon: MapPin },
] as const

export function MisDirectiones() {
  const { toast } = useToast()

  const [direcciones, setDirecciones] = useState<Direccion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState<FormDireccion>({
    alias: "",
    callePrincipal: "",
    calleSecundaria: "",
    ciudad: "",
    telefono: "",
    referencia: "",
    esPrincipal: false,
  })

  const [selectedIcon, setSelectedIcon] = useState<string>("home")

  // Cargar direcciones
  const cargarDirecciones = useCallback(async () => {
    setIsLoading(true)
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
      }
    } catch (error) {
      console.error("Error al cargar direcciones:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar tus direcciones",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    cargarDirecciones()
  }, [cargarDirecciones])

  // Abrir dialog para agregar nueva dirección
  const handleAgregar = () => {
    setEditingId(null)
    setForm({
      alias: "",
      callePrincipal: "",
      calleSecundaria: "",
      ciudad: "",
      telefono: "",
      referencia: "",
      esPrincipal: false,
    })
    setSelectedIcon("home")
    setIsDialogOpen(true)
  }

  // Abrir dialog para editar dirección existente
  const handleEditar = (direccion: Direccion) => {
    setEditingId(direccion.id)
    setForm({
      alias: direccion.alias,
      callePrincipal: direccion.callePrincipal,
      calleSecundaria: direccion.calleSecundaria || "",
      ciudad: direccion.ciudad,
      telefono: direccion.telefono,
      referencia: direccion.referencia || "",
      esPrincipal: direccion.esPrincipal || false,
    })
    // Detectar tipo de icono desde alias
    if (direccion.alias.toLowerCase().includes("oficina")) {
      setSelectedIcon("building")
    } else if (direccion.alias.toLowerCase().includes("casa")) {
      setSelectedIcon("home")
    } else {
      setSelectedIcon("pin")
    }
    setIsDialogOpen(true)
  }

  // Guardar dirección (crear o actualizar)
  const handleGuardar = async () => {
    // Validar
    if (!form.alias.trim()) {
      toast({
        title: "Error",
        description: "El nombre/alias es requerido",
        variant: "destructive",
      })
      return
    }

    if (!form.callePrincipal.trim()) {
      toast({
        title: "Error",
        description: "La dirección es requerida",
        variant: "destructive",
      })
      return
    }

    if (!form.ciudad.trim()) {
      toast({
        title: "Error",
        description: "La ciudad es requerida",
        variant: "destructive",
      })
      return
    }

    if (!form.telefono.trim()) {
      toast({
        title: "Error",
        description: "El teléfono es requerido",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        alias: form.alias,
        callePrincipal: form.callePrincipal,
        calleSecundaria: form.calleSecundaria || null,
        ciudad: form.ciudad,
        telefono: form.telefono,
        referencia: form.referencia || null,
        esPrincipal: form.esPrincipal,
      }

      let response
      if (editingId) {
        // Actualizar
        response = await fetch(`/api/direcciones/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        // Crear nueva
        response = await fetch("/api/direcciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      if (!response.ok) {
        const text = await response.text().catch(() => "")
        throw new Error(text || "Error al guardar dirección")
      }

      toast({
        title: "✅ Dirección guardada",
        description: editingId
          ? "Tu dirección se actualizó correctamente"
          : "Tu dirección se creó correctamente",
      })

      setIsDialogOpen(false)
      cargarDirecciones()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar la dirección",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Eliminar dirección
  const handleEliminar = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta dirección?")) {
      return
    }

    try {
      const response = await fetch(`/api/direcciones/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        throw new Error("No se pudo eliminar la dirección")
      }

      toast({
        title: "✅ Dirección eliminada",
        description: "Tu dirección se eliminó correctamente",
      })

      cargarDirecciones()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar la dirección",
        variant: "destructive",
      })
    }
  }

  const getIconComponent = (iconId: string) => {
    switch (iconId) {
      case "home":
        return <Home className="h-5 w-5" />
      case "building":
        return <Building2 className="h-5 w-5" />
      case "pin":
        return <MapPin className="h-5 w-5" />
      default:
        return <MapPin className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Header con botón agregar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Mis Direcciones</h3>
          <p className="text-sm text-muted-foreground">
            Guarda tus ubicaciones personales para entregas rápidas
          </p>
        </div>
        <Button
          onClick={handleAgregar}
          size="sm"
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Agregar Dirección
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && direcciones.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPinIcon className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="font-medium text-muted-foreground">No hay direcciones guardadas</p>
            <p className="text-sm text-muted-foreground mb-4">
              Agrega tu primera dirección para entregas rápidas
            </p>
            <Button
              onClick={handleAgregar}
              size="sm"
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Agregar Dirección
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lista de Direcciones */}
      {!isLoading && direcciones.length > 0 && (
        <div className="grid gap-3">
          {direcciones.map((dir) => (
            <Card key={dir.id} className="border-border/50 hover:border-border transition-colors">
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  {/* Icono */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 flex-shrink-0">
                    {dir.alias.toLowerCase().includes("oficina")
                      ? getIconComponent("building")
                      : dir.alias.toLowerCase().includes("casa")
                      ? getIconComponent("home")
                      : getIconComponent("pin")}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-foreground">{dir.alias}</h4>
                      {dir.esPrincipal && (
                        <Badge variant="default" className="text-xs bg-green-600 text-white">
                          <Check className="h-3 w-3 mr-1" />
                          Principal
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        <span className="font-medium text-foreground">{dir.callePrincipal}</span>
                        {dir.calleSecundaria && (
                          <span>, {dir.calleSecundaria}</span>
                        )}
                      </p>
                      <p>{dir.ciudad}</p>
                      {dir.referencia && (
                        <p className="text-xs italic">
                          <span className="text-muted-foreground">Ref: </span>
                          {dir.referencia}
                        </p>
                      )}
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {dir.telefono}
                      </p>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditar(dir)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEliminar(dir.id)}
                      className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog: Agregar/Editar Dirección */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Dirección" : "Agregar Nueva Dirección"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Actualiza los datos de tu dirección guardada"
                : "Completa los datos para guardar una nueva dirección personal"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Nombre/Alias */}
            <div className="space-y-2">
              <Label htmlFor="alias" className="text-sm font-medium">
                Nombre o Alias *
              </Label>
              <Select value={selectedIcon} onValueChange={setSelectedIcon}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="alias"
                placeholder="Ej: Casa, Oficina, Apartamento..."
                value={form.alias}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    alias: e.target.value,
                  }))
                }
                className="text-sm"
              />
            </div>

            <Separator />

            {/* Dirección */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="calle" className="text-sm font-medium">
                  Dirección Principal *
                </Label>
                <Input
                  id="calle"
                  placeholder="Ej: Av. Principal 123"
                  value={form.callePrincipal}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      callePrincipal: e.target.value,
                    }))
                  }
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="calle2" className="text-sm font-medium">
                  Dirección Secundaria
                </Label>
                <Input
                  id="calle2"
                  placeholder="Ej: Entre calles..."
                  value={form.calleSecundaria}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      calleSecundaria: e.target.value,
                    }))
                  }
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ciudad" className="text-sm font-medium">
                  Ciudad *
                </Label>
                <Input
                  id="ciudad"
                  placeholder="Ej: Guayaquil"
                  value={form.ciudad}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      ciudad: e.target.value,
                    }))
                  }
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono" className="text-sm font-medium">
                  Teléfono *
                </Label>
                <Input
                  id="telefono"
                  placeholder="Ej: +593 98 123 4567"
                  value={form.telefono}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      telefono: e.target.value,
                    }))
                  }
                  className="text-sm"
                />
              </div>
            </div>

            {/* Referencia */}
            <div className="space-y-2">
              <Label htmlFor="referencia" className="text-sm font-medium">
                Referencia o Nota
              </Label>
              <Input
                id="referencia"
                placeholder="Ej: Puerta roja, al lado del supermercado..."
                value={form.referencia}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    referencia: e.target.value,
                  }))
                }
                className="text-sm"
              />
            </div>

            {/* Checkbox Principal */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="principal"
                checked={form.esPrincipal}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    esPrincipal: e.target.checked,
                  }))
                }
                className="rounded border-gray-300 cursor-pointer"
              />
              <Label htmlFor="principal" className="text-sm font-medium cursor-pointer">
                Establecer como dirección principal
              </Label>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleGuardar}
              disabled={isSaving}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Guardar Dirección
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
