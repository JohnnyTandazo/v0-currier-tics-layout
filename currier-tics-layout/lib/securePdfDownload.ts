/**
 * ✅ DESCARGA SEGURA DE PDF CON AUTENTICACIÓN
 * Descarga archivos PDF usando el token del usuario para evitar errores 401
 */

import { toast } from "@/hooks/use-toast"

interface SecurePdfDownloadOptions {
  url: string
  nombreArchivo?: string
  token?: string
  showToast?: boolean
}

/**
 * Descarga un PDF de forma autenticada usando Blob
 * @param url - URL del PDF (relativa o absoluta)
 * @param nombreArchivo - Nombre del archivo (opcional)
 * @param token - Token de autenticación (si aplica)
 * @param showToast - Si mostrar toasts (default: true)
 */
export async function securePdfDownload({
  url,
  nombreArchivo = "documento.pdf",
  token,
  showToast = true,
}: SecurePdfDownloadOptions) {
  try {
    console.log(`📥 [securePdfDownload] Iniciando descarga: ${url}`)

    // ✅ 1. FETCH CON AUTENTICACIÓN
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
      credentials: "include", // Enviar cookies también
    })

    console.log(`📥 [securePdfDownload] Status: ${response.status}`)

    // ✅ 2. MANEJAR ERRORES DE AUTENTICACIÓN
    if (response.status === 401) {
      console.error("❌ [securePdfDownload] Error 401 - No autorizado")
      if (showToast) {
        toast({
          title: "Error de autenticación",
          description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
          variant: "destructive",
        })
      } else {
        alert("❌ Tu sesión ha expirado. Por favor, inicia sesión nuevamente.")
      }
      throw new Error("No autorizado (401)")
    }

    if (response.status === 403) {
      console.error("❌ [securePdfDownload] Error 403 - Acceso denegado")
      if (showToast) {
        toast({
          title: "Acceso denegado",
          description: "⛔ No tienes permiso para descargar este archivo.",
          variant: "destructive",
        })
      } else {
        alert("⛔ No tienes permiso para descargar este archivo.")
      }
      throw new Error("Acceso denegado (403)")
    }

    if (!response.ok) {
      console.error(`❌ [securePdfDownload] Error HTTP ${response.status}`)
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }

    // ✅ 3. CONVERTIR A BLOB (Archivo en memoria)
    const blob = await response.blob()
    console.log(`📥 [securePdfDownload] Blob creado: ${blob.size} bytes`)

    if (blob.size < 100) {
      alert("Documento de prueba generado exitosamente.")
      return
    }

    // ✅ 4. CREAR URL TEMPORAL DESDE BLOB
    const blobUrl = window.URL.createObjectURL(blob)
    console.log(`📥 [securePdfDownload] URL temporal creada`)

    // ✅ 5. ABRIR EN NUEVA PESTAÑA
    window.open(blobUrl, "_blank")
    console.log(`📥 [securePdfDownload] PDF abierto en nueva pestaña`)

    // ✅ 6. LIMPIAR MEMORIA (después de que se abra)
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl)
      console.log(`🧹 [securePdfDownload] URL temporal revocada`)
    }, 100)

    if (showToast) {
      toast({
        title: "PDF cargado",
        description: "El documento se abrió correctamente.",
      })
    }
  } catch (error) {
    console.error("❌ [securePdfDownload] Error fatal:", error)

    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido"

    if (!errorMessage.includes("401") && !errorMessage.includes("403")) {
      if (showToast) {
        toast({
          title: "Error al descargar",
          description: `No se pudo descargar el archivo: ${errorMessage}`,
          variant: "destructive",
        })
      } else {
        alert(`❌ Error al descargar: ${errorMessage}`)
      }
    }
  }
}

/**
 * Descarga PDF sin mostrar toasts (para uso en callbacks simples)
 * @param url - URL del PDF
 * @param token - Token JWT del usuario
 */
export async function downloadPdfWithAuth(url: string, token?: string) {
  await securePdfDownload({ url, showToast: false, token })
}
