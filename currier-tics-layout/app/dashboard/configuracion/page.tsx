"use client"

import { useState } from "react"
import { Lock, Mail, User, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddressManager } from "@/components/settings/address-manager"
import { useToast } from "@/hooks/use-toast"

export default function ConfiguracionPage() {
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "Juan Pérez",
    email: "juan.perez@example.com",
    telefonoWhatsApp: "+593 98 123 4567",
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

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      // Aquí iría la llamada a /api/usuarios/me o similar
      console.log("Guardando perfil:", formData)
      toast({
        title: "Perfil actualizado",
        description: "Tus datos se guardaron correctamente.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el perfil",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (formData.passwordNueva !== formData.passwordConfirm) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      })
      return
    }

    if (formData.passwordNueva.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      // Aquí iría la llamada a /api/usuarios/me/password o similar
      console.log("Cambiando contraseña")
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña se cambió correctamente.",
      })
      // Reset fields
      setFormData((prev) => ({
        ...prev,
        passwordActual: "",
        passwordNueva: "",
        passwordConfirm: "",
      }))
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cambiar la contraseña",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Administra tu perfil y preferencias</p>
      </div>

      <Tabs defaultValue="perfil" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="direcciones">Mis Direcciones</TabsTrigger>
        </TabsList>

        {/* TAB: PERFIL */}
        <TabsContent value="perfil" className="space-y-4">
          {/* Datos Básicos */}
          <Card>
            <CardHeader>
              <CardTitle>Datos Básicos</CardTitle>
              <CardDescription>
                Información personal de tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nombre Completo
                </Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Juan Pérez"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="juan@example.com"
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  El email no puede ser modificado
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefonoWhatsApp">WhatsApp</Label>
                <Input
                  id="telefonoWhatsApp"
                  name="telefonoWhatsApp"
                  value={formData.telefonoWhatsApp}
                  onChange={handleInputChange}
                  placeholder="+593 98 123 4567"
                />
              </div>

              <Separator />

              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </CardContent>
          </Card>

          {/* Cambiar Contraseña */}
          <Card>
            <CardHeader>
              <CardTitle>Seguridad</CardTitle>
              <CardDescription>
                Cambia tu contraseña regularmente para mantener tu cuenta segura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passwordActual" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Contraseña Actual
                </Label>
                <div className="relative">
                  <Input
                    id="passwordActual"
                    name="passwordActual"
                    type={showPassword ? "text" : "password"}
                    value={formData.passwordActual}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordNueva">Nueva Contraseña</Label>
                <div className="relative">
                  <Input
                    id="passwordNueva"
                    name="passwordNueva"
                    type={showNewPassword ? "text" : "password"}
                    value={formData.passwordNueva}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">Confirmar Nueva Contraseña</Label>
                <Input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type="password"
                  value={formData.passwordConfirm}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                />
              </div>

              <Separator />

              <Button onClick={handleChangePassword} disabled={isSaving}>
                {isSaving ? "Actualizando..." : "Cambiar contraseña"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: MIS DIRECCIONES */}
        <TabsContent value="direcciones">
          <Card>
            <CardContent className="pt-6">
              <AddressManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
