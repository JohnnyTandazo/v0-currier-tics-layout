

"use client"

import { useEffect, useState } from "react"
import ProtectedRoute from "../ProtectedRoute"
import { Check, ImageIcon, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { withAuthHeaders } from "@/lib/authHeaders"
import { toast } from "react-hot-toast"

interface PagoPendiente {
  id: number;
  monto: number;
  comprobante?: string | null;
  envioId: number;
}

export function AdminPayments() {
  const [pagos, setPagos] = useState<PagoPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const formatCurrency = (value: number) => {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const cargarPagos = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) return;
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/pagos/pendientes`, {
        method: "GET",
        headers: withAuthHeaders({ "Content-Type": "application/json" }),
      });
      if (!res.ok) {
        setPagos([]);
        return;
      }
      const text = await res.text();
      const data = text && text.trim() !== "" ? JSON.parse(text) : [];
      setPagos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando pagos pendientes:", error);
      setPagos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPagos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAprobarPago = async (pagoId: number) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl || !pagoId) return;
    try {
      setActionId(pagoId);
      const res = await fetch(`${apiUrl}/api/operador/pagos/${pagoId}/verificar`, {
        method: "PUT",
        headers: withAuthHeaders({ "Content-Type": "application/json" }),
      });
      if (!res.ok) {
        toast.error(`Error verificando pago: ${res.statusText}`);
        return;
      }
      setPagos((prev) => prev.filter((p) => p.id !== pagoId));
      toast.success("Pago verificado correctamente.");
    } catch (error) {
      toast.error("Error verificando pago.");
    } finally {
      setActionId(null);
    }
  };

  const handleRechazarPago = async (pagoId: number) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl || !pagoId) return;
    try {
      setActionId(pagoId);
      const res = await fetch(`${apiUrl}/api/operador/pagos/${pagoId}/rechazar`, {
        method: "PUT",
        headers: withAuthHeaders({ "Content-Type": "application/json" }),
      });
      if (!res.ok) {
        toast.error(`Error rechazando pago: ${res.statusText}`);
        return;
      }
      setPagos((prev) => prev.filter((p) => p.id !== pagoId));
      toast.success("Pago rechazado correctamente.");
    } catch (error) {
      toast.error("Error rechazando pago.");
    } finally {
      setActionId(null);
    }
  };
  return (
    <ProtectedRoute>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Validacion de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Comprobante</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagos.map((pago) => (
                <TableRow key={pago.id}>
                  <TableCell>{pago.id}</TableCell>
                  <TableCell>${formatCurrency(pago.monto)}</TableCell>
                  <TableCell>
                    {pago.comprobante ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => window.open(pago.comprobante || '', "_blank")}
                        title="Ver comprobante"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">Sin comprobante</span>
                    )}
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="secondary"
                      disabled={actionId === pago.id}
                      onClick={() => handleAprobarPago(pago.id)}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Aprobar
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={actionId === pago.id}
                      onClick={() => handleRechazarPago(pago.id)}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Rechazar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </ProtectedRoute>
  );
}
