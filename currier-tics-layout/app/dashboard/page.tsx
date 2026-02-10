"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// Asegúrate de que estas rutas sean correctas
import OperatorDashboard from "@/components/dashboards/operator-dashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard"; 
import ClientDashboard from "@/components/dashboards/client-dashboard";
// Si creaste el archivo en "components", ajusta esta ruta:


export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("usuario");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser(parsed);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [loading, user, router]);

  // 1. Si está cargando, no mostramos nada
  if (loading) return null;

  // 🔴 2. ESTA ES LA LÍNEA QUE TE FALTABA
  // Si no hay usuario (mientras redirige), retornamos null para evitar el crash
  if (!user) return null;

  // Diagnóstico de rol en consola
  console.log("ROL ACTUAL:", user.rol || user.role);

  // 3. Lógica de Administrador
  if (
    user.role === "ADMIN" ||
    user.role === "ROLE_ADMIN" ||
    user.rol === "ADMIN" ||
    user.rol === "ADMINISTRADOR" ||
    user.rol === "ROLE_ADMIN"
  ) {
    return <AdminDashboard />;
  }

  // 4. Lógica de Operador
  if (
    user.role === "OPERADOR" ||
    user.role === "ROLE_OPERADOR" ||
    user.rol === "OPERADOR" ||
    user.rol === "ROLE_OPERADOR"
  ) {
    // Nota: OperatorDashboard espera la prop 'user', asegúrate de pasársela
    return <OperatorDashboard user={user} />;
  }

  // --- CLIENTE ---
  // AQUI ESTABA EL ERROR: Le pasamos funciones vacías () => {} para que no falle
  return (
    <ClientDashboard 
      onViewTracking={() => {}} 
      onClientViewChange={() => {}} 
    />
  );
}