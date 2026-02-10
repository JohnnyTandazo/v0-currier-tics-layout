import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * GET /api/paquetes
 * Obtiene todos los paquetes (filtrables por usuario)
 */
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [API GET /api/paquetes] Solicitando lista de paquetes");

    if (!API_URL) {
      console.error("NEXT_PUBLIC_API_URL no esta configurada");
      return NextResponse.json(
        { error: "Backend no configurado" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");

    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get("usuarioId");

    console.log("👤 [API] Usuario ID filtro:", usuarioId);

    const endpoint = `${API_URL}/api/paquetes`;

    console.log("🌐 [API PROXY] Conectando con backend Java:", endpoint);

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      cache: "no-store",
    });

    const text = await response.text();
    console.log("📥 [API] Respuesta status:", response.status);

    if (!response.ok) {
      console.warn("⚠️ [API] Backend devolvió error:", response.status, text);
      return NextResponse.json(
        { error: "Error al obtener paquetes del backend", details: text },
        { status: response.status }
      );
    }

    const data = text ? JSON.parse(text) : [];

    if (!Array.isArray(data)) {
      console.warn("⚠️ [API] Respuesta no es array:", typeof data);
      return NextResponse.json([], { status: 200 });
    }

    console.log("✅ [API] Paquetes obtenidos:", data.length);

    let paquetesFiltrados = data;
    if (usuarioId) {
      paquetesFiltrados = data.filter(
        (p: any) => String(p.usuarioId || p.usuario?.id) === String(usuarioId)
      );
      console.log(
        `🔍 [API] Filtrado por usuario ${usuarioId}:`,
        paquetesFiltrados.length
      );
    }

    return NextResponse.json(paquetesFiltrados, { status: 200 });
  } catch (error: any) {
    console.error("💥 [API ERROR] Error en /api/paquetes:", error);

    return NextResponse.json(
      {
        error: "Error interno del servidor",
        message: error.message || "Error desconocido",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/paquetes
 * Crea un nuevo paquete
 */
export async function POST(request: NextRequest) {
  try {
    console.log("📦 [API POST /api/paquetes] Creando nuevo paquete");

    if (!API_URL) {
      console.error("NEXT_PUBLIC_API_URL no esta configurada");
      return NextResponse.json(
        { error: "Backend no configurado" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");

    const body = await request.json();
    console.log("📋 [API] Datos del nuevo paquete:", body);

    const endpoint = `${API_URL}/api/paquetes`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      console.warn("⚠️ [API POST] Error al crear paquete:", response.status);
      return NextResponse.json(
        { error: "Error al crear paquete", details: data },
        { status: response.status }
      );
    }

    console.log("✅ [API POST] Paquete creado:", data);

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error("💥 [API POST ERROR]:", error);

    return NextResponse.json(
      { error: "Error al crear paquete", message: error.message },
      { status: 500 }
    );
  }
}
