"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  CreditCard,
  Download,
  FileDown
} from "lucide-react";
import { PaymentModal } from "./payment-modal";
import { safeFetch } from "@/lib/safeFetch";
import { securePdfDownload } from "@/lib/securePdfDownload";
import { formatearFecha, formatearFechaCorta, formatearFechaHora } from "@/lib/formatDate";

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
    
    .highlight-row {
      background-color: #fef3c7 !important;
    }
  }
`;

export function Facturas() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [paquetesFiltrados, setPaquetesFiltrados] = useState<Paquete[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [usuarioToken, setUsuarioToken] = useState<string | null>(null);
  const [filtroActivo, setFiltroActivo] = useState<FiltroTab>("todas");
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Paquete | null>(null);
  const [isFacturaModalOpen, setIsFacturaModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paqueteAPagar, setPaqueteAPagar] = useState<Paquete | null>(null);

  // Obtener usuario del localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("usuario");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) {
          setUsuario(parsed);
          const token = parsed?.token ? String(parsed.token).trim() : null;
          setUsuarioToken(token);
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

  // Función MEJORADA para verificar si es pendiente de pago (CASE-INSENSITIVE)
  const esPendientePago = (paquete: Paquete): boolean => {
    // Normalizar estado
    const estado = (paquete.estado || "").toUpperCase().trim();
    
    // Verificar si NO está pagado
    const noPagado = paquete.pagado !== true;
    
    // Aceptar cualquier variación de estados pendientes
    const esPorPagar = 
      estado.includes("PAGAR") || 
      estado.includes("DEUDA") || 
      estado === "EN_BODEGA" ||
      estado === "LIBERADO" ||
      estado === "POR_PAGAR" ||
      estado === "PORPAGAR";
    
    return noPagado && esPorPagar;
  };

  // Función MEJORADA para verificar si está pagado (CASE-INSENSITIVE)
  const estaPagado = (paquete: Paquete): boolean => {
    // Normalizar estado
    const estado = (paquete.estado || "").toUpperCase().trim();
    
    // Aceptar cualquier variación de estados pagados
    const esPagadoEstado = 
      paquete.pagado === true ||
      estado.includes("PAGADO") ||
      estado.includes("ENTREGADO") ||
      estado.includes("LIBERADO") ||
      estado === "PAGADO" ||
      estado === "ENTREGADO";
    
    return esPagadoEstado;
  };

  // Función MEJORADA para cargar paquetes con FILTRO MÁS AMPLIO
  const cargarPaquetes = async () => {
    if (!usuario || !usuario.id) return;

    try {
      setLoading(true);
      // ✅ LIMPIAR ID CORRUPTO
      const cleanId = usuario.id.toString().split(':')[0].trim()
      console.log("🔄 Cargando paquetes para usuario - ID limpio:", cleanId);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("NEXT_PUBLIC_API_URL no está configurada");
      }

      const data = await safeFetch(`${apiUrl}/api/paquetes`);
      console.log("📦 Datos recibidos del backend:", data);

      if (Array.isArray(data)) {
        // FILTRADO ESTRICTO: Solo paquetes del usuario actual con ID limpio
        const misPaquetes = data.filter(
          (p: Paquete) =>
            String(p.usuarioId || p.usuario?.id) === String(cleanId)
        );

        console.log("👤 Paquetes del usuario:", misPaquetes);

        // FILTRADO AMPLIADO: Incluir paquetes con precio O con estados relevantes
        const paquetesRelevantes = misPaquetes.filter((p) => {
          // Normalizar estado
          const estado = (p.estado || "").toUpperCase().trim();
          
          // Incluir si tiene precio
          const tienePrecio = p.precio && p.precio > 0;
          
          // Incluir si es un estado financiero relevante (CASE-INSENSITIVE)
          const esEstadoRelevante = 
            estado.includes("PAGAR") ||
            estado.includes("PAGADO") ||
            estado.includes("ENTREGADO") ||
            estado.includes("LIBERADO") ||
            estado.includes("DEUDA") ||
            estado === "EN_BODEGA";
          
          return tienePrecio || esEstadoRelevante;
        });

        console.log("💰 Paquetes con precio/estados relevantes:", paquetesRelevantes);

        setPaquetes(paquetesRelevantes);
        
        // Aplicar filtro inicial
        const filtroInicial = searchParams?.get("action") === "pagar" ? "pendientes" : "todas";
        setFiltroActivo(filtroInicial as FiltroTab);
        aplicarFiltro(paquetesRelevantes, filtroInicial as FiltroTab);
      } else {
        console.warn("⚠️ Data no es array:", data);
        setPaquetes([]);
        setPaquetesFiltrados([]);
      }
    } catch (err) {
      console.error("❌ Error fetching paquetes:", err);
      setPaquetes([]);
      setPaquetesFiltrados([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch inicial de paquetes
  useEffect(() => {
    cargarPaquetes();
  }, [usuario]);

  // Manejar query params para auto-abrir modal de pago
  useEffect(() => {
    const action = searchParams?.get("action");
    const paqueteId = searchParams?.get("id");

    if (action === "pagar" && paqueteId && paquetes.length > 0) {
      const paquete = paquetes.find((p) => String(p.id) === paqueteId);
      if (paquete && esPendientePago(paquete)) {
        console.log("🔔 Auto-abriendo modal de pago para paquete:", paquete.tracking);
        handleAbrirPago(paquete);
        
        // Limpiar query params
        router.replace("/dashboard/facturas");
      }
    }
  }, [searchParams, paquetes]);

  // Aplicar filtro según tab seleccionado
  const aplicarFiltro = (paquetesBase: Paquete[], filtro: FiltroTab) => {
    let filtrados: Paquete[] = [];

    console.log(`🔍 Aplicando filtro: ${filtro}`);

    switch (filtro) {
      case "todas":
        filtrados = paquetesBase;
        break;
      case "pendientes":
        filtrados = paquetesBase.filter((p) => esPendientePago(p));
        break;
      case "pagadas":
        filtrados = paquetesBase.filter((p) => estaPagado(p));
        break;
      default:
        filtrados = paquetesBase;
    }

    console.log(`✅ Paquetes filtrados (${filtro}):`, filtrados);
    setPaquetesFiltrados(filtrados);
  };

  // Manejar cambio de tab
  const handleCambiarFiltro = (filtro: FiltroTab) => {
    setFiltroActivo(filtro);
    aplicarFiltro(paquetes, filtro);
  };

  // Obtener badge de estado
  const getEstadoBadge = (paquete: Paquete) => {
    if (estaPagado(paquete)) {
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

  // Abrir modal de pago
  const handleAbrirPago = (paquete: Paquete) => {
    console.log("💳 Abriendo modal de pago para paquete:", paquete);
    setPaqueteAPagar(paquete);
    setIsPaymentModalOpen(true);
  };

  // Confirmar pago (CORREGIDO CON DEBUGGING)
  const handleConfirmarPago = async () => {
    if (!paqueteAPagar) {
      console.error("❌ No hay paquete seleccionado para pagar");
      return;
    }

    const paqueteId = paqueteAPagar.id;
    console.log("🆔 ID del paquete a pagar:", paqueteId);

    if (!paqueteId) {
      alert("❌ Error: ID del paquete no válido");
      return;
    }

    try {
      console.log("📤 Enviando solicitud de pago para paquete:", paqueteId);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) throw new Error("API URL no configurada");

      const url = `${apiUrl}/api/paquetes/${paqueteId}`;
      console.log("🌐 URL:", url);

      const body = {
        pagado: true,
        estado: "PAGADO",
        fechaPago: new Date().toISOString(),
      };
      console.log("📋 Body:", body);

      const result = await safeFetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

    console.log("✅ Pago procesado exitosamente:", result);
        
      setIsPaymentModalOpen(false);
      setPaqueteAPagar(null);
      alert("✅ Pago procesado correctamente. Puedes descargar tu factura.");
      
      // Recargar datos
      await cargarPaquetes();
    } catch (error) {
      console.error("❌ Error de red al procesar pago:", error);
      alert("❌ Error de conexión al procesar el pago. Verifica tu conexión e intenta de nuevo.");
    }
  };

  // Ver/Imprimir factura individual
  const handleImprimirFactura = (paquete: Paquete) => {
    setFacturaSeleccionada(paquete);
    setIsFacturaModalOpen(true);
    
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // NUEVO: Imprimir reporte de todos los pagos
  const handleImprimirReporte = () => {
    const paquetesPagados = paquetes.filter((p) => estaPagado(p));
    
    if (paquetesPagados.length === 0) {
      alert("⚠️ No hay pagos realizados para generar el reporte");
      return;
    }

    // Cambiar a la tab de pagadas antes de imprimir
    setFiltroActivo("pagadas");
    aplicarFiltro(paquetes, "pagadas");
    
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // NUEVO: Descargar PDF individual (con autenticación)
  const handleDescargarPDF = async (paquete: Paquete) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      alert("❌ Error: URL del API no configurada");
      return;
    }

    await securePdfDownload({
      url: `${apiUrl}/api/facturas/${paquete.id}/pdf`,
      nombreArchivo: `factura-${paquete.id}.pdf`,
      token: usuarioToken || undefined,
    });
  };

  // Calcular totales
  const totalGeneral = paquetesFiltrados.reduce((sum, p) => sum + (p.precio || 0), 0);
  const totalPendiente = paquetes
    .filter((p) => esPendientePago(p))
    .reduce((sum, p) => sum + (p.precio || 0), 0);
  const totalPagado = paquetes
    .filter((p) => estaPagado(p))
    .reduce((sum, p) => sum + (p.precio || 0), 0);

  // Contadores
  const cantidadPendientes = paquetes.filter((p) => esPendientePago(p)).length;
  const cantidadPagadas = paquetes.filter((p) => estaPagado(p)).length;

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando sistema de facturación...</p>
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
                Debes iniciar sesión para gestionar tus pagos y facturas.
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Pagos y Facturas</h1>
          <p className="text-gray-600 mt-1">
            Administra tus pagos pendientes y descarga tus facturas
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

              <div className="flex flex-col md:flex-row items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImprimirReporte}
                  disabled={cantidadPagadas === 0}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-blue-300"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  📄 Reporte de Pagos
                </Button>

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
                {paquetes.length > 0 && filtroActivo !== "todas" && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => handleCambiarFiltro("todas")}
                  >
                    Ver todas las transacciones
                  </Button>
                )}
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
                    {paquetesFiltrados.map((paquete) => {
                      const isHighlighted = searchParams?.get("id") === String(paquete.id);
                      const estadoUpper = String(paquete.estado || "").toUpperCase();
                      const isPagado = estadoUpper === "PAGADO" || paquete.pagado === true;
                      const isPendiente = estadoUpper === "PENDIENTE";
                      return (
                        <TableRow 
                          key={paquete.id} 
                          className={`hover:bg-gray-50 ${isHighlighted ? "bg-yellow-50 highlight-row" : ""}`}
                        >
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
                                  disabled={isPagado || isPendiente}
                                >
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  Pagar
                                </Button>
                              )}

                              {isPendiente && (
                                <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                                  Pendiente
                                </span>
                              )}

                              {isPagado && (
                                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
                                  Pagado
                                </span>
                              )}

                              {estaPagado(paquete) && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleImprimirFactura(paquete)}
                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                  >
                                    <Printer className="h-4 w-4 mr-1" />
                                    Imprimir
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleDescargarPDF(paquete)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Download className="h-4 w-4 mr-1" />
                                    PDF
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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

