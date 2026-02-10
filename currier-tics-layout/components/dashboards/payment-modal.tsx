"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, Lock, AlertCircle } from "lucide-react"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  monto?: number
  descripcion?: string
}

export function PaymentModal({
  isOpen,
  onClose,
  onConfirm,
  monto = 0,
  descripcion = "Pago de paquete",
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    titular: "",
    numeroTarjeta: "",
    expiracion: "",
    cvc: "",
  })
  const [errors, setErrors] = useState({
    titular: "",
    numeroTarjeta: "",
    expiracion: "",
    cvc: "",
  })

  // Formatear número de tarjeta (agregar espacios cada 4 dígitos)
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(" ")
    } else {
      return value
    }
  }

  // Formatear expiración (MM/YY)
  const formatExpiration = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4)
    }
    return v
  }

  // Manejar cambios en los campos
  const handleChange = (field: string, value: string) => {
    let formattedValue = value

    if (field === "numeroTarjeta") {
      formattedValue = formatCardNumber(value)
      if (formattedValue.replace(/\s/g, "").length > 16) return
    } else if (field === "expiracion") {
      formattedValue = formatExpiration(value)
      if (formattedValue.length > 5) return
    } else if (field === "cvc") {
      formattedValue = value.replace(/[^0-9]/g, "")
      if (formattedValue.length > 4) return
    }

    setFormData((prev) => ({ ...prev, [field]: formattedValue }))
    setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  // Validar campos
  const validateForm = () => {
    const newErrors = {
      titular: "",
      numeroTarjeta: "",
      expiracion: "",
      cvc: "",
    }

    if (!formData.titular.trim()) {
      newErrors.titular = "El titular es requerido"
    }

    const cardNumber = formData.numeroTarjeta.replace(/\s/g, "")
    if (!cardNumber) {
      newErrors.numeroTarjeta = "El número de tarjeta es requerido"
    } else if (cardNumber.length < 13 || cardNumber.length > 16) {
      newErrors.numeroTarjeta = "Número de tarjeta inválido"
    }

    if (!formData.expiracion) {
      newErrors.expiracion = "La fecha de expiración es requerida"
    } else if (formData.expiracion.length !== 5) {
      newErrors.expiracion = "Formato inválido (MM/YY)"
    }

    if (!formData.cvc) {
      newErrors.cvc = "El CVC es requerido"
    } else if (formData.cvc.length < 3) {
      newErrors.cvc = "CVC inválido"
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some((error) => error !== "")
  }

  // Manejar pago
  const handlePagar = async () => {
    if (!validateForm()) return

    setLoading(true)

    // Simulación de procesamiento de pago (2 segundos)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setLoading(false)
    onConfirm()

    // Resetear formulario
    setFormData({
      titular: "",
      numeroTarjeta: "",
      expiracion: "",
      cvc: "",
    })
  }

  // Detectar tipo de tarjeta
  const getCardType = () => {
    const number = formData.numeroTarjeta.replace(/\s/g, "")
    if (number.startsWith("4")) return "Visa"
    if (number.startsWith("5")) return "Mastercard"
    if (number.startsWith("3")) return "American Express"
    return "Tarjeta"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="h-6 w-6 text-blue-600" />
            Procesar Pago
          </DialogTitle>
          <DialogDescription>
            Ingresa los datos de tu tarjeta para completar el pago
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Información del monto */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monto a pagar</p>
                <p className="text-sm text-gray-500 mt-1">{descripcion}</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                ${monto.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Formulario de tarjeta */}
          <div className="space-y-4">
            {/* Titular */}
            <div className="space-y-2">
              <Label htmlFor="titular">Titular de la Tarjeta</Label>
              <Input
                id="titular"
                placeholder="NOMBRE APELLIDO"
                value={formData.titular}
                onChange={(e) =>
                  handleChange("titular", e.target.value.toUpperCase())
                }
                className={errors.titular ? "border-red-500" : ""}
              />
              {errors.titular && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.titular}
                </p>
              )}
            </div>

            {/* Número de tarjeta */}
            <div className="space-y-2">
              <Label htmlFor="numeroTarjeta">Número de Tarjeta</Label>
              <div className="relative">
                <Input
                  id="numeroTarjeta"
                  placeholder="1234 5678 9012 3456"
                  value={formData.numeroTarjeta}
                  onChange={(e) => handleChange("numeroTarjeta", e.target.value)}
                  className={`pr-20 ${errors.numeroTarjeta ? "border-red-500" : ""}`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                  {formData.numeroTarjeta && (
                    <span className="text-xs text-gray-500 font-medium">
                      {getCardType()}
                    </span>
                  )}
                </div>
              </div>
              {errors.numeroTarjeta && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.numeroTarjeta}
                </p>
              )}
            </div>

            {/* Expiración y CVC */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiracion">Expiración</Label>
                <Input
                  id="expiracion"
                  placeholder="MM/YY"
                  value={formData.expiracion}
                  onChange={(e) => handleChange("expiracion", e.target.value)}
                  className={errors.expiracion ? "border-red-500" : ""}
                />
                {errors.expiracion && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.expiracion}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <div className="relative">
                  <Input
                    id="cvc"
                    placeholder="123"
                    value={formData.cvc}
                    onChange={(e) => handleChange("cvc", e.target.value)}
                    className={errors.cvc ? "border-red-500" : ""}
                    type="password"
                    maxLength={4}
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {errors.cvc && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.cvc}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Mensaje de seguridad */}
          <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <Lock className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p>
              Tu información está protegida con encriptación SSL. Esta es una
              transacción segura simulada para propósitos de demostración.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handlePagar}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Procesando...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Pagar ${monto.toFixed(2)}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
