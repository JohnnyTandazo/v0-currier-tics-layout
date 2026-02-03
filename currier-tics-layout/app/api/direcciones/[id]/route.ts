import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

console.log("🌍 Conectando a Backend:", `${BACKEND_URL}/api/direcciones/{id}`);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID de dirección es requerido" },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/direcciones/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend error: ${response.statusText}` },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { message: "Dirección eliminada exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting dirección:", error);
    return NextResponse.json(
      { error: "Error al eliminar dirección" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID de dirección es requerido" },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/direcciones/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
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
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating dirección:", error);
    return NextResponse.json(
      { error: "Error al actualizar dirección" },
      { status: 500 }
    );
  }
}
