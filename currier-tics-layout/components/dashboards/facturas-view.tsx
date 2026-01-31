"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Factura {
  id: number;
  numeroFactura: string;
  fecha: string;
  total: number;
  estadoPago: string;
}

export default function FacturasView() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFacturas = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          throw new Error("NEXT_PUBLIC_API_URL is not configured");
        }

        const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
        const usuarioId = usuario.id;

        if (!usuarioId) {
          throw new Error("User not authenticated");
        }

        const url = `${apiUrl}/api/paquetes?usuarioId=${usuarioId}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const filteredFacturas = (Array.isArray(data) ? data : []).filter(
          (pkg) => pkg.estado === "ENTREGADO" || pkg.estado === "POR_PAGAR"
        ).map((pkg) => ({
          id: pkg.id,
          numeroFactura: pkg.trackingId,
          fecha: pkg.fecha,
          total: pkg.total,
          estadoPago: pkg.estado,
        }));
        setFacturas(filteredFacturas);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setFacturas([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFacturas();
  }, []);

  const descargarPDF = () => {
    window.print();
  };

  if (isLoading) {
    return <p>Loading invoices...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Facturas</h1>
      <Button onClick={descargarPDF} className="mb-4">
        Descargar PDF
      </Button>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {facturas.map((factura) => (
            <TableRow key={factura.id}>
              <TableCell>{factura.numeroFactura}</TableCell>
              <TableCell>{factura.fecha}</TableCell>
              <TableCell>${factura.total.toFixed(2)}</TableCell>
              <TableCell>{factura.estadoPago}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}