import Link from "next/link"

const API_URL = process.env.NEXT_PUBLIC_API_URL

const steps = [
  { key: "EN_MIAMI", label: "Recibido en Miami" },
  { key: "EN_TRANSITO", label: "En Transito" },
  { key: "ADUANA_REPARTO", label: "Aduana / Reparto" },
  { key: "ENTREGADO", label: "Entregado" },
]

function normalizeState(value: string) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
}

function getActiveIndex(rawState: string) {
  const state = normalizeState(rawState)
  if (state === "EN_MIAMI") return 0
  if (state === "EN_TRANSITO") return 1
  if (state === "ENTREGADO") return 3
  if (
    state === "ADUANA" ||
    state === "EN_ADUANA" ||
    state === "CENTRO_DISTRIBUCION" ||
    state === "EN_RUTA"
  ) {
    return 2
  }
  if (state.includes("TRANSITO")) return 1
  if (state.includes("ADUANA") || state.includes("RUTA") || state.includes("CENTRO")) return 2
  return 0
}

function formatDate(value?: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("es-EC")
}

export default async function RastreoPage({
  searchParams,
}: {
  searchParams: Promise<{ guia?: string }>
}) {
  const { guia } = await searchParams
  const guiaValue = String(guia || "").trim()

  if (!guiaValue) {
    return (
      <div className="min-h-screen bg-[#0f1012] text-white">
        <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
          <h1 className="text-3xl font-semibold">Rastrea tu envio</h1>
          <p className="mt-3 text-white/70">Ingresa una guia para ver el estado.</p>
          <Link
            href="/"
            className="mt-6 rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-[#1a1a1a]"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  if (!API_URL) {
    console.error("NEXT_PUBLIC_API_URL no esta configurada")
    return (
      <div className="min-h-screen bg-[#0f1012] text-white">
        <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10">
            <h1 className="text-3xl font-semibold">No pudimos cargar el envio</h1>
            <p className="mt-3 text-white/70">Configuracion del backend no disponible.</p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-[#1a1a1a]"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    )
  }
  const endpoint = `${API_URL}/api/public/tracking/${encodeURIComponent(guiaValue)}`
  const res = await fetch(endpoint, { cache: "no-store" })

  if (res.status === 404) {
    return (
      <div className="min-h-screen bg-[#0f1012] text-white">
        <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10">
            <h1 className="text-3xl font-semibold">No encontramos ese envio</h1>
            <p className="mt-3 text-white/70">Verifica el numero e intentalo de nuevo.</p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-[#1a1a1a]"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!res.ok) {
    return (
      <div className="min-h-screen bg-[#0f1012] text-white">
        <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10">
            <h1 className="text-3xl font-semibold">No pudimos cargar el envio</h1>
            <p className="mt-3 text-white/70">Intentalo nuevamente en unos minutos.</p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-[#1a1a1a]"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const data = await res.json()
  const estadoActual = String(data?.estado || data?.status || "").trim()
  const activeIndex = getActiveIndex(estadoActual)

  return (
    <div className="min-h-screen bg-[#0f1012] text-white">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-amber-200">Rastreo publico</p>
              <h1 className="text-3xl font-semibold">Guia {guiaValue}</h1>
            </div>
            <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm">
              <div className="text-white/70">Ciudad destino</div>
              <div className="text-lg font-semibold">{data?.destinatarioCiudad || "-"}</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#131417] p-5">
              <div className="text-sm text-white/60">Estado actual</div>
              <div className="mt-2 text-xl font-semibold">
                {estadoActual || "En proceso"}
              </div>
              <div className="mt-2 text-sm text-white/60">
                {data?.descripcion || data?.detalle || "Seguimiento en curso"}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#131417] p-5">
              <div className="text-sm text-white/60">Fecha estimada</div>
              <div className="mt-2 text-xl font-semibold">
                {formatDate(data?.fechaEstimada)}
              </div>
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-xl font-semibold">Linea de tiempo</h2>
            <div className="mt-6 space-y-6">
              {steps.map((step, index) => {
                const isCompleted = index < activeIndex
                const isActive = index === activeIndex
                const circleClass = isActive
                  ? "border-amber-400 bg-amber-400 text-[#1a1a1a]"
                  : isCompleted
                    ? "border-emerald-400 bg-emerald-400 text-[#0f1012]"
                    : "border-white/20 bg-white/10 text-white/60"
                const textClass = isActive
                  ? "text-amber-200"
                  : isCompleted
                    ? "text-emerald-200"
                    : "text-white/60"
                return (
                  <div key={step.key} className="relative flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${circleClass}`}>
                        {index + 1}
                      </div>
                      {index < steps.length - 1 && <div className="h-10 w-px bg-white/15" />}
                    </div>
                    <div className={`pt-2 text-sm font-semibold ${textClass}`}>{step.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
