/**
 * Realiza un fetch de forma segura manejando JSON vacío y errores de parsing
 * @param url - URL del endpoint
 * @param options - Opciones de fetch
 * @returns Objeto parseado o vacío si falla
 */
export async function safeFetch(url: string, options?: RequestInit): Promise<any> {
  try {
    const response = await fetch(url, options);
    
    // Obtener el texto primero para evitar "Unexpected end of JSON input"
    const text = await response.text();
    
    // Si está vacío, retornar objeto vacío o error según status
    if (!text || text.trim() === "") {
      if (!response.ok) {
        throw new Error(`Error ${response.status}: Respuesta vacía del servidor`);
      }
      return {};
    }
    
    // Intentar parsear JSON
    try {
      const data = JSON.parse(text);
      
      // Si la respuesta no es OK, lanzar error con el mensaje del backend
      if (!response.ok) {
        const errorMessage = data.message || data.error || `Error ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return data;
    } catch (parseError) {
      console.error("❌ Error parseando JSON:", parseError);
      console.error("📄 Texto recibido:", text);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${text.substring(0, 100)}`);
      }
      
      // Si el status es OK pero no es JSON válido, retornar objeto vacío
      return {};
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
