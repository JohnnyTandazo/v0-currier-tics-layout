"use client";

import { Suspense } from "react";
import { Facturas } from "@/components/dashboards/facturas";

/**
 * Página de Facturas y Pagos (Historial Unificado)
 * Muestra el historial financiero completo del usuario
 */
export default function FacturasPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Cargando sistema de facturación...</div>}>
      <Facturas />
    </Suspense>
  );
}
