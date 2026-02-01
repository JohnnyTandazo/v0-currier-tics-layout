/**
 * Realiza un fetch de forma segura manejando JSON vacío y errores de parsing
 * @param url - URL del endpoint
 * @param options - Opciones de fetch
 * @returns Objeto parseado o vacío si falla
 */
export async function safeFetch(url: string, options?: RequestInit): Promise<any> {
  try {
    console.log(`📡 safeFetch iniciando: ${url}`);
    const response = await fetch(url, options);
    
    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    
    // Verificar status HTTP primero
    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ Fetch error ${response.status}: ${text.substring(0, 200)}`);
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }
    
    // Obtener el texto para validar
    const text = await response.text();
    console.log(`📡 Response text length: ${text.length} chars`);
    
    // Si está vacío, retornar array vacío (para endpoints que retornan listas)
    if (!text || text.trim() === "") {
      console.warn(`⚠️ Respuesta vacía de ${url}`);
      return [];
    }
    
    // Intentar parsear JSON
    try {
      // ✅ VALIDAR QUE NO SEA HTML antes de parsear
      if (text.trim().startsWith('<') || text.includes('<!DOCTYPE') || text.includes('<html')) {
        console.error("❌ El servidor retornó HTML en lugar de JSON");
        console.error("📄 Contenido HTML recibido:", text.substring(0, 500));
        throw new Error(`El servidor retornó HTML en lugar de JSON. Status: ${response.status}`);
      }
      
      const data = JSON.parse(text);
      console.log(`✅ JSON parseado exitosamente de ${url}`);
      return data;
    } catch (parseError) {
      console.error("❌ Error parseando JSON:", parseError);
      console.error("📄 Texto recibido:", text.substring(0, 500));
      
      // ✅ MENSAJE MÁS CLARO si es HTML
      if (text.trim().startsWith('<')) {
        throw new Error(`El servidor retornó HTML en lugar de JSON (posible error CORS o página de error)`);
      }
      
      throw new Error(`JSON parse error: ${text.substring(0, 100)}`);
    }
  } catch (error) {
    console.error("❌ Error en safeFetch:", error);
    throw error;
  }
}

/**
 * Versión simplificada para obtener datos sin lanzar errores
 * @param url - URL del endpoint
 * @param options - Opciones de fetch
 * @returns Objeto con { data, error }
 */
export async function safeFetchQuiet(url: string, options?: RequestInit): Promise<{ data: any; error: string | null }> {
  try {
    const data = await safeFetch(url, options);
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || "Error desconocido" };
  }
}
