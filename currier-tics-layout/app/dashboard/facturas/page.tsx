"use client";

import { Suspense } from "react";
import { Documentos } from "@/components/dashboards/documentos";

/**
 * Página de Documentos (Centro de Documentos)
 * Muestra importaciones y envíos nacionales con gestión de guías PDF
 */
export default function FacturasPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Cargando centro de documentos...</div>}>
      <Documentos />
    </Suspense>
  );
}
