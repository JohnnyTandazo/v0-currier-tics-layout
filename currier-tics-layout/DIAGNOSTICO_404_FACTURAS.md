# 🔴 PROBLEMA IDENTIFICADO

## Error observado en Frontend:
```
GET https://v0-courrier-tics-layout.vercel.app/api/facturas/usuario/1 → 404 (Not Found)
Respuesta: HTML (<!DOCTYPE html...) en lugar de JSON
Error al parsear: "Unexpected token '<', <!DOCTYPE html is not valid JSON"
```

## ¿QUÉ SIGNIFICA?
El Frontend está llamando al Backend pero recibe **HTML de error 404**, no JSON.

---

## 🔍 DIAGNÓSTICO

### Escenario A: El endpoint NO existe en el Backend
**Síntomas:** 404 + HTML de error
**Solución:** 

El Backend DEBE tener en `FacturaController.java`:
```java
@GetMapping("/usuario/{usuarioId}")
public ResponseEntity<List<Factura>> obtenerPorUsuario(@PathVariable Long usuarioId) {
    List<Factura> facturas = facturaService.obtenerPorUsuario(usuarioId);
    return ResponseEntity.ok(facturas);
}
```

### Escenario B: El endpoint existe pero no filtra correctamente
**Síntomas:** 200 OK pero devuelve []
**Solución:** Verificar `FacturaService.obtenerPorUsuario()`

```java
public List<Factura> obtenerPorUsuario(Long usuarioId) {
    return facturaRepository.findByUsuarioId(usuarioId);
    // O si usas Spring Data:
    // return facturaRepository.findAll()
    //   .stream()
    //   .filter(f -> f.getUsuario().getId().equals(usuarioId))
    //   .collect(Collectors.toList());
}
```

### Escenario C: No hay datos en la BD
**Síntomas:** 200 OK, devuelve [], pero debería haber facturas
**Solución:** Verificar que:
1. ✅ Existe usuario con id=1
2. ✅ Existen facturas con usuario_id=1
3. ✅ CargaDeDatos.java se ejecutó al iniciar (o correr manualmente)

---

## ✅ CHECKLIST INMEDIATO

**En el Backend, ejecuta ESTOS comandos:**

### 1. Verifica que el usuario existe
```sql
SELECT * FROM usuarios WHERE id = 1;
```
**Esperado:** Debe devolver 1 fila con email "cliente@test.com" o similar

### 2. Verifica que hay facturas
```sql
SELECT * FROM facturas WHERE usuario_id = 1;
```
**Esperado:** Debe devolver al menos 1-2 facturas con estado PENDIENTE

### 3. Verifica la estructura de la tabla facturas
```sql
DESCRIBE facturas;
```
**Campos CRÍTICOS que deben existir:**
- id
- monto (NO "total")
- estado (PENDIENTE, PAGADA, etc.)
- numero_factura
- usuario_id
- envio_id (opcional pero recomendado)

### 4. Comprueba que el Controller responde
En terminal Backend, ejecuta:
```bash
curl -X GET "http://localhost:8080/api/facturas/usuario/1" \
  -H "Content-Type: application/json"
```

**Esperado:** Devuelve JSON array:
```json
[
  {
    "id": 1,
    "numeroFactura": "FAC-2026-001",
    "monto": 350.00,
    "estado": "PENDIENTE",
    "usuario_id": 1,
    "envio_id": 1
  }
]
```

**NO esperado:** HTML, 404, 500

---

## 🚨 ERRORES COMUNES

| Error | Causa | Fix |
|-------|-------|-----|
| 404 HTML | Endpoint no existe | Agregar @GetMapping("/usuario/{usuarioId}") |
| 200 [] vacío | Sin datos en BD | Correr CargaDeDatos.java o INSERT manual |
| 500 Internal Server Error | Exception en controller/service | Ver logs del backend |
| 415 Unsupported Media Type | Header incorrecto | Verificar que devuelve JSON |

---

## 📋 PRÓXIMO PASO

Comparte:
1. ✅ Resultado del `DESCRIBE facturas;`
2. ✅ Resultado de `SELECT * FROM usuarios WHERE id = 1;`
3. ✅ Resultado de `SELECT * FROM facturas WHERE usuario_id = 1;`
4. ✅ Logs exactos del Backend cuando se hace GET /api/facturas/usuario/1
5. ✅ ¿El archivo CargaDeDatos.java se ejecutó? (busca en logs: "DATOS DE PRUEBA CARGADOS")
