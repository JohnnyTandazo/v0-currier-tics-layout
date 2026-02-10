import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/envios/[id]
 * Obtiene un envío específico por ID
 * ✅ CORREGIDO: Manejo defensivo de respuesta vacía + Logs completos
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!API_URL) {
      console.error("NEXT_PUBLIC_API_URL no esta configurada");
      return NextResponse.json(
        { error: "Backend no configurado" },
        { status: 500 }
      );
    }
    // ✅ AWAIT params (Next.js 15+)
    const resolvedParams = await params;
    const idParam = resolvedParams.id;
    
    console.log("🔍 [API GET /api/envios/[id]] Solicitado ID:", idParam);

    // ✅ VALIDACIÓN 1: Verificar que el ID sea válido
    if (!idParam || idParam === "undefined" || idParam === "null") {
      console.warn("⚠️ [API] ID inválido o vacío:", idParam);
      return NextResponse.json(
        { error: "ID de envío inválido" },
        { status: 400 }
      );
    }

    // Convertir ID a número
    const id = parseInt(idParam, 10);

    if (isNaN(id)) {
      console.warn("⚠️ [API] ID no es un número válido:", idParam);
      return NextResponse.json(
        { error: "El ID debe ser un número válido" },
        { status: 400 }
      );
    }

    console.log("🔎 [API] Buscando envío por ID:", id);

    // ✅ PROXY AL BACKEND JAVA - NUEVO ENDPOINT: /api/envios/detalle/{id}
    const endpoint = `${API_URL}/api/envios/detalle/${id}`; // ✅ Usa endpoint /detalle para evitar conflicto
    
    console.log("🌐 [API PROXY] Conectando con backend Java:", endpoint);
    console.log("🌐 [API PROXY] URL completa:", endpoint);
    console.log("🌐 [API PROXY] Método: GET");

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      cache: "no-store",
    });

    // ✅ LECTURA DEFENSIVA: Leer como texto primero para evitar crash
    const text = await response.text();
    console.log("📥 [API] Respuesta del backend - Status:", response.status);
    console.log("📥 [API] Respuesta del backend - Body length:", text.length);

    // ✅ VALIDACIÓN 2: Verificar si el backend devolvió error
    if (!response.ok) {
      console.error("❌ [API] Backend devolvió error:", response.status);
      console.error("❌ [API] URL que fue llamada:", endpoint);
      console.error("🔥 JAVA DIJO:", text); // ¡Aquí vemos qué devolvió Java!
      
      // Si el backend devuelve 404
      if (response.status === 404) {
        console.warn("❌ [API] Envío no encontrado en backend - ID:", id);
        return NextResponse.json(
          { 
            error: "Envío no encontrado",
            message: `No existe un envío con el ID ${id}`,
            id: id,
            javaResponse: text // Debug: mostrar qué dijo Java
          },
          { status: 404 }
        );
      }

      // Otros errores del backend (especialmente 400)
      console.error("🔥 JAVA DIJO (Error 400+):", text);
      return NextResponse.json(
        { 
          error: "Error al obtener datos del backend", 
          details: text,
          status: response.status,
          javaErrorMessage: text,
          requestedUrl: endpoint
        },
        { status: response.status }
      );
    }

    // ✅ VALIDACIÓN 3: Verificar que la respuesta no esté vacía
    if (!text || text.trim().length === 0) {
      console.warn("⚠️ [API] Backend devolvió respuesta vacía (Empty Body)");
      return NextResponse.json(
        { 
          error: "Envío no encontrado",
          message: "El backend devolvió una respuesta vacía",
          id: id
        },
        { status: 404 }
      );
    }

    // ✅ PARSEAR JSON: Solo si hay contenido
    let envio;
    try {
      envio = JSON.parse(text);
    } catch (parseError: any) {
      console.error("💥 [API] Error al parsear JSON:", parseError.message);
      console.error("📄 [API] Contenido recibido:", text);
      return NextResponse.json(
        { 
          error: "Respuesta inválida del servidor",
          message: "No se pudo interpretar la respuesta del backend"
        },
        { status: 500 }
      );
    }

    // ✅ VALIDACIÓN 4: Verificar que el objeto no esté vacío
    if (!envio || Object.keys(envio).length === 0) {
      console.warn("⚠️ [API] Backend devolvió objeto vacío");
      return NextResponse.json(
        { 
          error: "Envío no encontrado",
          message: "No se encontraron datos del envío",
          id: id
        },
        { status: 404 }
      );
    }

    // ✅ LOG 2: Envío encontrado exitosamente
    console.log("✅ [API] Envío encontrado exitosamente:", {
      id: envio.id,
      tracking: envio.tracking || envio.trackingNumber,
      estado: envio.estado
    });

    // ✅ RESPUESTA EXITOSA GARANTIZADA
    return NextResponse.json(envio, { status: 200 });

  } catch (error: any) {
    // ✅ MANEJO DE ERRORES: Capturar cualquier error inesperado
    console.error("💥 [API ERROR] Error crítico al obtener envío:", error);
    console.error("💥 [API ERROR] Stack:", error.stack);
    
    // ✅ SIEMPRE RETORNAR RESPUESTA JSON (NUNCA VACÍA)
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        message: error.message || "Error desconocido",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/envios/[id]
 * Actualiza un envío específico
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!API_URL) {
      console.error("NEXT_PUBLIC_API_URL no esta configurada");
      return NextResponse.json(
        { error: "Backend no configurado" },
        { status: 500 }
      );
    }
    // ✅ AWAIT params (Next.js 15+)
    const resolvedParams = await params;
    const idParam = resolvedParams.id;
    
    console.log("🔧 [API PUT /api/envios/[id]] Actualizando ID:", idParam);

    // Validaciones del ID
    if (!idParam) {
      return NextResponse.json(
        { error: "ID de envío requerido" },
        { status: 400 }
      );
    }

    const id = parseInt(idParam, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "El ID debe ser un número válido" },
        { status: 400 }
      );
    }

    // Obtener el body del request
    const body = await request.json();
    console.log("📦 [API PUT] Datos a actualizar:", body);

    // Llamar al backend
    const endpoint = `${API_URL}/api/envios/detalle/${id}`; // ✅ Usa endpoint /detalle

    console.log("📡 [API PUT] URL:", endpoint);
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    // ✅ LECTURA DEFENSIVA
    const text = await response.text();
    
    if (!response.ok) {
      console.error("⚠️ [API PUT] Error al actualizar:", response.status);
      console.error("🔥 JAVA DIJO:", text);
      const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : {};
      return NextResponse.json(
        { error: "Error al actualizar envío", details: data || text, javaErrorMessage: text },
        { status: response.status }
      );
    }

    // ✅ VALIDACIÓN: Respuesta no esté vacía
    if (!text || text.trim().length === 0) {
      console.warn("⚠️ [API PUT] Respuesta vacía del backend");
      return NextResponse.json(
        {
          message: "Envío actualizado correctamente",
          envio: body,
        },
        { status: 200 }
      );
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError: any) {
      console.error("💫 [API PUT] Error al parsear respuesta:", parseError.message);
      return NextResponse.json(
        {
          message: "Envío actualizado correctamente",
          envio: body,
        },
        { status: 200 }
      );
    }

    console.log("✅ [API PUT] Envío actualizado:", data);

    return NextResponse.json(
      {
        message: "Envío actualizado correctamente",
        envio: data,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("💥 [API PUT ERROR] Error al actualizar envío:", error);
    
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
 * DELETE /api/envios/[id]
 * Elimina un envío específico
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!API_URL) {
      console.error("NEXT_PUBLIC_API_URL no esta configurada");
      return NextResponse.json(
        { error: "Backend no configurado" },
        { status: 500 }
      );
    }
    // ✅ AWAIT params (Next.js 15+)
    const resolvedParams = await params;
    const idParam = resolvedParams.id;
    
    console.log("🗑️ [API DELETE /api/envios/[id]] Eliminando ID:", idParam);

    if (!idParam) {
      return NextResponse.json(
        { error: "ID de envío requerido" },
        { status: 400 }
      );
    }

    const id = parseInt(idParam, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "El ID debe ser un número válido" },
        { status: 400 }
      );
    }

    const endpoint = `${API_URL}/api/envios/detalle/${id}`; // ✅ Usa endpoint /detalle

    console.log("📡 [API DELETE] URL:", endpoint);
    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    // ✅ LECTURA DEFENSIVA
    const text = await response.text();

    if (!response.ok) {
      console.error("⚠️ [API DELETE] Error al eliminar:", response.status);
      console.error("🔥 JAVA DIJO:", text);
      const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : {};
      return NextResponse.json(
        { error: "Error al eliminar envío", details: data || text, javaErrorMessage: text },
        { status: response.status }
      );
    }

    // ✅ VALIDACIÓN: Respuesta no esté vacía
    if (!text || text.trim().length === 0) {
      console.warn("⚠️ [API DELETE] Respuesta vacía del backend");
      return NextResponse.json(
        {
          message: "Envío eliminado correctamente",
          id: id,
        },
        { status: 200 }
      );
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError: any) {
      console.error("💫 [API DELETE] Error al parsear respuesta:", parseError.message);
      return NextResponse.json(
        {
          message: "Envío eliminado correctamente",
          id: id,
        },
        { status: 200 }
      );
    }

    console.log("✅ [API DELETE] Envío eliminado:", data);

    return NextResponse.json(
      {
        message: "Envío eliminado correctamente",
        envio: data,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("💥 [API DELETE ERROR] Error al eliminar envío:", error);
    
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        message: error.message || "Error desconocido"
      },
      { status: 500 }
    );
  }
}
