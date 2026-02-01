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

interface ShippingLabelProps {
  envio: Envio
}

// Estilos seguros y básicos
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 20,
    borderBottom: "2px solid #000000",
    paddingBottom: 10,
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
  },
  title: {
    fontSize: 10,
    textAlign: "center",
    fontWeight: "bold",
  },
  trackingSection: {
    border: 3,
    borderColor: "#000000",
    padding: 8,
    marginBottom: 8,
    backgroundColor: "#f9f9f9",
  },
  trackingLabel: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 2,
  },
  trackingNumber: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: 6,
  },
  barcode: {
    height: 30,
    backgroundColor: "#000000",
    marginTop: 4,
    borderRadius: 2,
  },
  barcodeLines: {
    flexDirection: "row",
    justifyContent: "space-around",
    height: 30,
    marginTop: 4,
  },
  barcodeLine: {
    width: 3,
    height: 30,
    backgroundColor: "#000000",
  },
  section: {
    border: 2,
    borderColor: "#000000",
    padding: 6,
    marginBottom: 6,
  },
  sectionHeader: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
    textTransform: "uppercase",
    borderBottom: 1,
    borderBottomColor: "#000000",
    paddingBottom: 2,
  },
  row: {
    fontSize: 8,
    marginBottom: 2,
  },
  label: {
    fontWeight: "bold",
    fontSize: 7,
    color: "#555555",
  },
  value: {
    fontSize: 9,
    fontWeight: "bold",
    marginTop: 1,
  },
  footer: {
    borderTop: 1,
    borderTopColor: "#000000",
    paddingTop: 4,
    marginTop: 4,
  },
  footerText: {
    fontSize: 6,
    textAlign: "center",
    color: "#666666",
  },
})

export default function ShippingLabel({ envio }: ShippingLabelProps) {
  // Protección contra datos nulos
  if (!envio) {
    return (
      <Document>
        <Page style={styles.page}>
          <Text>No hay datos del envío disponibles</Text>
        </Page>
      </Document>
    )
  }

  const trackingNumber = envio.numeroTracking || `NAC-${String(envio.id || "000").padStart(6, "0")}`
  const remitenteNombre = envio.usuario?.nombre || "Remitente"
  const ciudad = envio.ciudad || "Destino"
  const direccion = envio.direccion || "Dirección Principal"
  const descripcion = envio.descripcion || "Paquete"
  const peso = envio.pesoLibras || 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* CABECERA */}
        <View style={styles.header}>
          <Text style={styles.logo}>COURRIER TICS</Text>
          <Text style={styles.title}>GUÍA DE REMISIÓN</Text>
        </View>

        {/* TRACKING NÚMERO - PROMINENTE */}
        <View style={{ fontSize: 28, fontWeight: "bold", textAlign: "center", margin: 20, padding: 15, border: "2px solid #000000" }}>
          <Text>{trackingNumber}</Text>
        </View>

        {/* SECCIÓN ORIGEN */}
        <View style={styles.section}>
          <Text style={styles.label}>REMITENTE (FROM):</Text>
          <Text style={styles.value}>{remitenteNombre}</Text>
          <Text style={styles.value}>Ecuador</Text>
        </View>

        {/* SECCIÓN DESTINO */}
        <View style={styles.section}>
          <Text style={styles.label}>DESTINO (TO):</Text>
          <Text style={styles.value}>{ciudad}</Text>
          <Text style={styles.value}>{direccion}</Text>
        </View>

        {/* DETALLES */}
        <View style={styles.section}>
          <Text style={styles.label}>DETALLE DEL ENVÍO:</Text>
          <Text style={styles.value}>{descripcion}</Text>
          <Text style={styles.value}>Peso: {peso} lb</Text>
        </View>

        {/* FOOTER */}
        <Text style={{ position: "absolute", bottom: 30, left: 30, fontSize: 8, color: "#aaa" }}>
          Generado el: {new Date().toLocaleDateString()}
        </Text>
      </Page>
    </Document>
  )
}
