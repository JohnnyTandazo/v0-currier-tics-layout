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
        <div>
          {/* Selector de método de pago */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Método de Pago</label>
            <select
              className="w-full border rounded px-3 py-2"
              // value={metodoPago} // Debes enlazar esto a tu estado real
              // onChange={e => setMetodoPago(e.target.value)}
              required
            >
              <option value="">Selecciona un método</option>
              <option value="TRANSFERENCIA">Transferencia Bancaria</option>
              <option value="CHEQUE">Cheque o Depósito Bancario</option>
            </select>
          </div>

          {/* Sección de cuentas bancarias */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Banco Pichincha */}
              <div>
                <div className="font-bold flex items-center gap-1 mb-2">
                  <span role="img" aria-label="banco">🏦</span> Banco Pichincha
                </div>
                <div className="text-sm">
                  <div><span className="font-semibold">Cta. Corriente:</span> 1234567890</div>
                  <div><span className="font-semibold">Cta. Ahorros:</span> 0987654321</div>
                  <div><span className="font-semibold">Titular:</span> Currier TICS</div>
                </div>
              </div>
              {/* Banco Guayaquil */}
              <div>
                <div className="font-bold flex items-center gap-1 mb-2">
                  <span role="img" aria-label="banco">🏦</span> Banco Guayaquil
                </div>
                <div className="text-sm">
                  <div><span className="font-semibold">Cta. Corriente:</span> 1122334455</div>
                  <div><span className="font-semibold">Cta. Ahorros:</span> 5544332211</div>
                  <div><span className="font-semibold">Titular:</span> Currier TICS</div>
                </div>
              </div>
              {/* Banco del Austro */}
              <div>
                <div className="font-bold flex items-center gap-1 mb-2">
                  <span role="img" aria-label="banco">🏦</span> Banco del Austro
                </div>
                <div className="text-sm">
                  <div><span className="font-semibold">Cta. Corriente:</span> 9988776655</div>
                  <div><span className="font-semibold">Cta. Ahorros:</span> 5566778899</div>
                  <div><span className="font-semibold">Titular:</span> Currier TICS</div>
                </div>
              </div>
            </div>
          </div>

          {/* Información del monto */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
