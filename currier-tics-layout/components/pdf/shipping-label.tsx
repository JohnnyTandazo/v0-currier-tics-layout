import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"

interface Envio {
  id?: string | number
  numeroTracking?: string
  usuario?: {
    nombre?: string
    email?: string
  }
  descripcion?: string
  pesoLibras?: number
  valorDeclarado?: number
  ciudad?: string
  direccion?: string
  estado?: string
  fechaCreacion?: string
}

// ESTILOS EXPLÍCITOS (Sin shorthands que rompan)
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    borderBottomStyle: "solid",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
  },
  section: {
    marginVertical: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "solid",
  },
  label: {
    fontSize: 9,
    color: "#888",
    marginBottom: 2,
  },
  value: {
    fontSize: 12,
    marginBottom: 5,
  },
  trackingBox: {
    marginVertical: 20,
    padding: 10,
    borderWidth: 2,
    borderColor: "#000",
    borderStyle: "dashed",
    alignItems: "center",
  },
  trackingText: {
    fontSize: 30,
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    fontSize: 8,
    color: "#aaa",
  },
})

export default function ShippingLabel({ envio }: { envio: any }) {
  // Protección contra nulos
  if (!envio) {
    return (
      <Document>
        <Page style={styles.page}>
          <Text>Cargando datos...</Text>
        </Page>
      </Document>
    )
  }

  // Función para formatear dinero
  const formatMoney = (amount: any) => Number(amount || 0).toFixed(2)

  return (
    <Document>
      <Page style={styles.page}>
        {/* CABECERA */}
        <View style={styles.header}>
          <Text style={styles.title}>COURRIER TICS</Text>
          <Text style={styles.subtitle}>Guía de Remisión Oficial</Text>
        </View>

        {/* TRACKING */}
        <View style={styles.trackingBox}>
          <Text style={styles.trackingText}>
            {envio.numeroTracking || "PENDIENTE"}
          </Text>
        </View>

        {/* REMITENTE */}
        <View style={styles.section}>
          <Text style={styles.label}>REMITENTE (FROM):</Text>
          <Text style={styles.value}>
            {envio.usuario?.nombre || "Cliente Registrado"}
          </Text>
          <Text style={styles.value}>Ecuador</Text>
        </View>

        {/* DESTINATARIO */}
        <View style={styles.section}>
          <Text style={styles.label}>DESTINO (TO):</Text>
          <Text style={styles.value}>{envio.ciudad || "Ciudad por definir"}</Text>
          <Text style={styles.value}>
            {envio.direccion || "Dirección Principal"}
          </Text>
        </View>

        {/* DETALLE */}
        <View style={styles.section}>
          <Text style={styles.label}>DETALLES DEL PAQUETE:</Text>
          <Text style={styles.value}>
            {envio.descripcion || "Sin descripción"}
          </Text>
          <Text style={styles.value}>
            Peso: {envio.pesoLibras || 0} lb
          </Text>
        </View>

        {/* INFORMACIÓN FINANCIERA */}
        <View style={styles.section}>
          <Text style={styles.label}>INFORMACIÓN DE VALOR:</Text>
          
          <View style={{ marginBottom: 5 }}>
            <Text style={styles.label}>Valor Declarado:</Text>
            <Text style={styles.value}>
              ${formatMoney(envio.valorDeclarado)}
            </Text>
          </View>

          <View style={{ marginBottom: 5 }}>
            <Text style={styles.label}>Seguro Estimado (1%):</Text>
            <Text style={styles.value}>
              ${formatMoney((envio.valorDeclarado || 0) * 0.01)}
            </Text>
          </View>

          <View>
            <Text style={styles.label}>Peso Facturable:</Text>
            <Text style={styles.value}>{envio.pesoLibras || 0} lb</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Generado automáticamente el {new Date().toLocaleDateString()}
        </Text>
      </Page>
    </Document>
  )
}
