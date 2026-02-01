import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
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

// Estilos para el PDF (4x6 pulgadas = 288x432 puntos)
const styles = StyleSheet.create({
  page: {
    width: 288,
    height: 432,
    padding: 12,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  header: {
    borderBottom: 3,
    borderBottomColor: "#000000",
    paddingBottom: 8,
    marginBottom: 8,
  },
  logo: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 2,
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

export const ShippingLabel: React.FC<ShippingLabelProps> = ({ envio }) => {
  const trackingNumber = envio.numeroTracking || `NAC-${String(envio.id || "000").padStart(6, "0")}`
  const remitenteNombre = envio.usuario?.nombre || "Remitente"
  const destinatarioNombre = "Destinatario Final"
  const ciudad = envio.ciudad || "Destino"
  const direccion = envio.direccion || "Dirección Principal"
  const descripcion = envio.descripcion || "Paquete estándar"
  const peso = envio.pesoLibras || 0
  const fechaCreacion = envio.fechaCreacion
    ? new Date(envio.fechaCreacion).toLocaleDateString("es-EC", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : new Date().toLocaleDateString("es-EC")

  return (
    <Document>
      <Page size={[288, 432]} style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.logo}>🚚 COURRIER TICS</Text>
          <Text style={styles.title}>GUÍA DE REMISIÓN</Text>
        </View>

        {/* TRACKING NUMBER */}
        <View style={styles.trackingSection}>
          <Text style={styles.trackingLabel}>NÚMERO DE GUÍA</Text>
          <Text style={styles.trackingNumber}>{trackingNumber}</Text>
          {/* Código de barras simulado con líneas */}
          <View style={styles.barcodeLines}>
            {Array.from({ length: 20 }).map((_, i) => (
              <View
                key={i}
                style={{
                  ...styles.barcodeLine,
                  width: i % 3 === 0 ? 4 : 2,
                }}
              />
            ))}
          </View>
        </View>

        {/* REMITENTE (FROM) */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>📤 FROM / REMITENTE</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value}>{remitenteNombre}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Origen:</Text>
            <Text style={styles.value}>Ecuador</Text>
          </View>
        </View>

        {/* DESTINATARIO (TO) */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>📥 TO / DESTINATARIO</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value}>{destinatarioNombre}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Ciudad:</Text>
            <Text style={styles.value}>{ciudad}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Dirección:</Text>
            <Text style={styles.value}>{direccion}</Text>
          </View>
        </View>

        {/* DETALLES DEL ENVÍO */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>📦 DETALLES DEL ENVÍO</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Descripción:</Text>
            <Text style={styles.value}>{descripcion}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Peso:</Text>
            <Text style={styles.value}>{peso.toFixed(2)} lb</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha:</Text>
            <Text style={styles.value}>{fechaCreacion}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Estado:</Text>
            <Text style={styles.value}>{envio.estado || "PENDIENTE"}</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            www.courriertics.com | Servicio de envíos nacionales e internacionales
          </Text>
          <Text style={styles.footerText}>
            ⚠ Conserve esta guía hasta la entrega del paquete
          </Text>
        </View>
      </Page>
    </Document>
  )
}
