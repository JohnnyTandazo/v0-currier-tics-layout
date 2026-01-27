"use client"

import { useState } from "react"
import { Search, Package, Truck, Globe, Shield, Clock, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthModal } from "@/components/modals/auth-modal"

interface LandingPageProps {
  onLogin: () => void
}

export function LandingPage({ onLogin }: LandingPageProps) {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")

  const handleOpenLogin = () => {
    setAuthMode("login")
    setAuthModalOpen(true)
  }

  const handleOpenRegister = () => {
    setAuthMode("register")
    setAuthModalOpen(true)
  }

  const handleAuthSuccess = () => {
    setAuthModalOpen(false)
    onLogin()
  }

  const handleTrackPackage = () => {
    if (trackingNumber.trim()) {
      // Simulate tracking - in production this would search the database
      alert(`Buscando paquete: ${trackingNumber}`)
    }
  }

  const features = [
    {
      icon: Globe,
      title: "Importaciones Internacionales",
      description: "Recibe tus compras de USA en nuestra bodega de Miami",
    },
    {
      icon: Truck,
      title: "Envíos Nacionales",
      description: "Entregamos a todo el Ecuador de forma rápida y segura",
    },
    {
      icon: Shield,
      title: "Seguro Incluido",
      description: "Tus paquetes están protegidos durante todo el trayecto",
    },
    {
      icon: Clock,
      title: "Rastreo en Tiempo Real",
      description: "Sigue tu paquete paso a paso desde Miami hasta tu puerta",
    },
  ]

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400">
              <Truck className="h-6 w-6 text-[#1a1a1a]" />
            </div>
            <span className="text-xl font-bold tracking-tight">Currier TICS</span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#" className="text-sm font-medium text-white/80 transition-colors hover:text-amber-400">
              Inicio
            </a>
            <a href="#" className="text-sm font-medium text-white/80 transition-colors hover:text-amber-400">
              Tarifas
            </a>
            <a href="#" className="text-sm font-medium text-white/80 transition-colors hover:text-amber-400">
              Blog
            </a>
          </div>

          <Button
            onClick={handleOpenLogin}
            className="bg-amber-400 text-[#1a1a1a] hover:bg-amber-500 font-semibold"
          >
            Ingresar
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-400/5 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-balance">
              Tu Casillero Internacional y{" "}
              <span className="text-amber-400">Courier Nacional</span>
            </h1>
            <p className="mt-6 text-lg text-white/70 text-pretty">
              Importa de USA y envía a todo el Ecuador. Recibe tus compras de Amazon, eBay, 
              y cualquier tienda online en nuestra bodega de Miami.
            </p>

            {/* Tracking Widget */}
            <div className="mt-10 mx-auto max-w-xl">
              <div className="rounded-2xl bg-white/5 p-2 backdrop-blur-sm border border-white/10">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />
                    <Input
                      type="text"
                      placeholder="Rastrea tu guía aquí"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="h-14 w-full rounded-xl border-0 bg-white/10 pl-12 text-white placeholder:text-white/50 focus-visible:ring-amber-400"
                    />
                  </div>
                  <Button
                    onClick={handleTrackPackage}
                    className="h-14 px-8 rounded-xl bg-amber-400 text-[#1a1a1a] hover:bg-amber-500 font-semibold"
                  >
                    Buscar
                  </Button>
                </div>
              </div>
              <p className="mt-3 text-sm text-white/50">
                Ejemplo: TRK-2024-001234
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={handleOpenRegister}
                size="lg"
                className="w-full sm:w-auto bg-amber-400 text-[#1a1a1a] hover:bg-amber-500 font-semibold px-8"
              >
                Crear Casillero Gratis
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                Ver Tarifas
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Por qué elegirnos
            </h2>
            <p className="mt-4 text-lg text-white/70">
              La mejor opción para tus importaciones y envíos
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl bg-white/5 p-6 border border-white/10 transition-colors hover:border-amber-400/50"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 group-hover:bg-amber-400 group-hover:text-[#1a1a1a] transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-white/60">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-amber-400/5 border-y border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3 text-center">
            <div>
              <div className="text-4xl font-bold text-amber-400">+50,000</div>
              <div className="mt-2 text-white/70">Paquetes Entregados</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-amber-400">24h</div>
              <div className="mt-2 text-white/70">Tiempo Promedio de Entrega</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-amber-400">99.9%</div>
              <div className="mt-2 text-white/70">Satisfacción del Cliente</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400">
                <Package className="h-4 w-4 text-[#1a1a1a]" />
              </div>
              <span className="font-semibold">Currier TICS</span>
            </div>
            <p className="text-sm text-white/50">
              © 2024 Currier TICS. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        mode={authMode}
        onModeChange={setAuthMode}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}
