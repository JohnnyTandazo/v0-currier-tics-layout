"use client"

import dynamic from "next/dynamic"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import ShippingLabel from "@/components/pdf/shipping-label"

// Importación dinámica de PDFViewer con SSR deshabilitado
// Esto es crítico porque PDFViewer no puede renderizarse en el servidor
const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full">
        <p className="text-gray-500">Cargando visor de PDF...</p>
      </div>
    ),
  }
)

interface Envio {
  id?: string | number
  numeroTracking?: string
  usuario?: {
    nombre?: string
    email?: string
  }
  descripcion?: string
  pesoLibras?: number
  valorDeclarado?: number
  ciudad?: string
  direccion?: string
  estado?: string
  fechaCreacion?: string
}

interface PDFPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  envio: Envio | null
}

export function PDFPreviewModal({ isOpen, onClose, envio }: PDFPreviewModalProps) {
  if (!envio) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[85vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>Vista Previa - Etiqueta de Envío #{envio?.numeroTracking || "N/A"}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div className="w-full h-full min-h-[500px]">
            <PDFViewer width="100%" height="100%" showToolbar={true}>
              <ShippingLabel envio={envio} />
            </PDFViewer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
