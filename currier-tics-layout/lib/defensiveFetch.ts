/**
 * ✅ UTILIDAD DEFENSIVA PARA FETCH
 * Wrapper que:
 * 1. Lee respuesta como text primero
 * 2. Valida que no esté vacía
 * 3. Parsea JSON de forma segura
 * 4. Retorna fallback data si falla
 */

interface DefensiveFetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
  fallbackData?: any;
  timeout?: number;
}

/**
 * Fetch defensivo que nunca falla con "Unexpected end of JSON input"
 */
export async function defensiveFetch<T>(
  url: string,
  options: DefensiveFetchOptions = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  try {
    const {
      method = "GET",
      headers = {},
      body,
      fallbackData = null,
      timeout = 10000,
    } = options;

    console.log(`🔍 [defensiveFetch] Iniciando ${method} a ${url}`);

    // Crear un AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`📥 [defensiveFetch] Status: ${response.status}`);

      // ✅ LECTURA DEFENSIVA: Leer como texto primero
      const text = await response.text();
      console.log(`📥 [defensiveFetch] Body length: ${text.length}`);

      // Verificar status
      if (!response.ok) {
        console.warn(
          `⚠️ [defensiveFetch] Respuesta no OK (${response.status})`
        );
        return {
          data: fallbackData,
          error: `HTTP ${response.status}`,
          status: response.status,
        };
      }

      // ✅ VALIDACIÓN: Respuesta no esté vacía
      if (!text || text.trim().length === 0) {
        console.warn(`⚠️ [defensiveFetch] Respuesta vacía`);
        return {
          data: fallbackData,
          error: "Respuesta vacía del servidor",
          status: 200,
        };
      }

      // ✅ PARSEAR JSON: Solo si hay contenido
      let data: T;
      try {
        data = JSON.parse(text);
      } catch (parseError: any) {
        console.error(
          `💥 [defensiveFetch] Error al parsear JSON: ${parseError.message}`
        );
        console.error(
          `📄 [defensiveFetch] Contenido: ${text.substring(0, 200)}`
        );
        return {
          data: fallbackData,
          error: "Respuesta inválida",
          status: 200,
        };
      }

      // ✅ VALIDACIÓN: Objeto no esté vacío
      if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
        console.warn(`⚠️ [defensiveFetch] Objeto vacío`);
        return {
          data: fallbackData,
          error: "Datos no encontrados",
          status: 200,
        };
      }

      console.log(`✅ [defensiveFetch] Éxito`);
      return { data, error: null, status: 200 };
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === "AbortError") {
        console.error(`💥 [defensiveFetch] Timeout (${timeout}ms)`);
        return {
          data: fallbackData,
          error: "Timeout",
          status: 0,
        };
      }

      console.error(`💥 [defensiveFetch] Error fetch: ${fetchError.message}`);
      return {
        data: fallbackData,
        error: fetchError.message,
        status: 0,
      };
    }
  } catch (error: any) {
    console.error(`💥 [defensiveFetch] Error crítico: ${error.message}`);
    return {
      data: options.fallbackData || null,
      error: error.message,
      status: 0,
    };
  }
}

/**
 * Helper para simular datos fallback en desarrollo
 */
export function createFallbackEnvio(id: number | string): any {
  return {
    id: typeof id === 'number' ? id : 0,
    trackingId: typeof id === 'string' ? id : `TRACK-${id}`,
    destinatario: "Datos no disponibles",
    direccion: "Dirección no disponible",
    estado: "DESCONOCIDO",
    descripcion: "Descripción no disponible",
    fechaCreacion: new Date().toISOString(),
    _fallback: true,
  };
}
