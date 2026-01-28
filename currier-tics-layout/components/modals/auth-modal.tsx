"use client"

import React from "react"

import { useState } from "react"
import { Mail, Lock, User, Phone, Eye, EyeOff, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "login" | "register"
  onModeChange: (mode: "login" | "register") => void
  onSuccess: () => void
}

export function AuthModal({
  open,
  onOpenChange,
  mode,
  onModeChange,
  onSuccess,
}: AuthModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) {
        throw new Error("NEXT_PUBLIC_API_URL no está configurada")
      }

      if (mode === "login") {
        // LOGIN: POST to /api/usuarios/login
        const response = await fetch(`${apiUrl}/api/usuarios/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          throw new Error(error.message || "Credenciales incorrectas")
        }

        const data = await response.json()

        // Save to localStorage
        localStorage.setItem("usuario", JSON.stringify(data))
        console.log("Usuario autenticado:", data)

        // Close modal and reload page
        onSuccess()
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        // REGISTER: POST to /api/usuarios/registro
        const response = await fetch(`${apiUrl}/api/usuarios/registro`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: fullName,
            email: email,
            password: password,
            telefono: phone,
            rol: "CLIENTE",
          }),
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          throw new Error(error.message || "No se pudo crear la cuenta")
        }

        const data = await response.json()
        console.log("✅ Cuenta creada:", data)

        // Save to localStorage
        localStorage.setItem("usuario", JSON.stringify(data))

        // Show success message
        alert("¡Cuenta creada con éxito! Iniciando sesión...")

        // Close modal and reload page
        onSuccess()
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }
    } catch (error) {
      console.error("Error en autenticación:", error)
      alert(`Error: ${error instanceof Error ? error.message : "Algo salió mal"}`)
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setEmail("")
    setPassword("")
    setFullName("")
    setPhone("")
    setShowPassword(false)
  }

  const switchMode = (newMode: "login" | "register") => {
    resetForm()
    onModeChange(newMode)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#1a1a1a] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
          </DialogTitle>
          <DialogDescription className="text-center text-white/60">
            {mode === "login"
              ? "Ingresa a tu casillero virtual"
              : "Crea tu casillero y comienza a importar"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-white/80">
                Nombre Completo
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Juan Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-amber-400"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/80">
              Correo Electrónico
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-amber-400"
              />
            </div>
          </div>

          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white/80">
                Teléfono
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+593 99 999 9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-amber-400"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/80">
              Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-amber-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-400 text-[#1a1a1a] hover:bg-amber-500 font-semibold h-11"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "login" ? "Iniciando sesión..." : "Creando cuenta..."}
              </>
            ) : mode === "login" ? (
              "Iniciar Sesión"
            ) : (
              "Crear Casillero Gratis"
            )}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          {mode === "login" ? (
            <p className="text-white/60">
              ¿No tienes cuenta?{" "}
              <button
                onClick={() => switchMode("register")}
                className="text-amber-400 hover:text-amber-300 font-medium"
              >
                Regístrate
              </button>
            </p>
          ) : (
            <p className="text-white/60">
              ¿Ya tienes cuenta?{" "}
              <button
                onClick={() => switchMode("login")}
                className="text-amber-400 hover:text-amber-300 font-medium"
              >
                Inicia Sesión
              </button>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
