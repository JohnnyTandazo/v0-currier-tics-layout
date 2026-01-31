"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * COMPONENTE DE REDIRECCIÓN
 * Este componente redirige automáticamente a /dashboard/facturas
 * ya que ahora Facturas es el historial unificado de pagos
 */
export function Pagos() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir inmediatamente a facturas
    router.replace("/dashboard/facturas");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600 font-medium">Redirigiendo al historial de pagos...</p>
      </div>
    </div>
  );
}
