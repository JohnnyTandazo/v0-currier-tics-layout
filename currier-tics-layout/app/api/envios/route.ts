import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * GET /api/envios
 * Obtiene todos los envíos (filtrables por usuario)
 */
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [API GET /api/envios] Solicitando lista de envíos");

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

    // ✅ PROXY AL BACKEND JAVA
    const endpoint = `${API_URL}/api/envios`;

    console.log("🌐 [API PROXY] Conectando con backend Java:", endpoint);

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      cache: "no-store",
    });

    // ✅ LECTURA DEFENSIVA: Leer como texto primero
    const text = await response.text();
    console.log("📥 [API] Respuesta status:", response.status);

    if (!response.ok) {
      console.warn("⚠️ [API] Backend devolvió error:", response.status, text);
      return NextResponse.json(
        { error: "Error al obtener envíos del backend", details: text },
        { status: response.status }
      );
    }

    // ✅ PARSEAR SOLO SI HAY CONTENIDO
    const data = text ? JSON.parse(text) : [];

    if (!Array.isArray(data)) {
      console.warn("⚠️ [API] Respuesta no es array:", typeof data);
      return NextResponse.json([], { status: 200 });
    }

    console.log("✅ [API] Envíos obtenidos:", data.length);

    // Filtrar por usuario si se especifica
    let enviosFiltrados = data;
    if (usuarioId) {
      enviosFiltrados = data.filter(
        (p: any) => String(p.usuarioId || p.usuario?.id) === String(usuarioId)
      );
      console.log(`🔍 [API] Filtrado por usuario ${usuarioId}:`, enviosFiltrados.length);
    }

    return NextResponse.json(enviosFiltrados, { status: 200 });

  } catch (error: any) {
    console.error("💥 [API ERROR] Error en /api/envios:", error);
    
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        message: error.message || "Error desconocido"
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/envios
 * Crea un nuevo envío
 */
export async function POST(request: NextRequest) {
  try {
    console.log("📦 [API POST /api/envios] Creando nuevo envío");

    if (!API_URL) {
      console.error("NEXT_PUBLIC_API_URL no esta configurada");
      return NextResponse.json(
        { error: "Backend no configurado" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");

    const body = await request.json();
    console.log("📋 [API] Datos del nuevo envío:", body);

    const endpoint = `${API_URL}/api/envios`;

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
      console.warn("⚠️ [API POST] Error al crear envío:", response.status);
      return NextResponse.json(
        { error: "Error al crear envío", details: data },
        { status: response.status }
      );
    }

    console.log("✅ [API POST] Envío creado:", data);

    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    console.error("💥 [API POST ERROR]:", error);
    
    return NextResponse.json(
      { error: "Error al crear envío", message: error.message },
      { status: 500 }
    );
  }
}
