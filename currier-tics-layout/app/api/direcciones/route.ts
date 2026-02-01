import { NextRequest, NextResponse } from "next/server";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const usuarioId = searchParams.get("usuarioId");

    if (!usuarioId) {
      return NextResponse.json(
        { error: "usuarioId es requerido" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${backendUrl}/api/direcciones?usuarioId=${encodeURIComponent(usuarioId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching direcciones:", error);
    return NextResponse.json(
      { error: "Error al obtener direcciones" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.usuarioId) {
      return NextResponse.json(
        { error: "usuarioId es requerido" },
        { status: 400 }
      );
    }

    const response = await fetch(`${backendUrl}/api/direcciones`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating dirección:", error);
    return NextResponse.json(
      { error: "Error al crear dirección" },
      { status: 500 }
    );
  }
}
