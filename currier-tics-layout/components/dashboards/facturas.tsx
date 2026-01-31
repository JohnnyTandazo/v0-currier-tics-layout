"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  FileText, 
  Printer, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Building,
  CreditCard
} from "lucide-react";
import { PaymentModal } from "./payment-modal";

interface Paquete {
  id: number;
  tracking: string;
  trackingNumber?: string;
  descripcion: string;
  peso: number;
  estado: string;
  usuarioId?: number;
  usuario?: { id: number; nombre?: string; email?: string };
  precio?: number;
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

type FiltroTab = "todas" | "pendientes" | "pagadas";

const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    
    .print-container,
    .print-container * {
      visibility: visible;
    }
    
    .print-container {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      background: white;
    }
    
    .no-print {
      display: none !important;
    }
    
    @page {
      margin: 1.5cm;
      size: letter;
    }
    
    .print-header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #000;
      padding-bottom: 20px;
    }
    
    .print-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    
    .print-table th,
    .print-table td {
      border: 1px solid #333;
      padding: 10px;
      text-align: left;
      font-size: 12px;
    }
    
    .print-table th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    
    .print-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #333;
      text-align: center;
      font-size: 10px;
    }
  }
`;

export function Facturas() {
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [paquetesFiltrados, setPaquetesFiltrados] = useState<Paquete[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [filtroActivo, setFiltroActivo] = useState<FiltroTab>("todas");
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Paquete | null>(null);
  const [isFacturaModalOpen, setIsFacturaModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paqueteAPagar, setPaqueteAPagar] = useState<Paquete | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("usuario");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) {
          setUsuario(parsed);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Error parsing usuario:", err);
      setLoading(false);
    }
  }, []);

  const cargarPaquetes = async () => {
    if (!usuario || !usuario.id) return;

    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("NEXT_PUBLIC_API_URL no está configurada");
      }

      const response = await fetch(`${apiUrl}/api/paquetes`);

      if (!response.ok) {
        throw new Error("Error al obtener paquetes");
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        const misPaquetes = data.filter(
          (p: Paquete) =>
            String(p.usuarioId || p.usuario?.id) === String(usuario.id)
        );

        const paquetesConPrecio = misPaquetes.filter(
          (p) =>
            p.precio && 
            p.precio > 0 &&
            (
              p.estado?.toUpperCase() === "POR_PAGAR" ||
              p.estado?.toUpperCase() === "PAGADO" ||
              p.estado?.toUpperCase() === "ENTREGADO" ||
              p.estado?.toUpperCase() === "LIBERADO" ||
              p.pagado === true
            )
        );

        setPaquetes(paquetesConPrecio);
        aplicarFiltro(paquetesConPrecio, filtroActivo);
      } else {
        setPaquetes([]);
        setPaquetesFiltrados([]);
      }
    } catch (err) {
      console.error("Error fetching paquetes:", err);
      setPaquetes([]);
      setPaquetesFiltrados([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPaquetes();
  }, [usuario]);

  const aplicarFiltro = (paquetesBase: Paquete[], filtro: FiltroTab) => {
    let filtrados: Paquete[] = [];

    switch (filtro) {
      case "todas":
        filtrados = paquetesBase;
        break;
      case "pendientes":
        filtrados = paquetesBase.filter(
          (p) =>
            !p.pagado &&
            (p.estado?.toUpperCase() === "POR_PAGAR" ||
              p.estado?.toUpperCase() === "LIBERADO")
        );
        break;
      case "pagadas":
        filtrados = paquetesBase.filter(
          (p) =>
            p.pagado === true ||
            p.estado?.toUpperCase() === "PAGADO" ||
            p.estado?.toUpperCase() === "ENTREGADO"
        );
        break;
      default:
        filtrados = paquetesBase;
    }

    setPaquetesFiltrados(filtrados);
  };

  const handleCambiarFiltro = (filtro: FiltroTab) => {
    setFiltroActivo(filtro);
    aplicarFiltro(paquetes, filtro);
  };

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return "-";
    try {
      return new Date(fecha).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

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

  const getEstadoBadge = (paquete: Paquete) => {
    const isPagado = paquete.pagado === true || 
                     paquete.estado?.toUpperCase() === "PAGADO" || 
                     paquete.estado?.toUpperCase() === "ENTREGADO";

    if (isPagado) {
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Pagado
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <Clock className="h-3 w-3 mr-1" />
          Pendiente
        </Badge>
      );
    }
  };

  const esPendientePago = (paquete: Paquete) => {
    return (
      !paquete.pagado &&
      (paquete.estado?.toUpperCase() === "POR_PAGAR" ||
        paquete.estado?.toUpperCase() === "LIBERADO")
    );
  };

  const estaPagado = (paquete: Paquete) => {
    return (
      paquete.pagado === true ||
      paquete.estado?.toUpperCase() === "PAGADO" ||
      paquete.estado?.toUpperCase() === "ENTREGADO"
    );
  };

  const handleAbrirPago = (paquete: Paquete) => {
    setPaqueteAPagar(paquete);
    setIsPaymentModalOpen(true);
  };

  const handleConfirmarPago = async () => {
    if (!paqueteAPagar) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) throw new Error("API URL no configurada");

      const response = await fetch(`${apiUrl}/api/paquetes/${paqueteAPagar.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pagado: true,
          estado: "PAGADO",
          fechaPago: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setIsPaymentModalOpen(false);
        setPaqueteAPagar(null);
        alert("✅ Pago procesado correctamente. Puedes descargar tu factura.");
        await cargarPaquetes();
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.message || errorData.error || "Error desconocido";
        alert(`❌ Error al procesar el pago: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error al procesar pago:", error);
      alert("❌ Error de conexión al procesar el pago");
    }
  };

  const handleImprimirFactura = (paquete: Paquete) => {
    setFacturaSeleccionada(paquete);
    setIsFacturaModalOpen(true);
    
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const totalGeneral = paquetesFiltrados.reduce((sum, p) => sum + (p.precio || 0), 0);
  const totalPendiente = paquetes
    .filter((p) => esPendientePago(p))
    .reduce((sum, p) => sum + (p.precio || 0), 0);
  const totalPagado = paquetes
    .filter((p) => estaPagado(p))
    .reduce((sum, p) => sum + (p.precio || 0), 0);

  const cantidadPendientes = paquetes.filter((p) => esPendientePago(p)).length;
  const cantidadPagadas = paquetes.filter((p) => estaPagado(p)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando historial financiero...</p>
        </div>
      </div>
    );
  }

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
                Debes iniciar sesión para ver tu historial financiero.
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
      <style>{printStyles}</style>

      <div className="space-y-6">
        <div className="no-print">
          <h1 className="text-3xl font-bold text-gray-900">Historial Financiero</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tus pagos y descarga tus facturas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
          <Card className="border-l-4 border-red-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pendiente de Pago</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${totalPendiente.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {cantidadPendientes} paquete{cantidadPendientes !== 1 ? "s" : ""}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-green-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Pagado</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${totalPagado.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {cantidadPagadas} paquete{cantidadPagadas !== 1 ? "s" : ""}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total General</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${(totalPendiente + totalPagado).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {paquetes.length} paquete{paquetes.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md">
          <CardHeader className="no-print">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Transacciones
              </CardTitle>

              <Tabs value={filtroActivo} onValueChange={(v) => handleCambiarFiltro(v as FiltroTab)}>
                <TabsList className="grid w-full md:w-auto grid-cols-3">
                  <TabsTrigger value="todas" className="text-xs md:text-sm">
                    Todas ({paquetes.length})
                  </TabsTrigger>
                  <TabsTrigger value="pendientes" className="text-xs md:text-sm">
                    Pendientes ({cantidadPendientes})
                  </TabsTrigger>
                  <TabsTrigger value="pagadas" className="text-xs md:text-sm">
                    Pagadas ({cantidadPagadas})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>

          <CardContent>
            {paquetesFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  No hay transacciones en esta categoría
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {filtroActivo === "pendientes" && "No tienes pagos pendientes"}
                  {filtroActivo === "pagadas" && "No has realizado pagos aún"}
                  {filtroActivo === "todas" && "No tienes transacciones registradas"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Fecha</TableHead>
                      <TableHead className="font-semibold">Tracking</TableHead>
                      <TableHead className="font-semibold">Concepto</TableHead>
                      <TableHead className="font-semibold">Monto</TableHead>
                      <TableHead className="font-semibold">Estado</TableHead>
                      <TableHead className="font-semibold text-right no-print">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paquetesFiltrados.map((paquete) => (
                      <TableRow key={paquete.id} className="hover:bg-gray-50">
                        <TableCell className="text-gray-700 text-sm">
                          {formatearFechaCorta(paquete.fechaPago || paquete.fechaCreacion || paquete.createdAt)}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-blue-600 font-medium">
                          {paquete.tracking || paquete.trackingNumber}
                        </TableCell>
                        <TableCell className="text-gray-700 max-w-[250px] truncate">
                          {paquete.descripcion || "Servicio de envío"}
                        </TableCell>
                        <TableCell className="font-semibold text-lg">
                          ${paquete.precio?.toFixed(2) || "0.00"}
                        </TableCell>
                        <TableCell>{getEstadoBadge(paquete)}</TableCell>
                        <TableCell className="text-right no-print">
                          <div className="flex items-center justify-end gap-2">
                            {esPendientePago(paquete) && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleAbrirPago(paquete)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                <DollarSign className="h-4 w-4 mr-1" />
                                Pagar
                              </Button>
                            )}

                            {estaPagado(paquete) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleImprimirFactura(paquete)}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              >
                                <Printer className="h-4 w-4 mr-1" />
                                Imprimir
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-6 flex justify-end border-t pt-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Total {filtroActivo === "pendientes" ? "Pendiente" : filtroActivo === "pagadas" ? "Pagado" : "General"}
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${totalGeneral.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaqueteAPagar(null);
        }}
        onConfirm={handleConfirmarPago}
        monto={paqueteAPagar?.precio || 0}
        descripcion={`Pago de paquete ${paqueteAPagar?.tracking || paqueteAPagar?.trackingNumber || ""}`}
      />

      <Dialog open={isFacturaModalOpen} onOpenChange={setIsFacturaModalOpen}>
        <DialogContent className="sm:max-w-[700px] print-container">
          <DialogHeader className="no-print">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              Factura de Pago
            </DialogTitle>
          </DialogHeader>

          {facturaSeleccionada && (
            <div className="space-y-6">
              <div className="border-b-2 pb-6 print-header">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <Building className="h-12 w-12 text-blue-600" />
                    <div>
                      <h2 className="text-2xl font-bold">COURIER EXPRESS</h2>
                      <p className="text-sm text-gray-600">Sistema de Gestión de Paquetes</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Email: info@courierexpress.com | Tel: +1 (305) 123-4567
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                      <p className="text-sm font-semibold">FACTURA</p>
                      <p className="text-lg font-bold">#{facturaSeleccionada.id.toString().padStart(6, "0")}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-6">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-2 uppercase">Facturado a:</h3>
                    <p className="font-semibold text-lg">{usuario.nombre}</p>
                    <p className="text-sm text-gray-600">{usuario.email}</p>
                  </div>
                  <div className="text-right">
                    <h3 className="font-semibold text-sm text-gray-500 mb-2 uppercase">Fecha de Pago:</h3>
                    <p className="font-semibold text-lg">
                      {formatearFecha(facturaSeleccionada.fechaPago || facturaSeleccionada.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Detalles del Servicio
                </h3>
                <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Número de Tracking</p>
                      <p className="font-mono font-semibold text-lg">{facturaSeleccionada.tracking || facturaSeleccionada.trackingNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Estado del Pago</p>
                      <div className="mt-1">{getEstadoBadge(facturaSeleccionada)}</div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Descripción del Servicio</p>
                    <p className="font-medium">
                      {facturaSeleccionada.descripcion || "Servicio de envío internacional"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Peso del Paquete</p>
                      <p className="font-medium">
                        {facturaSeleccionada.peso ? `${facturaSeleccionada.peso} lbs` : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fecha de Registro</p>
                      <p className="font-medium">
                        {formatearFechaCorta(facturaSeleccionada.fechaCreacion || facturaSeleccionada.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t-2 pt-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold text-lg">
                      ${facturaSeleccionada.precio?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">IVA (0%):</span>
                    <span className="font-semibold text-lg">$0.00</span>
                  </div>
                  <div className="border-t-2 border-blue-200 mt-4 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold">TOTAL PAGADO:</span>
                      <span className="text-3xl font-bold text-green-600">
                        ${facturaSeleccionada.precio?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 print-footer text-center text-xs text-gray-500">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="font-semibold text-green-600">Pago Verificado y Procesado</p>
                </div>
                <p>Gracias por usar nuestros servicios de envío internacional</p>
                <p className="mt-1">
                  Esta factura fue generada electrónicamente el{" "}
                  {formatearFecha(new Date().toISOString())}
                </p>
                <p className="mt-2 font-semibold">
                  Para cualquier consulta, contáctenos a soporte@courierexpress.com
                </p>
              </div>

              <div className="flex justify-end gap-3 no-print pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsFacturaModalOpen(false)}
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Factura
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

