"use client"

import React from "react"

import { useState, useRef } from "react"
import { Upload, X, FileText, CheckCircle2 } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { withAuthHeaders } from "@/lib/authHeaders"

interface PreAlertModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const popularStores = [
  "Amazon",
  "eBay",
  "Walmart",
  "Shein",
  "iHerb",
  "AliExpress",
  "Best Buy",
  "Otra",
]

export function PreAlertModal({ open, onOpenChange }: PreAlertModalProps) {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [storeName, setStoreName] = useState("")
  const [customStore, setCustomStore] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [tipoEnvio, setTipoEnvio] = useState("NACIONAL"); // Default to NACIONAL

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("NEXT_PUBLIC_API_URL no está configurada");
      }

      // Get user from localStorage
      const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
      // ✅ LIMPIAR ID CORRUPTO: Extraer antes del : (1:1 → 1)
      const cleanId = usuario.id ? usuario.id.toString().split(':')[0].trim() : "1"
      const usuarioId = cleanId || 1;

      // Generate tracking number if not provided
      const generatedTrackingNumber = `TRK-${new Date()
        .toISOString()
        .replace(/[-:.TZ]/g, "")}`;
      const finalTrackingNumber = trackingNumber || generatedTrackingNumber;

      const esNacional = String(tipoEnvio || "").toUpperCase() === "NACIONAL" || String(tipoEnvio || "").toUpperCase() === "LOCAL"

      const payload = {
        trackingNumber: finalTrackingNumber,
        descripcion: description,
        origen: esNacional ? "Local" : "Miami",
        storeName: storeName === "otra" ? customStore : storeName,
      }

      // POST to backend
      const response = await fetch(`${apiUrl}/api/paquetes`, {
        method: "POST",
        headers: withAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("Pre-alerta guardada:", data);

      // Show success
      setIsSubmitting(false);
      setIsSuccess(true);

      // Reset after showing success
      setTimeout(() => {
        setIsSuccess(false);
        setTrackingNumber("");
        setStoreName("");
        setCustomStore("");
        setDescription("");
        setPrice("");
        setFile(null);
        setTipoEnvio("NACIONAL"); // Reset tipo_envio
        onOpenChange(false);
        window.location.reload(); // Refresh the page
      }, 2000);
    } catch (error) {
      setIsSubmitting(false);
      console.error("Error al guardar pre-alerta:", error);
      alert("Error al guardar la pre-alerta. Intenta de nuevo.");
    }
  };

  const isFormValid =
    tipoEnvio && // Ensure tipo_envio is selected
    (trackingNumber || true) &&
    (storeName || customStore) &&
    description &&
    price;

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20 mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold">Pre-Alerta Enviada</h3>
            <p className="text-muted-foreground text-center mt-2">
              Tu paquete ha sido registrado en nuestro sistema.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pre-alertar Paquete</DialogTitle>
          <DialogDescription>
            Registra tu paquete entrante para ayudarnos a procesarlo más rápido cuando llegue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tipo de Envío */}
          <div className="space-y-2">
            <Label htmlFor="tipo-envio">
              Tipo de Envío <span className="text-destructive">*</span>
            </Label>
            <Select value={tipoEnvio} onValueChange={setTipoEnvio}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione tipo de envío" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NACIONAL">Nacional</SelectItem>
                <SelectItem value="INTERNACIONAL">Internacional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tracking Number */}
          <div className="space-y-2">
            <Label htmlFor="prealert-tracking">
              Número de Guía <span className="text-destructive">*</span>
            </Label>
            <Input
              id="prealert-tracking"
              placeholder="Ingrese el número de rastreo de la tienda"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>

          {/* Store Name */}
          <div className="space-y-2">
            <Label htmlFor="store-name">
              Nombre de la Tienda <span className="text-destructive">*</span>
            </Label>
            <Select value={storeName} onValueChange={setStoreName}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione tienda" />
              </SelectTrigger>
              <SelectContent>
                {popularStores.map((store) => (
                  <SelectItem key={store} value={store.toLowerCase()}>
                    {store}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Store Input */}
          {storeName === "otra" && (
            <div className="space-y-2">
              <Label htmlFor="custom-store">Nombre de Tienda Personalizado</Label>
              <Input
                id="custom-store"
                placeholder="Ingrese el nombre de la tienda"
                value={customStore}
                onChange={(e) => setCustomStore(e.target.value)}
              />
            </div>
          )}

          {/* Product Description */}
          <div className="space-y-2">
            <Label htmlFor="product-description">
              Descripción del Producto <span className="text-destructive">*</span>
            </Label>
            <Input
              id="product-description"
              placeholder="Ej: Laptop HP, Zapatos Nike, Reloj..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Invoice Value */}
          <div className="space-y-2">
            <Label htmlFor="invoice-price">
              Valor de la Factura ($) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="invoice-price"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          {/* Invoice Upload */}
          <div className="space-y-2">
            <Label>Factura (Opcional)</Label>
            <div className="border-2 border-dashed rounded-lg p-4 transition-colors hover:border-primary/50">
              {!file ? (
                <div className="flex flex-col items-center justify-center text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Sube tu factura o recibo
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Elegir Archivo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    PDF, PNG o JPG hasta 10MB
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? "Enviando..." : "Enviar Pre-Alerta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
