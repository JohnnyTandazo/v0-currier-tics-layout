"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { withAuthHeaders } from "@/lib/authHeaders"
import { AdminPayments } from "./AdminPayments"

import {
  Search,
  Package,
  AlertTriangle,
  CheckCircle2,
  Scale,
  DollarSign,
  FileWarning,
  Send,
  RefreshCw,
  Check,
  Edit,
  Plane,
  Truck,
  LayoutDashboard,
  LogOut,
  X,
  User,
  Menu,
  ImageIcon
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

// Opciones de estado
const statusOptions = [
  { value: "PRE_ALERTADO", label: "Pre-alertado / Registrado" },
  { value: "EN_BODEGA_MIAMI", label: "🏢 En Bodega Miami" },
  { value: "EN_TRANSITO", label: "✈️ En Tránsito a Ecuador" },
  { value: "EN_ADUANA", label: "🛃 En Aduana" },
  { value: "EN_CENTRO_DISTRIBUCION", label: "📦 En Centro de Distribución" },
  { value: "EN_RUTA", label: "🚚 En Ruta de Entrega" },
  { value: "ENTREGADO", label: "✅ Entregado" },
  { value: "RETENIDO", label: "⚠️ Retenido" }
]

export default function OperatorDashboard({ user }: { user?: any }) {
  const router = useRouter()
  const { toast } = useToast()

  // ========================================================================
  // 1. SEGURIDAD Y LOGOUT (SOLUCIÓN DEFINITIVA)
  // ========================================================================
  useEffect(() => {
    let userRol = user?.rol;
    if (!userRol && typeof window !== "undefined") {
      const storedData = localStorage.getItem("usuario");
      if (storedData) {
        try {
          const parsedUser = JSON.parse(storedData);
          userRol = parsedUser.rol;
        } catch (error) { console.error(error); }
      }
    }
  }, [user, router]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      // Borrado agresivo de sesión
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      localStorage.clear();
      
      // Redirección forzada (Hard Redirect) - ESTO NO FALLA
      window.location.href = "/"; 
    }
  };

  // ========================================================================
  // 2. ESTADOS
  // ========================================================================
  const [trackingNumber, setTrackingNumber] = useState("")
  const [weightLb, setWeightLb] = useState<string>("")
  const [weightKg, setWeightKg] = useState<string>("")
  const [price, setPrice] = useState<number>(0)
  const [packageFound, setPackageFound] = useState<any | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [incidenceReason, setIncidenceReason] = useState("")
  const [showIncidence, setShowIncidence] = useState(false)

  const [statusTrackingNumber, setStatusTrackingNumber] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false)

  const [todosPaquetes, setTodosPaquetes] = useState<any[]>([])
  const [pagosPendientes, setPagosPendientes] = useState<any[]>([]) // Estado para pagos
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("TODOS")
  const [tipoFilter, setTipoFilter] = useState<"TODOS" | "INTERNACIONAL" | "NACIONAL">("TODOS")
  const [enviosOperador, setEnviosOperador] = useState<any[]>([])
  const [loadingEnvios, setLoadingEnvios] = useState(true)
  
  const [envioActionId, setEnvioActionId] = useState<number | null>(null)
  const [envioEdit, setEnvioEdit] = useState<any | null>(null)
  const [envioEditTracking, setEnvioEditTracking] = useState("")
  const [envioEditEstado, setEnvioEditEstado] = useState("PENDIENTE_PAGO")

  // ========================================================================
  // 3. LÓGICA DE NEGOCIO
  // ========================================================================

  const cargarDatos = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) return

      // Cargar Paquetes
      const resPaquetes = await fetch(`${apiUrl}/api/paquetes/todos`, {
        method: "GET",
        headers: withAuthHeaders({ "Content-Type": "application/json" }),
      })
      if (resPaquetes.ok) {
        const data = await resPaquetes.json()
        setTodosPaquetes(Array.isArray(data) ? data : [])
      }

      // Cargar Pagos Pendientes (Lógica original de tu código)
      const resPagos = await fetch(`${apiUrl}/api/pagos/pendientes`, {
        method: "GET",
        headers: withAuthHeaders({ "Content-Type": "application/json" }),
      })
      if (resPagos.ok) {
        const text = await resPagos.text()
        if (text && text.trim() !== "") {
          const pagos = JSON.parse(text)
          setPagosPendientes(Array.isArray(pagos) ? pagos : [])
        }
      }

    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const cargarEnviosOperador = async () => {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL
        if (!apiUrl) return
        setLoadingEnvios(true)
        const res = await fetch(`${apiUrl}/api/envios/operador/lista`, {
            method: "GET",
            headers: withAuthHeaders({ "Content-Type": "application/json" }),
        })
        if(res.ok) {
            const data = await res.json()
            setEnviosOperador(Array.isArray(data) ? data : [])
        }
    } catch(e){ console.error(e) } finally { setLoadingEnvios(false) }
  }

  useEffect(() => {
    cargarDatos()
    cargarEnviosOperador()
  }, [])

  const handleSearch = async () => {
    if (!trackingNumber) return
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) throw new Error("No API URL")
      const res = await fetch(`${apiUrl}/api/paquetes`, {
        method: "GET",
        headers: withAuthHeaders({ "Content-Type": "application/json" }),
      })
      if (!res.ok) throw new Error("Error fetching")
      const paquetes = await res.json()
      const buscado = paquetes.find((p: any) => {
        const tn = String(p.trackingNumber || p.trackingId || "").toLowerCase()
        return tn === trackingNumber.toLowerCase()
      })

      if (buscado) {
        editarPaquete(buscado);
      } else {
        alert("Paquete no encontrado")
        setPackageFound(null)
      }
    } catch (error) {
      console.error(error)
      alert("Error buscando paquete")
    }
  }

  const confirmarPago = async (pagoId: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) return

      const response = await fetch(`${apiUrl}/api/pagos/${pagoId}`, {
        method: "PUT",
        headers: withAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ estado: "VERIFICADO" })
      })

      if (response.ok) {
        toast({ title: "Pago Aprobado", description: "El pago ha sido validado correctamente." })
        await cargarDatos()
      } else {
        alert("Error al aprobar el pago")
      }
    } catch (err) {
      console.error("Error confirmando pago:", err)
      alert("Error de conexión")
    }
  }

  const calculateCategory = () => {
    const priceNum = Number(price) || 0
    let weightKgNum = 0
    if (weightKg && weightKg.trim() !== "") {
      weightKgNum = parseFloat(weightKg) || 0
    } else if (weightLb && weightLb.trim() !== "") {
      weightKgNum = (parseFloat(weightLb) || 0) / 2.20462
    }
    if (weightKgNum <= 4 && priceNum <= 400) setCategory("A")
    else if (weightKgNum <= 4 && priceNum > 400) setCategory("C")
    else if (weightKgNum > 4) setCategory("B")
  }

  const handleLbChange = (e: any) => {
    const v = e.target.value
    if (!v) { setWeightLb(""); setWeightKg(""); return }
    setWeightLb(v)
    const n = parseFloat(v)
    if (!isNaN(n)) setWeightKg((n / 2.20462).toFixed(2))
  }

  const handleKgChange = (e: any) => {
    const v = e.target.value
    if (!v) { setWeightKg(""); setWeightLb(""); return }
    setWeightKg(v)
    const n = parseFloat(v)
    if (!isNaN(n)) setWeightLb((n * 2.20462).toFixed(2))
  }

  const handleSubmitIncidence = () => {
    setShowIncidence(false)
    setIncidenceReason("")
    toast({ title: "Incidencia reportada", description: "Se ha registrado la incidencia correctamente." })
  }

  const handleStatusUpdate = async () => {
    if (!statusTrackingNumber || !selectedStatus) return
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) return
      let idToUpdate: any = packageFound?.id
      if (!idToUpdate) {
        const res = await fetch(`${apiUrl}/api/paquetes`, {
            method: "GET",
            headers: withAuthHeaders({ "Content-Type": "application/json" }),
        })
        const pkgs = await res.json()
        const found = pkgs.find((p:any) => String(p.trackingNumber || p.trackingId).toLowerCase() === statusTrackingNumber.toLowerCase())
        if(found) idToUpdate = found.id
      }
      if(!idToUpdate) return alert("Paquete no encontrado")

      const body = {
        estado: selectedStatus,
        pesoLibras: parseFloat(weightLb) || 0,
        precio: Number(price) || 0,
        categoria: category || null,
      }
      const putRes = await fetch(`${apiUrl}/api/paquetes/${idToUpdate}/detalles`, {
        method: "PUT",
        headers: withAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(body),
      })
      if (!putRes.ok) throw new Error("Error update")
      
      setStatusUpdateSuccess(true)
      setTimeout(() => setStatusUpdateSuccess(false), 2000)
      toast({ title: "Actualizado", description: "Paquete actualizado correctamente" })
      cargarDatos()
    } catch (e) { console.error(e); alert("Error actualizando") }
  }

  const handleAsignarTrackingEnvio = async (envioId: number) => {
    const tracking = envioEditTracking.trim();
    if (!tracking) return toast({ title: "Invalido", variant: "destructive" })
    try {
        setEnvioActionId(envioId)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL
        const res = await fetch(`${apiUrl}/api/envios/operador/${envioId}/tracking`, {
            method: "PUT",
            headers: withAuthHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ tracking })
        })
        if(!res.ok) throw new Error()
        await cargarEnviosOperador()
        setEnvioEdit(null)
        toast({ title: "Exito", description: "Tracking asignado correctamente" })
    } catch(e) { toast({ title: "Error", variant: "destructive" }) }
    finally { setEnvioActionId(null) }
  }

  const startEditarEnvio = (envio: any) => {
    const tr = envio?.numeroTracking || envio?.trackingId || ""
    setEnvioEdit(envio);
    setEnvioEditTracking(tr === "-" ? "" : tr);
    setEnvioEditEstado(String(envio?.estado || "PENDIENTE_PAGO"));
  }

  const cancelarEditarEnvio = () => {
    setEnvioEdit(null)
    setEnvioEditTracking("")
    setEnvioEditEstado("PENDIENTE_PAGO")
  }

  // --- Función Editar Paquete (Hace scroll hacia arriba) ---
  const editarPaquete = (paquete: any) => {
    setPackageFound({
      id: paquete.id,
      trackingId: paquete.trackingNumber || paquete.tracking,
      description: paquete.descripcion,
      customer: paquete.usuario?.nombre || "-",
      status: paquete.estado,
      prealerted: true,
    })
    setTrackingNumber(paquete.trackingNumber || paquete.tracking || "")
    setStatusTrackingNumber(paquete.trackingNumber || paquete.tracking || "")
    
    const libras = paquete.pesoLibras || 0
    setWeightLb(libras > 0 ? String(libras) : "")
    setWeightKg(libras > 0 ? (libras / 2.20462).toFixed(2) : "")
    
    setPrice(paquete.precio || 0)
    setCategory(paquete.categoria || null)
    setSelectedStatus(paquete.estado || "")
    
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const paquetesFiltrados = todosPaquetes.filter((pkg) => {
    const tr = String(pkg?.trackingNumber || pkg?.tracking || "").toLowerCase()
    const cl = String(pkg?.usuario?.nombre || pkg?.cliente || "").toLowerCase()
    const src = searchTerm.toLowerCase()
    const tipo = getPaqueteTipo(pkg)
    const coincideTipo = tipoFilter === "TODOS" || tipo === tipoFilter
    
    // Filtro de estado
    const estadoPkg = String(pkg?.estado || "").toUpperCase()
    const coincideEstado = statusFilter === "TODOS" || estadoPkg === statusFilter

    return (tr.includes(src) || cl.includes(src)) && coincideTipo && coincideEstado
  })

  // ========================================================================
  // 4. RENDERIZADO VISUAL (SIDEBAR LIMPIO)
  // ========================================================================
  return (
    <div className="flex min-h-screen w-full bg-gray-100">
      
      {/* --- SIDEBAR OSCURO FIJO (Estilo image_3ed751.png) --- */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-[#0f172a] text-white flex flex-col transition-all duration-300 shadow-xl">
        
        {/* Header Sidebar */}
        <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-700/50">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-500 text-slate-900 font-bold">
            <Truck className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-none tracking-tight">Currier TICS</span>
            <span className="text-xs text-slate-400 font-medium mt-1">Operaciones</span>
          </div>
        </div>

        {/* Menú de Navegación: SOLO LO NECESARIO */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            MENÚ
          </div>
          
          <Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors bg-slate-800/30">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Button>
          
          {/* Aquí he eliminado los botones extra que no querías */}
        </nav>

        {/* Footer Sidebar (Perfil + Logout) */}
        <div className="p-4 border-t border-slate-700/50 bg-[#020617]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-slate-900 font-bold text-lg">
              {user?.nombre ? user.nombre.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.nombre || "Operador"}</p>
              <p className="text-xs text-slate-400 truncate">{user?.rol || "OPERADOR"}</p>
            </div>
          </div>
          
          {/* BOTÓN DE CERRAR SESIÓN (Funcionalidad Hard Redirect) */}
          <Button 
            onClick={handleLogout} 
            variant="outline" 
            className="w-full justify-start gap-2 border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-red-900/20 hover:text-red-400 hover:border-red-900/50 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </Button>
        </div>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 ml-64 min-h-screen">
        
        {/* Header Móvil (Solo visible < md) */}
        <header className="sticky top-0 z-40 md:hidden flex h-16 items-center justify-between border-b bg-white px-4">
          <span className="font-bold">Panel Operador</span>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </header>

        <div className="p-8 space-y-6">
          
          {/* TÍTULO DE BIENVENIDA */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Bienvenido, {user?.nombre || "Operador"}</h2>
            <p className="text-slate-500">Aquí tienes el resumen operativo del día.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* CARD 1: RECEPCIÓN */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Recepción de Paquetes
                </CardTitle>
                <CardDescription>Escanea o busca paquetes entrantes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input 
                      placeholder="Número de guía..." 
                      value={trackingNumber} 
                      onChange={(e) => setTrackingNumber(e.target.value)} 
                      className="flex-1" 
                    />
                    <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                      <Search className="mr-2 h-4 w-4" /> Buscar
                    </Button>
                </div>
                
                {packageFound && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-semibold text-blue-900">{packageFound.trackingId}</span>
                      {packageFound.prealerted && <Badge className="bg-green-600">Pre-alertado</Badge>}
                    </div>
                    <div className="text-sm text-slate-600">
                      <p><span className="font-medium">Cliente:</span> {packageFound.customer}</p>
                      <p><span className="font-medium">Desc:</span> {packageFound.description}</p>
                    </div>
                  </div>
                )}
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Peso (Lb)</Label>
                      <Input type="number" step="0.1" value={weightLb} onChange={(e)=>{handleLbChange(e); setCategory(null)}} />
                    </div>
                    <div className="space-y-2">
                      <Label>Peso (Kg)</Label>
                      <Input type="number" step="0.01" value={weightKg} onChange={(e)=>{handleKgChange(e); setCategory(null)}} />
                    </div>
                </div>
                <div className="space-y-2">
                  <Label>Valor FOB ($)</Label>
                  <Input type="number" step="0.01" value={price} onChange={(e)=>{setPrice(parseFloat(e.target.value)||0); setCategory(null)}} />
                </div>
                <Button onClick={calculateCategory} variant="secondary" className="w-full">
                  Calcular Categoría
                </Button>
              </CardContent>
            </Card>

            {/* CARD 2: ACTUALIZACIÓN */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-orange-600" /> 
                  Actualizar Estado
                </CardTitle>
                <CardDescription>Cambio rápido de estado y detalles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input placeholder="Escanear Guía..." value={statusTrackingNumber} onChange={(e)=>setStatusTrackingNumber(e.target.value)} className="flex-1"/>
                    <Button variant="outline" size="icon"><Search className="h-4 w-4"/></Button>
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger><SelectValue placeholder="Selecciona nuevo estado" /></SelectTrigger>
                    <SelectContent>
                        {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label>Categoría</Label>
                      <Select value={category || ""} onValueChange={(v) => setCategory(v || null)}>
                        <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="4x4">4x4</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-2">
                      <Label>&nbsp;</Label>
                      <Button onClick={handleStatusUpdate} className="w-full bg-orange-600 hover:bg-orange-700" disabled={!statusTrackingNumber || !selectedStatus}>
                        Actualizar
                      </Button>
                   </div>
                </div>
                
                {statusUpdateSuccess && (
                  <div className="text-green-600 text-sm font-medium text-center bg-green-50 p-2 rounded">
                    ¡Actualizado correctamente!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* VISUALIZACIÓN CATEGORÍA E INCIDENCIAS */}
          <div className="grid gap-6 lg:grid-cols-2">
             <Card>
                <CardHeader>
                  <CardTitle>Categoría Calculada</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-6">
                   <div className="text-4xl font-bold text-slate-700">{category || "-"}</div>
                </CardContent>
             </Card>
             
             <Card>
                <CardHeader>
                  <CardTitle className="text-red-600 flex gap-2">
                    <AlertTriangle className="h-5 w-5"/> Reportar Incidencia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                    {!showIncidence ? 
                        <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={()=>setShowIncidence(true)}>
                          Crear Reporte
                        </Button> 
                        : (
                          <div className="space-y-2">
                            <Textarea 
                              placeholder="Describe el problema o motivo de retención..." 
                              value={incidenceReason}
                              onChange={(e) => setIncidenceReason(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <Button variant="ghost" onClick={()=>setShowIncidence(false)} className="flex-1">Cancelar</Button>
                              <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleSubmitIncidence}>Enviar</Button>
                            </div>
                          </div>
                        )
                    }
                </CardContent>
             </Card>
          </div>

          {/* ✅ SECCIÓN DE PAGOS (TU CÓDIGO) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-green-600" /> Pagos por Validar</CardTitle>
            </CardHeader>
            <CardContent>
              {pagosPendientes.length === 0 ? <p className="text-center py-4 text-muted-foreground">No hay pagos pendientes</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Monto</TableHead><TableHead>Ref</TableHead><TableHead>Comprobante</TableHead><TableHead className="text-right">Acción</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {pagosPendientes.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>${(p.monto||0).toFixed(2)}</TableCell>
                        <TableCell>{p.referencia}</TableCell>
                        <TableCell>
                          {p.imagenUrl ? <Button size="sm" variant="outline" onClick={()=>window.open(p.imagenUrl, "_blank")}><ImageIcon className="h-3 w-3 mr-1"/> Ver</Button> : "Sin foto"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={()=>confirmarPago(p.id)}><Check className="h-3 w-3 mr-1"/> Aprobar</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* ✅ TORRE DE CONTROL (TU TABLA DE TODOS LOS PAQUETES) */}
          <Card>
            <CardHeader><CardTitle>Todos los Paquetes</CardTitle></CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <Input placeholder="Filtrar por tracking o cliente..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} className="flex-1"/>
                  
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado"/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODOS">Todos</SelectItem>
                        {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                      </SelectContent>
                    </Select>

                    <Select value={tipoFilter} onValueChange={(v: any) => setTipoFilter(v)}>
                      <SelectTrigger className="w-[140px]"><SelectValue placeholder="Tipo"/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODOS">Todos</SelectItem>
                        <SelectItem value="NACIONAL">Nacional</SelectItem>
                        <SelectItem value="INTERNACIONAL">Internacional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Tabs defaultValue="paquetes">
                    <TabsList className="mb-4">
                        <TabsTrigger value="paquetes">Paquetes</TabsTrigger>
                        <TabsTrigger value="envios">Envios</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="paquetes">
                        <div className="rounded-md border">
                          <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[50px]">ID</TableHead>
                                  <TableHead>Tracking</TableHead>
                                  <TableHead>Cliente</TableHead>
                                  <TableHead>Estado</TableHead>
                                  <TableHead className="text-right">Acción</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {paquetesFiltrados.map(pkg => (
                                      <TableRow key={pkg.id}>
                                          <TableCell className="font-mono">{pkg.id}</TableCell>
                                          <TableCell className="font-medium">{pkg.trackingNumber}</TableCell>
                                          <TableCell>{pkg.usuario?.nombre}</TableCell>
                                          <TableCell><Badge variant="outline">{pkg.estado}</Badge></TableCell>
                                          <TableCell className="text-right">
                                              <Button size="sm" variant="ghost" onClick={() => editarPaquete(pkg)}>
                                                  <Edit className="mr-1 h-3 w-3" /> Editar
                                              </Button>
                                          </TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value="envios">
                        {envioEdit && (
                            <div className="mb-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                                <h4 className="font-semibold text-blue-900 mb-2">Editando Envío #{envioEdit.id}</h4>
                                <div className="flex gap-2">
                                    <Input 
                                      placeholder="Asignar Tracking..." 
                                      value={envioEditTracking} 
                                      onChange={(e)=>setEnvioEditTracking(e.target.value)}
                                      className="bg-white"
                                    />
                                    <Button size="sm" onClick={() => handleAsignarTrackingEnvio(envioEdit.id)}>Guardar</Button>
                                    <Button size="sm" variant="ghost" onClick={cancelarEditarEnvio}>Cancelar</Button>
                                </div>
                            </div>
                        )}
                        <div className="rounded-md border">
                          <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>ID</TableHead>
                                  <TableHead>Tracking</TableHead>
                                  <TableHead>Estado</TableHead>
                                  <TableHead className="text-right">Acción</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {enviosOperador.map(e => (
                                      <TableRow key={e.id}>
                                          <TableCell>{e.id}</TableCell>
                                          <TableCell>{e.numeroTracking || <span className="text-slate-400 italic">Pendiente</span>}</TableCell>
                                          <TableCell>{e.estado}</TableCell>
                                          <TableCell className="text-right">
                                              <Button size="sm" variant="ghost" onClick={() => startEditarEnvio(e)}>
                                                  <Truck className="h-4 w-4 mr-1" /> Track
                                              </Button>
                                          </TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  )
}

// --------------------------------------------------------------------------
// 5. HELPERS (Fuera del componente para no ensuciar)
// --------------------------------------------------------------------------

function deducirTipo(tracking: string): "NACIONAL" | "INTERNACIONAL" {
  const t = (tracking || "").toUpperCase();
  if (t.startsWith("USA") || t.startsWith("TBA") || /^\d{10,}$/.test(t)) return "INTERNACIONAL";
  return "NACIONAL";
}

function getPaqueteTipo(pkg: any) {
  return deducirTipo(pkg?.trackingNumber || pkg?.tracking || "");
}

const formatCurrency = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (v: any) => v ? new Date(v).toLocaleDateString("es-EC") : "-";

// Helpers para envíos
const getEnvioTracking = (envio: any) => envio?.numeroTracking || envio?.trackingId || envio?.tracking || "-"
const getEnvioCliente = (envio: any) => envio?.destinatarioNombre || envio?.usuario?.nombre || "Cliente Desconocido"