import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET(request: NextRequest) {
  try {
    if (!API_URL) {
      console.error("NEXT_PUBLIC_API_URL no esta configurada");
      return NextResponse.json(
        { error: "Backend no configurado" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");
    const searchParams = request.nextUrl.searchParams;
    const usuarioId = searchParams.get("usuarioId");

    if (!usuarioId) {
      return NextResponse.json(
        { error: "usuarioId es requerido" },
        { status: 400 }
      );
    }

    console.log("📥 Buscando direcciones para usuarioId:", usuarioId);

    const resJava = await fetch(
      `${API_URL}/api/direcciones?usuarioId=${encodeURIComponent(usuarioId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      }
    );

    if (!resJava.ok) {
      const errorText = await resJava.text();
      console.error("🔥 ERROR DE JAVA (GET):", resJava.status, errorText);
      return NextResponse.json(
        { error: errorText || `Backend error: ${resJava.statusText}` },
        { status: resJava.status }
      );
    }

    const data = await resJava.json();
    console.log("✅ Direcciones obtenidas:", JSON.stringify(data));
    return NextResponse.json(data);
  } catch (error) {
    console.error("🚨 Error fetching direcciones:", error);
    return NextResponse.json(
      { error: "Error al obtener direcciones", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!API_URL) {
      console.error("NEXT_PUBLIC_API_URL no esta configurada");
      return NextResponse.json(
        { error: "Backend no configurado" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");
    const body = await request.json();

    if (!body.usuarioId) {
      return NextResponse.json(
        { error: "usuarioId es requerido" },
        { status: 400 }
      );
    }

    console.log("📤 Enviando a Java:", JSON.stringify(body));

    const resJava = await fetch(`${API_URL}/api/direcciones`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!resJava.ok) {
      const errorText = await resJava.text();
      console.error("🔥 ERROR DE JAVA:", resJava.status, errorText);
      return NextResponse.json(
        { error: errorText || `Backend error: ${resJava.statusText}` },
        { status: resJava.status }
      );
    }

    const data = await resJava.json();
    console.log("✅ Respuesta de Java:", JSON.stringify(data));
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("🚨 Error creating dirección:", error);
    return NextResponse.json(
      { error: "Error al crear dirección", details: String(error) },
      { status: 500 }
    );
  }
}
