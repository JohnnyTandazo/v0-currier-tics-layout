"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  FileText, 
  Printer, 
  Eye, 
  CheckCircle,
  AlertCircle,
  Building
} from "lucide-react";

interface Paquete {
  id: number;
  trackingNumber: string;
  tracking?: string;
  descripcion: string;
  precio: number;
  peso?: number;
  usuarioId: number;
  usuario?: { id: number; nombre?: string; email?: string };
  estado?: string;
  pagado?: boolean;
  fechaCreacion?: string;
  createdAt?: string;
  fechaPago?: string;
}

interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

const printStyles = `
  @media print {
    /* Ocultar todo excepto el contenido de impresión */
    body * {
      visibility: hidden;
    }
    
    /* Mostrar solo el contenedor de impresión */
    .print-container,
    .print-container * {
      visibility: visible;
    }
    
    .print-container {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    
    /* Ocultar elementos que no deben imprimirse */
    .no-print {
      display: none !important;
    }
    
    /* Estilos específicos para impresión */
    @page {
      margin: 1cm;
    }
    
    .print-header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #000;
      padding-bottom: 20px;
    }
    
    .print-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .print-table th,
    .print-table td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
    }
    
    .print-table th {
      background-color: #f0f0f0;
    }
  }
`;

export function Facturas() {
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Paquete | null>(null);
  const [isFacturaModalOpen, setIsFacturaModalOpen] = useState(false);

  useEffect(() => {
    const fetchPaquetes = async () => {
      try {
        const usuarioStored = JSON.parse(localStorage.getItem("usuario") || "null");
        if (!usuarioStored || !usuarioStored.id) {
          console.log("Usuario no autenticado");
          setUsuario(null);
          setPaquetes([]);
          setIsLoading(false);
          return;
        }
        
        setUsuario(usuarioStored);
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          throw new Error("NEXT_PUBLIC_API_URL no está configurada");
        }

        const response = await fetch(`${apiUrl}/api/paquetes`);
        if (!response.ok) {
          throw new Error(`Error al obtener paquetes: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          setPaquetes([]);
          return;
        }

        // FILTRADO ESTRICTO: Solo paquetes del usuario actual Y solo PAGADOS o ENTREGADOS
        const misFacturas = data.filter(
          (p: any) =>
            String(p.usuarioId || p.usuario?.id) === String(usuarioStored.id) &&
            (p.pagado === true || 
             p.estado?.toUpperCase() === "PAGADO" || 
             p.estado?.toUpperCase() === "ENTREGADO")
        );
        
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

  // Formatear fecha
  const formatearFecha = (fecha?: string) => {
    if (!fecha) return "-";
    try {
      return new Date(fecha).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  // Formatear fecha corta
  const formatearFechaCorta = (fecha?: string) => {
    if (!fecha) return "-";
    try {
      return new Date(fecha).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  // Imprimir reporte general
  const handleImprimirReporteGeneral = () => {
    window.print();
  };

  // Ver factura individual
  const handleVerFactura = (paquete: Paquete) => {
    setFacturaSeleccionada(paquete);
    setIsFacturaModalOpen(true);
  };

  // Imprimir factura individual
  const imprimirFactura = () => {
    window.print();
  };

  // Calcular totales
  const totalPagado = paquetes.reduce((sum, p) => sum + (p.precio || 0), 0);

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando facturas...</p>
        </div>
      </div>
    );
  }

  // Sin sesión
  if (!usuario) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Sesión requerida
              </h2>
              <p className="text-gray-600 mb-6">
                Debes iniciar sesión para ver tus facturas.
              </p>
              <a
                href="/login"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Iniciar Sesión
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Inyectar estilos de impresión */}
      <style>{printStyles}</style>

      <div className="space-y-6">
        {/* Header - No se imprime */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Facturas y Pagos</h1>
            <p className="text-gray-600 mt-1">
              Historial de paquetes pagados y entregados
            </p>
          </div>

          {/* Botón Descargar Reporte General */}
          <Button
            onClick={handleImprimirReporteGeneral}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            size="lg"
          >
            <Printer className="h-5 w-5" />
            Descargar Reporte General
          </Button>
        </div>

        {/* Contenedor de impresión */}
        <div className="print-container">
          {/* Header de impresión (solo visible al imprimir) */}
          <div className="print-header hidden print:block">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Building className="h-12 w-12" />
              <div>
                <h1 className="text-2xl font-bold">COURIER EXPRESS</h1>
                <p className="text-sm">Sistema de Gestión de Paquetes</p>
              </div>
            </div>
            <p className="text-sm mt-2">Cliente: {usuario.nombre}</p>
            <p className="text-sm">Email: {usuario.email}</p>
            <p className="text-sm">Fecha: {formatearFecha(new Date().toISOString())}</p>
          </div>

          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-l-4 border-green-500 shadow-sm">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Pagado</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${totalPagado.toFixed(2)}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-blue-500 shadow-sm">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Facturas</p>
                    <p className="text-2xl font-bold">{paquetes.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-purple-500 shadow-sm">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Promedio</p>
                    <p className="text-2xl font-bold text-purple-600">
                      ${paquetes.length > 0 ? (totalPagado / paquetes.length).toFixed(2) : "0.00"}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de facturas */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Historial de Pagos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paquetes.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No tienes facturas disponibles</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Las facturas aparecerán aquí cuando realices pagos
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="print-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Fecha Pago</TableHead>
                        <TableHead className="font-semibold">Tracking</TableHead>
                        <TableHead className="font-semibold">Descripción</TableHead>
                        <TableHead className="font-semibold">Peso</TableHead>
                        <TableHead className="font-semibold">Monto</TableHead>
                        <TableHead className="font-semibold">Estado</TableHead>
                        <TableHead className="font-semibold text-right no-print">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paquetes.map((paquete) => (
                        <TableRow key={paquete.id} className="hover:bg-gray-50">
                          <TableCell className="text-gray-700">
                            {formatearFechaCorta(paquete.fechaPago || paquete.createdAt)}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-blue-600 font-medium">
                            {paquete.trackingNumber || paquete.tracking}
                          </TableCell>
                          <TableCell className="text-gray-700 max-w-[200px] truncate">
                            {paquete.descripcion || "Sin descripción"}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {paquete.peso ? `${paquete.peso} lbs` : "-"}
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            ${paquete.precio?.toFixed(2) || "0.00"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Pagado
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right no-print">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVerFactura(paquete)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Factura
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Total al final */}
                  <div className="mt-6 flex justify-end border-t pt-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Pagado</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${totalPagado.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Factura Individual */}
      <Dialog open={isFacturaModalOpen} onOpenChange={setIsFacturaModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              Factura de Pago
            </DialogTitle>
          </DialogHeader>

          {facturaSeleccionada && (
            <div className="print-container">
              {/* Header de la factura */}
              <div className="border-b pb-4 mb-4 print-header">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building className="h-10 w-10 text-blue-600" />
                    <div>
                      <h2 className="text-xl font-bold">COURIER EXPRESS</h2>
                      <p className="text-sm text-gray-500">Sistema de Gestión de Paquetes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">FACTURA</p>
                    <p className="text-xs text-gray-500">#{facturaSeleccionada.id}</p>
                  </div>
                </div>
              </div>

              {/* Información del cliente */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-sm text-gray-500 mb-2">CLIENTE</h3>
                  <p className="font-medium">{usuario.nombre}</p>
                  <p className="text-sm text-gray-600">{usuario.email}</p>
                </div>
                <div className="text-right">
                  <h3 className="font-semibold text-sm text-gray-500 mb-2">FECHA DE PAGO</h3>
                  <p className="font-medium">
                    {formatearFecha(facturaSeleccionada.fechaPago || facturaSeleccionada.createdAt)}
                  </p>
                </div>
              </div>

              {/* Detalles del paquete */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-3">Detalles del Paquete</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tracking:</span>
                    <span className="font-mono font-semibold">{facturaSeleccionada.trackingNumber || facturaSeleccionada.tracking}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Descripción:</span>
                    <span>{facturaSeleccionada.descripcion || "Sin descripción"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peso:</span>
                    <span>{facturaSeleccionada.peso ? `${facturaSeleccionada.peso} lbs` : "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Pagado
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">TOTAL PAGADO</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${facturaSeleccionada.precio?.toFixed(2) || "0.00"}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
                <p>Gracias por usar nuestros servicios</p>
                <p className="mt-1">Esta factura fue generada electrónicamente</p>
              </div>

              {/* Botón de imprimir (no se imprime) */}
              <div className="mt-6 flex justify-end gap-2 no-print">
                <Button
                  variant="outline"
                  onClick={() => setIsFacturaModalOpen(false)}
                >
                  Cerrar
                </Button>
                <Button
                  onClick={imprimirFactura}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

