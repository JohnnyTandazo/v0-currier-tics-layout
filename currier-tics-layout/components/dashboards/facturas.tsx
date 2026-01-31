"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Paquete {
  id: number;
  trackingNumber: string;
  descripcion: string;
  precio: number;
  usuarioId: number;
  estado?: string;
}

const printStyles = `
  @media print {
    body * { visibility: hidden; }
    #factura-content, #factura-content * { visibility: visible; }
    #factura-content { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; }
    .no-print { display: none !important; }
  }
`;

export function Facturas() {
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usuario, setUsuario] = useState<{
    id: number;
    nombre: string;
  } | null>(null);

  useEffect(() => {
    const fetchPaquetes = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          throw new Error("NEXT_PUBLIC_API_URL no está configurada");
        }

        const response = await fetch(`${apiUrl}/api/paquetes?estado=POR_PAGAR`);
        if (!response.ok) {
          throw new Error(`Error al obtener paquetes: ${response.status}`);
        }

        const data = await response.json();

        const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
        if (!usuario || !usuario.id) {
          console.error("Usuario no autenticado o inválido");
          setPaquetes([]);
          return;
        }

        const misFacturas = Array.isArray(data)
          ? data.filter(
              (p: any) =>
                (p.estado === "PAGADO" || p.estado === "LIBERADO") &&
                String(p.usuarioId || p.usuario?.id) === String(usuario.id)
            )
          : [];
        console.log("Facturas filtradas:", misFacturas);

        setPaquetes(misFacturas);
      } catch (error) {
        console.error("Error al obtener paquetes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaquetes();
  }, [usuario]);

  const imprimirFactura = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <style>{printStyles}</style>
      <h1 className="text-2xl font-bold">Facturas</h1>
      {isLoading ? (
        <p>Cargando paquetes...</p>
      ) : (
        <div id="factura-content">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número de Guía</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Precio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paquetes.map((paquete) => (
              <TableRow key={paquete.id}>
                <TableCell>{paquete.trackingNumber}</TableCell>
                <TableCell>{paquete.descripcion}</TableCell>
                <TableCell>${paquete.precio.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </div>
      )}
      <Button onClick={imprimirFactura} className="mt-4 no-print">
        Imprimir Factura
      </Button>
    </div>
  );
}
