/**
 * Formatea una fecha que puede venir en diferentes formatos:
 * - Array [yyyy, mm, dd, hh, mm, ss]
 * - String ISO "2024-01-15T10:30:00"
 * - Objeto Date
 * 
 * @param fecha - La fecha en cualquier formato
 * @returns String formateado como "dd/mm/yyyy" o "-" si es inválida
 */
export function formatearFecha(fecha: any): string {
  if (!fecha) return "-";

  try {
    let dateObj: Date;

    // Si es un array [yyyy, mm, dd, ...]
    if (Array.isArray(fecha)) {
      const [year, month, day] = fecha;
      if (!year || !month || !day) return "-";
      // Los meses en JS van de 0-11, pero del backend vienen 1-12
      dateObj = new Date(year, month - 1, day);
    }
    // Si es un string ISO
    else if (typeof fecha === "string") {
      dateObj = new Date(fecha);
    }
    // Si ya es un objeto Date
    else if (fecha instanceof Date) {
      dateObj = fecha;
    }
    // Formato desconocido
    else {
      return "-";
    }

    // Verificar que la fecha sea válida
    if (isNaN(dateObj.getTime())) {
      return "-";
    }

    // Formatear como dd/mm/yyyy
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formateando fecha:", error);
    return "-";
  }
}

/**
 * Formatea una fecha con hora
 * @param fecha - La fecha en cualquier formato
 * @returns String formateado como "dd/mm/yyyy HH:mm" o "-" si es inválida
 */
export function formatearFechaHora(fecha: any): string {
  if (!fecha) return "-";

  try {
    let dateObj: Date;

    if (Array.isArray(fecha)) {
      const [year, month, day, hour = 0, minute = 0] = fecha;
      if (!year || !month || !day) return "-";
      dateObj = new Date(year, month - 1, day, hour, minute);
    } else if (typeof fecha === "string") {
      dateObj = new Date(fecha);
    } else if (fecha instanceof Date) {
      dateObj = fecha;
    } else {
      return "-";
    }

    if (isNaN(dateObj.getTime())) {
      return "-";
    }

    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    const hour = String(dateObj.getHours()).padStart(2, "0");
    const minute = String(dateObj.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${hour}:${minute}`;
  } catch (error) {
    console.error("Error formateando fecha con hora:", error);
    return "-";
  }
}

/**
 * Formatea una fecha de forma corta (mes abreviado)
 * @param fecha - La fecha en cualquier formato
 * @returns String formateado como "15 Ene 2024" o "-" si es inválida
 */
export function formatearFechaCorta(fecha: any): string {
  if (!fecha) return "-";

  try {
    let dateObj: Date;

    if (Array.isArray(fecha)) {
      const [year, month, day] = fecha;
      if (!year || !month || !day) return "-";
      dateObj = new Date(year, month - 1, day);
    } else if (typeof fecha === "string") {
      dateObj = new Date(fecha);
    } else if (fecha instanceof Date) {
      dateObj = fecha;
    } else {
      return "-";
    }

    if (isNaN(dateObj.getTime())) {
      return "-";
    }

    const day = dateObj.getDate();
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const month = monthNames[dateObj.getMonth()];
    const year = dateObj.getFullYear();

    return `${day} ${month} ${year}`;
  } catch (error) {
    console.error("Error formateando fecha corta:", error);
    return "-";
  }
}
