"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OperatorDashboard from "@/components/dashboards/operator-dashboard";
import ClientDashboard from "@/components/dashboards/client-dashboard";

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

  if (loading) return null;

  if (
    user &&
    (user.role === "OPERADOR" ||
      user.role === "ROLE_OPERADOR" ||
      user.rol === "OPERADOR" ||
      user.rol === "ROLE_OPERADOR")
  ) {
    return <OperatorDashboard user={user} />;
  }

  //return <ClientDashboard user={user} />;
}
