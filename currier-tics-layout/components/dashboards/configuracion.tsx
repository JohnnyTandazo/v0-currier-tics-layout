"use client"

import { useState } from "react"
import { Lock, Mail, User, Eye, EyeOff } from "lucide-react"
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
    nombre: "Juan Pérez",
    email: "juan.perez@example.com",
    telefonoWhatsApp: "+593 98 123 4567",
    direccion: "Quito, Ecuador",
    passwordActual: "",
    passwordNueva: "",
    passwordConfirm: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSaveProfile = () => {
    console.log("Guardando perfil:", formData)
    // Toast de éxito
  }

  const handleChangePassword = () => {
    if (formData.passwordNueva !== formData.passwordConfirm) {
      console.log("Las contraseñas no coinciden")
      return
    }
    console.log("Cambiando contraseña")
    // Reset fields
    setFormData((prev) => ({
      ...prev,
      passwordActual: "",
      passwordNueva: "",
      passwordConfirm: "",
    }))
  }

  return (
    <div className="space-y-6 max-w-2xl">
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
          {/* Nombre */}
          <div className="grid gap-2">
            <Label htmlFor="nombre" className="text-sm font-medium">
              Nombre Completo
            </Label>
            <Input
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder="Tu nombre completo"
            />
          </div>

          {/* Email */}
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
                onChange={handleInputChange}
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

          {/* Dirección */}
          <div className="grid gap-2">
            <Label htmlFor="direccion" className="text-sm font-medium">
              Dirección
            </Label>
            <Input
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleInputChange}
              placeholder="Tu dirección"
            />
          </div>

          <Button onClick={handleSaveProfile} className="w-full">
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

      {/* Preferencias */}
      <Card className="border-border/50 bg-card">
        <CardHeader className="pb-4">
          <CardTitle>Preferencias</CardTitle>
          <CardDescription>
            Personaliza tu experiencia en la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium text-sm">Notificaciones por Email</p>
              <p className="text-xs text-muted-foreground">Recibe actualizaciones sobre tus paquetes</p>
            </div>
            <input type="checkbox" defaultChecked className="h-5 w-5 rounded" />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium text-sm">Notificaciones por WhatsApp</p>
              <p className="text-xs text-muted-foreground">Alertas importantes vía WhatsApp</p>
            </div>
            <input type="checkbox" defaultChecked className="h-5 w-5 rounded" />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium text-sm">Modo Oscuro</p>
              <p className="text-xs text-muted-foreground">Tema oscuro automático</p>
            </div>
            <input type="checkbox" className="h-5 w-5 rounded" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
