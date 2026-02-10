# ✅ VERIFICACIÓN DE CONFIGURACIÓN DEL API

## 1. URL DEL API

**Configurado en:** `.env.local`
```
NEXT_PUBLIC_API_URL=https://backend-tesis-spring-production.up.railway.app
```

**Estado:** ✅ Apunta a Railway (producción)

---

## 2. ENDPOINTS MAPEADOS

### 2.1 GET /api/envios?usuarioId={id}
- **Archivo:** `components/dashboards/mis-envios.tsx` (línea ~150)
- **Ubicado en:** `safeFetch()` en `lib/safeFetch.ts`
- **Manejo de errores:** ✅ Try-catch + fallback vacío

```typescript
const url = `/api/envios?usuarioId=${encodeURIComponent(String(usuarioStored.id))}`
const data = await safeFetch(url)
```

### 2.2 GET /api/facturas/usuario/{id}
- **Archivo:** `components/dashboards/pagos.tsx` (línea ~155)
- **Uso:** Cargar facturas pendientes para el dropdown
- **Manejo:** ✅ Validación de array antes de filtrar

```typescript
const resFacturas = await fetch(`${apiUrl}/api/facturas/usuario/${usuario.id}`)
```

### 2.3 GET /api/pagos?usuarioId={id}
- **Archivo:** `components/dashboards/pagos.tsx` (línea ~193)
- **Uso:** Historial de pagos recientes
- **Manejo:** ✅ Verificación de array + filtrado por usuario

```typescript
const resPagos = await fetch(`${apiUrl}/api/pagos?usuarioId=${usuario.id}`)
```

### 2.4 POST /api/pagos
- **Archivo:** `components/dashboards/pagos.tsx` (línea ~230)
- **Tipo:** **FormData** (multipart/form-data)
- **Campos enviados:**
  - `facturaId` (string)
  - `monto` (string)
  - `metodoPago` (string)
  - `referencia` (string)
  - `descripcion` (string, opcional)
  - `comprobante` (File, opcional)

```typescript
const submitData = new FormData()
submitData.append("facturaId", formData.facturaId)
submitData.append("monto", formData.monto)
// ... más campos
if (formData.comprobante) {
  submitData.append("comprobante", formData.comprobante)
}

const response = await fetch(`${apiUrl}/api/pagos`, {
  method: "POST",
  body: submitData,  // ← NO tiene "Content-Type" (browser lo auto-configura)
})
```

---

## 3. MANEJO DE ERRORES

### ✅ Funciones de utilidad:

**`safeFetch()`** (lib/safeFetch.ts):
- Lee como texto primero
- Valida JSON válido
- Retorna objeto vacío en caso de error
- Try-catch alrededor de todo

**`defensiveFetch()`** (lib/defensiveFetch.ts):
- Timeout configurable
- Fallback data customizable
- Retorna: `{ data, error, status }`

### ✅ En archivos principales:
- **mis-envios.tsx:** Try-catch + console.error + fallback vacío ✅
- **pagos.tsx:** Try-catch + alert al usuario + console.error ✅
- **mis-documentos.tsx:** Try-catch + estado loading ✅

---

## 4. HEADERS CORS

**Configuración actual:**

En `defensiveFetch()`:
```typescript
headers: {
  "Content-Type": "application/json",
  ...headers,
}
```

⚠️ **IMPORTANTE:** Para FormData (POST /api/pagos), NO enviamos `Content-Type` explícitamente.
El navegador lo configura automáticamente con el boundary correcto.

---

## 5. PRUEBAS EN CONSOLA DEL NAVEGADOR

### 5.1 Prueba GET /api/envios
```javascript
fetch('https://backend-tesis-spring-production.up.railway.app/api/envios')
  .then(r => r.json())
  .then(d => console.log('✅ OK:', d))
  .catch(e => console.error('❌ ERROR:', e))
```

**Esperado:** Array [] o Array con objetos Envio

---

### 5.2 Prueba GET /api/facturas/usuario/1
```javascript
fetch('https://backend-tesis-spring-production.up.railway.app/api/facturas/usuario/1')
  .then(r => r.json())
  .then(d => console.log('✅ OK:', d))
  .catch(e => console.error('❌ ERROR:', e))
```

**Esperado:** Array con facturas (cada una debe tener `envioId`)

---

### 5.3 Prueba GET /api/pagos
```javascript
fetch('https://backend-tesis-spring-production.up.railway.app/api/pagos?usuarioId=1')
  .then(r => r.json())
  .then(d => console.log('✅ OK:', d))
  .catch(e => console.error('❌ ERROR:', e))
```

**Esperado:** Array [] o Array con pagos

---

### 5.4 Prueba POST /api/pagos (FormData)
```javascript
const form = new FormData()
form.append('facturaId', '1')
form.append('monto', '50.00')
form.append('metodoPago', 'transferencia')
form.append('referencia', 'TRX-TEST-001')

fetch('https://backend-tesis-spring-production.up.railway.app/api/pagos', {
  method: 'POST',
  body: form  // ← FormData, navegador configura Content-Type automáticamente
})
  .then(r => r.json())
  .then(d => console.log('✅ OK:', d))
  .catch(e => console.error('❌ ERROR:', e))
```

---

## 6. CHECKLIST DE VERIFICACIÓN

- ✅ URL del API: `https://backend-tesis-spring-production.up.railway.app`
- ✅ GET endpoints: Todos usando path absoluto + query params
- ✅ POST endpoint: FormData (multipart/form-data)
- ✅ Try-catch: En todos los fetch principales
- ✅ Validación de array: Antes de .filter() y .map()
- ✅ Manejo de respuesta vacía: Fallback a [] o {}
- ✅ Console.error: Registra todos los errores
- ✅ Usuario del localStorage: Verificado antes de fetch

---

## 7. PRÓXIMOS PASOS

1. **Abrir DevTools** (F12) → Console
2. **Copiar y ejecutar** los comandos de prueba de sección 5
3. **Verificar que cada endpoint devuelve datos** sin errores
4. **Si hay CORS error:** El backend necesita @CrossOrigin en los controllers
5. **Si hay 404:** Verificar que las rutas exactas coincidan con el backend

---

## 8. NOTAS IMPORTANTES

- ⚠️ Los endpoints usan path absoluto `/api/...` que se resuelven a la URL en `.env.local`
- ⚠️ El usuario debe estar autenticado en localStorage
- ⚠️ Las facturas deben tener `envioId` para mapear estado de pago en mis-envios
- ⚠️ POST /api/pagos NO usa `Content-Type: application/json` (es FormData)
