import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    let userRole = "";
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("usuario");
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          userRole = userObj?.rol ? String(userObj.rol).toUpperCase() : "";
        } catch {
          userRole = "";
        }
      }
    }
    if (userRole !== "ADMIN" && userRole !== "OPERADOR") {
      router.replace("/login");
    }
  }, [router]);

  return <>{children}</>;
}
