"use client"

import { useState, useEffect } from "react"
import { Lock, User, Eye, EyeOff, Building, Copy, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { withAuthHeaders } from "@/lib/authHeaders"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export function Configuracion() {
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefonoWhatsApp: "",
    passwordActual: "",
    passwordNueva: "",
    passwordConfirm: "",
  })
  const [userId, setUserId] = useState("")
  const [loading, setLoading] = useState(true)
  const [miamiAddress, setMiamiAddress] = useState("")
  const { toast } = useToast()
  const [changingPass, setChangingPass] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSaveProfile = async () => {
    if (!userId) return toast({ title: "Usuario no encontrado", description: "No se puede guardar." })
    try {
      setLoading(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const endpoint = `${apiUrl}/api/usuarios/${userId}`
      const body = JSON.stringify({ telefono: formData.telefonoWhatsApp })
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: withAuthHeaders({ "Content-Type": "application/json" }),
        body,
      })
      if (response.ok) {
        toast({ title: "Perfil actualizado", description: "Teléfono guardado correctamente." })
      } else {
        toast({ title: "Error", description: `No se pudo guardar (${response.status})` })
      }
    } catch (err) {
      toast({ title: "Error", description: "Error de red al guardar." })
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    // Obtener usuario del localStorage
    try {
      const stored = localStorage.getItem("usuario")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && parsed.id) {
          setUserId(parsed.id)
          // Generar dirección Miami
          setMiamiAddress(`1350 NW 74th St, Unit #${parsed.id}, Miami, FL 33166`)
          // Fetch datos usuario
          const apiUrl = process.env.NEXT_PUBLIC_API_URL
          const endpoint = `${apiUrl}/api/usuarios/${parsed.id}`
          fetch(endpoint, {
            method: "GET",
            headers: withAuthHeaders({ "Content-Type": "application/json" }),
          })
            .then(async (res) => {
              if (!res.ok) throw new Error("No se pudo obtener usuario")
              const data = await res.json()
              setFormData({
                nombre: data.nombre || "",
                email: data.email || "",
                telefonoWhatsApp: data.telefono || "",
                passwordActual: "",
                passwordNueva: "",
                passwordConfirm: "",
              })
            })
            .catch(() => {
              toast({ title: "Error", description: "No se pudo cargar datos de usuario." })
            })
            .finally(() => setLoading(false))
        } else {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    } catch (err) {
      setLoading(false)
    }
  }, [])

  const handleChangePassword = async () => {
    // Validaciones
    if (
      !formData.passwordActual ||
      !formData.passwordNueva ||
      !formData.passwordConfirm
    ) {
      toast({ title: "Campos requeridos", description: "Completa todos los campos de contraseña." })
      return
    }
    if (formData.passwordNueva !== formData.passwordConfirm) {
      toast({ title: "Error", description: "Las contraseñas no coinciden." })
      return
    }
    if (formData.passwordNueva.length < 6) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres." })
      return
    }

    setChangingPass(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const endpoint = `${apiUrl}/api/usuarios/${userId}/password`
      const body = JSON.stringify({ password: formData.passwordNueva })
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: withAuthHeaders({ "Content-Type": "application/json" }),
        body,
      })
      if (response.ok) {
        toast({ title: "Contraseña actualizada", description: "La contraseña se cambió correctamente." })
        setFormData((prev) => ({
          ...prev,
          passwordActual: "",
          passwordNueva: "",
          passwordConfirm: "",
        }))
      } else {
        const errorText = await response.text()
        toast({ title: "Error", description: errorText || "No se pudo cambiar la contraseña." })
      }
    } catch (err) {
      toast({ title: "Error", description: "Error de red al cambiar la contraseña." })
    } finally {
      setChangingPass(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Dirección de Casillero Miami */}
      <Card className="border-border/50 bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Dirección de Casillero en Miami</CardTitle>
              <CardDescription>
                Usa esta dirección para tus compras en USA
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <div className="flex-1">
            <span className="font-mono text-sm text-foreground">{miamiAddress}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              navigator.clipboard.writeText(miamiAddress)
              toast({ title: "Dirección copiada", description: "Dirección de Miami copiada al portapapeles." })
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Información Personal */}
      <Card className="border-border/50 bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Actualiza tu información de perfil
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nombre (readOnly) */}
          <div className="grid gap-2">
            <Label htmlFor="nombre" className="text-sm font-medium">
              Nombre Completo
            </Label>
            <Input
              id="nombre"
              name="nombre"
              value={formData.nombre}
              readOnly
              disabled
              className="bg-muted text-muted-foreground"
              placeholder="Tu nombre completo"
            />
          </div>
          {/* Email (readOnly) */}
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Correo Electrónico
            </Label>
            <div className="flex gap-2">
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                readOnly
                disabled
                className="bg-muted text-muted-foreground"
                placeholder="tu@email.com"
              />
              <Badge variant="outline" className="h-10 whitespace-nowrap flex items-center">
                Verificado ✓
              </Badge>
            </div>
          </div>
          {/* WhatsApp */}
          <div className="grid gap-2">
            <Label htmlFor="telefonoWhatsApp" className="text-sm font-medium">
              WhatsApp
            </Label>
            <Input
              id="telefonoWhatsApp"
              name="telefonoWhatsApp"
              value={formData.telefonoWhatsApp}
              onChange={handleInputChange}
              placeholder="+593 98 123 4567"
            />
          </div>
          <Button onClick={handleSaveProfile} className="w-full" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            Guardar Cambios
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Cambiar Contraseña */}
      <Card className="border-border/50 bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Cambiar Contraseña</CardTitle>
              <CardDescription>
                Asegura tu cuenta con una contraseña fuerte
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Contraseña Actual */}
          <div className="grid gap-2">
            <Label htmlFor="passwordActual" className="text-sm font-medium">
              Contraseña Actual
            </Label>
            <div className="relative">
              <Input
                id="passwordActual"
                name="passwordActual"
                type={showPassword ? "text" : "password"}
                value={formData.passwordActual}
                onChange={handleInputChange}
                placeholder="Ingresa tu contraseña actual"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Contraseña Nueva */}
          <div className="grid gap-2">
            <Label htmlFor="passwordNueva" className="text-sm font-medium">
              Contraseña Nueva
            </Label>
            <div className="relative">
              <Input
                id="passwordNueva"
                name="passwordNueva"
                type={showNewPassword ? "text" : "password"}
                value={formData.passwordNueva}
                onChange={handleInputChange}
                placeholder="Ingresa tu nueva contraseña"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirmar Contraseña */}
          <div className="grid gap-2">
            <Label htmlFor="passwordConfirm" className="text-sm font-medium">
              Confirmar Contraseña
            </Label>
            <Input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              value={formData.passwordConfirm}
              onChange={handleInputChange}
              placeholder="Confirma tu nueva contraseña"
            />
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            <p>
              La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, números y caracteres especiales.
            </p>
          </div>

          <Button onClick={handleChangePassword} className="w-full">
            Cambiar Contraseña
          </Button>
        </CardContent>
      </Card>

      <Separator />

      
    </div>
  )
}
