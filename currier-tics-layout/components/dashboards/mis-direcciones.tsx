"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Building2,
  Home,
  MapPin,
  Phone,
  Plus,
  Star,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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

const iconForAlias = (alias: string) => {
  const value = alias.toLowerCase()
  if (value.includes("casa")) return Home
  if (value.includes("oficina") || value.includes("trabajo")) return Building2
  return MapPin
}

export function MisDirecciones() {
  const { toast } = useToast()
  const [direcciones, setDirecciones] = useState<Direccion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [form, setForm] = useState({
    alias: "",
    callePrincipal: "",
    calleSecundaria: "",
    ciudad: "",
    telefono: "",
    referencia: "",
    esPrincipal: false,
  })

  const cargarDirecciones = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/direcciones", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        const text = await response.text().catch(() => "")
        throw new Error(text || "No se pudieron cargar las direcciones")
      }

      const data = await response.json()
      if (Array.isArray(data)) {
        setDirecciones(data)
      } else {
        setDirecciones([])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido"
      setError(message)
      setDirecciones([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarDirecciones()
  }, [])

  const resetForm = () => {
    setForm({
      alias: "",
      callePrincipal: "",
      calleSecundaria: "",
      ciudad: "",
      telefono: "",
      referencia: "",
      esPrincipal: false,
    })
  }

  const canSave = useMemo(() => {
    return (
      form.alias.trim() &&
      form.callePrincipal.trim() &&
      form.ciudad.trim() &&
      form.telefono.trim()
    )
  }, [form])

  const handleCreate = async () => {
    if (!canSave || isSaving) {
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/direcciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alias: form.alias,
          callePrincipal: form.callePrincipal,
          calleSecundaria: form.calleSecundaria,
          ciudad: form.ciudad,
          telefono: form.telefono,
          referencia: form.referencia,
          esPrincipal: form.esPrincipal,
        }),
      })

      if (!response.ok) {
        const text = await response.text().catch(() => "")
        throw new Error(text || "No se pudo guardar la dirección")
      }

      const data = await response.json().catch(() => null)
      if (data) {
        setDirecciones((prev) => [data, ...prev])
      } else {
        await cargarDirecciones()
      }

      toast({
        title: "Dirección guardada",
        description: "La nueva dirección se agregó correctamente.",
      })
      setIsDialogOpen(false)
      resetForm()
    } catch (err) {
      toast({
        title: "No se pudo guardar",
        description: err instanceof Error ? err.message : "Intenta nuevamente",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/direcciones/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const text = await response.text().catch(() => "")
        throw new Error(text || "No se pudo eliminar la dirección")
      }

      setDirecciones((prev) => prev.filter((item) => item.id !== id))
      toast({
        title: "Dirección eliminada",
        description: "La dirección se eliminó correctamente.",
      })
    } catch (err) {
      toast({
        title: "No se pudo eliminar",
        description: err instanceof Error ? err.message : "Intenta nuevamente",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mis Direcciones</h1>
          <p className="text-muted-foreground">Administra tus direcciones guardadas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Dirección
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nueva Dirección</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="alias">Alias</Label>
                <Input
                  id="alias"
                  placeholder="Casa, Oficina..."
                  value={form.alias}
                  onChange={(event) => setForm({ ...form, alias: event.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="callePrincipal">Calle Principal</Label>
                  <Input
                    id="callePrincipal"
                    value={form.callePrincipal}
                    onChange={(event) =>
                      setForm({ ...form, callePrincipal: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calleSecundaria">Calle Secundaria</Label>
                  <Input
                    id="calleSecundaria"
                    value={form.calleSecundaria}
                    onChange={(event) =>
                      setForm({ ...form, calleSecundaria: event.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    value={form.ciudad}
                    onChange={(event) => setForm({ ...form, ciudad: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={form.telefono}
                    onChange={(event) => setForm({ ...form, telefono: event.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="referencia">Referencia</Label>
                <Input
                  id="referencia"
                  value={form.referencia}
                  onChange={(event) => setForm({ ...form, referencia: event.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="esPrincipal"
                  checked={form.esPrincipal}
                  onCheckedChange={(value) =>
                    setForm({ ...form, esPrincipal: Boolean(value) })
                  }
                />
                <Label htmlFor="esPrincipal">¿Marcar como predeterminada?</Label>
              </div>
              <Separator />
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={!canSave || isSaving}>
                  Guardar dirección
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      )}

      {error && !isLoading && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-6 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && direcciones.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No tienes direcciones guardadas todavía.
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && direcciones.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {direcciones.map((direccion) => {
            const Icon = iconForAlias(direccion.alias)
            return (
              <Card key={direccion.id} className="relative overflow-hidden">
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-accent p-2 text-accent-foreground">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{direccion.alias}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {direccion.ciudad}
                        </p>
                      </div>
                    </div>
                    {direccion.esPrincipal && (
                      <Badge variant="secondary" className="gap-1">
                        <Star className="h-3 w-3" />
                        Predeterminada
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    {direccion.callePrincipal}
                    {direccion.calleSecundaria ? `, ${direccion.calleSecundaria}` : ""}
                  </p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{direccion.telefono}</span>
                  </div>
                  {direccion.referencia && (
                    <p className="text-xs text-muted-foreground/80">
                      Ref: {direccion.referencia}
                    </p>
                  )}
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDelete(direccion.id)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
