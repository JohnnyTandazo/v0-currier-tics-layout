import { redirect } from "next/navigation";

/**
 * PÁGINA DE REDIRECCIÓN
 * Esta página redirige automáticamente a /dashboard/facturas
 * ya que "Facturas y Pagos" ahora es el historial unificado
 */
export default function PagosPage() {
  redirect("/dashboard/facturas");
}
