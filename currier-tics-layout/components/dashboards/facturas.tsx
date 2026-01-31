"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Paquete {
  id: number;
  trackingNumber: string;
  descripcion: string;
  precio: number;
}

export function Facturas() {
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        setPaquetes(data);
      } catch (error) {
        console.error("Error al obtener paquetes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaquetes();
  }, []);

  const imprimirFactura = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Facturas</h1>
      {isLoading ? (
        <p>Cargando paquetes...</p>
      ) : (
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
      )}
      <Button onClick={imprimirFactura} className="mt-4">
        Imprimir Factura
      </Button>
    </div>
  );
}
