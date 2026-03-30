import React, { useEffect, useMemo, useState } from "react";
import { Head } from "@inertiajs/react";
import Chart from "react-apexcharts";

type Card = { label: string; value: number };
type SimpleChart = { labels: string[]; values: number[] };
type IngresosChart = { labels: string[]; values: number[] };
type MovimientoRow = { id: string; fecha: string; tipo: string; volquete: string; ubicacion_nueva?: string | null; nota?: string | null; };
type AlquilerActivoRow = { id: string; cliente: string; direccion: string; volquete_id?: string | null; fecha_colocacion: string; dias_activo: number; nota?: string | null; };
type AlquilerCerradoRow = { id: string; alquiler_id?: string | null; volquete_id?: string | null; fecha_colocacion?: string | null; fecha_retiro?: string | null; dias?: number | null; direccion?: string | null; cliente?: string | null; nota?: string | null; reemplazos_total?: number; dinero_total_ars?: number; };
type CerradosStats = { total: number; ingresos_total: number; dias_promedio: number; dias_max: number; };
type StatsResponse = {
  cards: Card[];
  charts: { ingresos: IngresosChart; estadoVolquetes: SimpleChart; conceptoDinero?: SimpleChart; privados?: SimpleChart; };
  tables: { ultimosMovimientos: MovimientoRow[]; alquileresActivos: AlquilerActivoRow[]; alquileresCerrados: AlquilerCerradoRow[]; };
  cerradosStats: CerradosStats;
};

const DARK = { bg: "#0d0f11", surface: "#13171b", surface2: "#1a1f25", border: "#252b33", text: "#e8ecf0", muted: "#5a6472", accent: "#4f7cff", yellow: "#f5c842", green: "#22c55e", red: "#ef4444" };

function formatARS(n: number) { return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n); }
function formatDate(d: string | null | undefined) { if (!d) return "-"; const date = new Date(d); if (Number.isNaN(date.getTime())) return d; return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(date); }

export default function StatsIndex() {
  const [days, setDays] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/dashboard/stats?days=${days}`, { headers: { Accept: "application/json" }, credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e: any) { setError(e?.message ?? "Error"); } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [days]);

  const ingresosOptions = useMemo(() => ({
    chart: { type: "area" as const, toolbar: { show: false }, zoom: { enabled: false }, background: "transparent" },
    stroke: { curve: "smooth" as const, width: 2 },
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.0 } },
    grid: { borderColor: DARK.border, strokeDashArray: 4 },
    xaxis: { categories: data?.charts.ingresos.labels ?? [], labels: { rotate: -45, hideOverlappingLabels: true, style: { colors: DARK.muted, fontSize: "10px" } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: DARK.muted, fontSize: "11px" }, formatter: (val: number) => new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(val) } },
    colors: [DARK.accent], tooltip: { theme: "dark", y: { formatter: (val: number) => formatARS(val) } }, theme: { mode: "dark" as const },
  }), [data]);

  const ingresosSeries = useMemo(() => [{ name: "Ingresos", data: data?.charts.ingresos.values ?? [] }], [data]);
  const donutOpts = (labels: string[], colors?: string[]) => ({
    chart: { type: "donut" as const, background: "transparent" }, labels,
    legend: { position: "bottom" as const, labels: { colors: DARK.muted } },
    dataLabels: { enabled: false }, stroke: { width: 0 },
    colors: colors ?? [DARK.accent, DARK.yellow, DARK.green, DARK.red, "#a855f7", "#06b6d4"],
    tooltip: { theme: "dark" }, theme: { mode: "dark" as const }, plotOptions: { pie: { donut: { size: "65%" } } },
  });
  const totalIngresos = useMemo(() => (data?.charts.ingresos.values ?? []).reduce((a, v) => a + (Number(v) || 0), 0), [data]);

  return (
    <div style={{ minHeight: "100vh", background: DARK.bg, color: DARK.text, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500&display=swap'); a.nav-btn { transition: all 0.15s; } a.nav-btn:hover { opacity: 0.8; }`}</style>
      <Head title="Estadísticas Privados" />

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${DARK.border}`, background: DARK.surface, padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            {/* Volver */}
            <a href="/dashboard" className="nav-btn" style={{ display: "flex", alignItems: "center", gap: 6, color: DARK.muted, fontSize: 12, textDecoration: "none", background: DARK.surface2, border: `1px solid ${DARK.border}`, padding: "6px 12px", borderRadius: 7, fontWeight: 500 }}>
              ← App
            </a>
            <span style={{ color: DARK.border, fontSize: 16 }}>|</span>
            {/* Privados — activo */}
            <a href="/stats" className="nav-btn" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, textDecoration: "none", padding: "6px 12px", borderRadius: 7, fontWeight: 700, background: "#4f7cff18", border: "1px solid #4f7cff40", color: DARK.accent }}>
              Privados
            </a>
            {/* Municipales — inactivo */}
            <a href="/stats/municipales" className="nav-btn" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, textDecoration: "none", padding: "6px 12px", borderRadius: 7, fontWeight: 600, background: DARK.surface2, border: `1px solid ${DARK.border}`, color: DARK.muted }}>
              Municipales →
            </a>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Estadísticas Financieras</h1>
          <p style={{ fontSize: 12, color: DARK.muted, margin: "2px 0 0" }}>Ingresos, alquileres y movimientos de volquetes privados</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ background: DARK.surface2, border: `1px solid ${DARK.border}`, color: DARK.text, borderRadius: 8, padding: "8px 12px", fontSize: 13, cursor: "pointer", outline: "none" }}>
            <option value={7}>7 días</option><option value={30}>30 días</option><option value={90}>90 días</option>
          </select>
          <button onClick={() => void load()} style={{ background: DARK.accent, border: "none", color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Actualizar</button>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
        {error && <div style={{ background: "#ff4f4f15", border: "1px solid #ff4f4f40", borderRadius: 10, padding: "14px 18px", color: "#ff6b6b", fontSize: 13 }}>Error: {error}</div>}
        {loading && <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>{Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ height: 80, borderRadius: 10, background: DARK.surface, border: `1px solid ${DARK.border}`, opacity: 0.5 }} />)}</div>}

        {!loading && data && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
              {data.cards.map((c, i) => {
                const isMoney = c.label.toLowerCase().includes("ingresos") || c.label.toLowerCase().includes("ars");
                return (
                  <div key={i} style={{ background: DARK.surface, border: `1px solid ${DARK.border}`, borderRadius: 10, padding: "16px 18px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: DARK.muted, marginBottom: 8 }}>{c.label}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: isMoney ? 16 : 28, fontWeight: 800, lineHeight: 1 }}>{isMoney ? formatARS(c.value) : c.value.toLocaleString("es-AR")}</div>
                    {isMoney && <div style={{ fontSize: 10, color: DARK.muted, marginTop: 4 }}>Total: {formatARS(totalIngresos)}</div>}
                  </div>
                );
              })}
            </div>

            {data.cerradosStats && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: DARK.muted, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  Alquileres cerrados en el período <span style={{ flex: 1, height: 1, background: DARK.border, display: "inline-block" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                  {[
                    { label: "Cerrados", value: data.cerradosStats.total.toLocaleString("es-AR") },
                    { label: "Ingresos cerrados", value: formatARS(data.cerradosStats.ingresos_total) },
                    { label: "Días promedio", value: `${data.cerradosStats.dias_promedio}d` },
                    { label: "Días máximo", value: `${data.cerradosStats.dias_max}d` },
                  ].map((c, i) => (
                    <div key={i} style={{ background: DARK.surface, border: `1px solid ${DARK.border}`, borderTop: `2px solid ${DARK.green}`, borderRadius: 10, padding: "16px 18px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: DARK.muted, marginBottom: 8 }}>{c.label}</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{c.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
              <div style={{ background: DARK.surface, border: `1px solid ${DARK.border}`, borderRadius: 10, padding: "20px 20px 10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: DARK.muted }}>Ingresos por día</div>
                    <div style={{ fontSize: 11, color: DARK.muted, marginTop: 2 }}>Suma de dinero_movimientos</div>
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, fontWeight: 800 }}>{formatARS(totalIngresos)}</div>
                </div>
                <Chart options={ingresosOptions as any} series={ingresosSeries as any} type="area" height={240} />
              </div>
              <div style={{ background: DARK.surface, border: `1px solid ${DARK.border}`, borderRadius: 10, padding: "20px 20px 10px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: DARK.muted, marginBottom: 12 }}>Estado de flota</div>
                {(data.charts.estadoVolquetes.values ?? []).some(v => v > 0)
                  ? <Chart options={donutOpts(data.charts.estadoVolquetes.labels) as any} series={data.charts.estadoVolquetes.values as any} type="donut" height={240} />
                  : <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: DARK.muted, fontSize: 12 }}>Sin datos</div>}
              </div>
            </div>

            {(data.charts.conceptoDinero || data.charts.privados) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {data.charts.conceptoDinero && (
                  <div style={{ background: DARK.surface, border: `1px solid ${DARK.border}`, borderRadius: 10, padding: "20px 20px 10px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: DARK.muted, marginBottom: 12 }}>Ingresos por concepto</div>
                    {data.charts.conceptoDinero.values.some(v => v > 0)
                      ? <Chart options={donutOpts(data.charts.conceptoDinero.labels, ["#a855f7", "#f59e0b", "#06b6d4"]) as any} series={data.charts.conceptoDinero.values as any} type="donut" height={240} />
                      : <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: DARK.muted, fontSize: 12 }}>Sin ingresos en el período</div>}
                  </div>
                )}
                {data.charts.privados && (
                  <div style={{ background: DARK.surface, border: `1px solid ${DARK.border}`, borderRadius: 10, padding: "20px 20px 10px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: DARK.muted, marginBottom: 12 }}>Privados vs Municipales</div>
                    {data.charts.privados.values.some(v => v > 0)
                      ? <Chart options={donutOpts(data.charts.privados.labels, [DARK.accent, DARK.yellow]) as any} series={data.charts.privados.values as any} type="donut" height={240} />
                      : <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: DARK.muted, fontSize: 12 }}>Sin datos</div>}
                  </div>
                )}
              </div>
            )}

            <div style={{ background: DARK.surface, border: `1px solid ${DARK.border}`, borderRadius: 10, padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: DARK.muted }}>Alquileres cerrados en el período</div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#22c55e18", border: "1px solid #22c55e30", color: DARK.green }}>{data.tables.alquileresCerrados.length} registros</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead><tr style={{ color: DARK.muted }}>{["Cliente", "Dirección", "Colocación", "Retiro", "Días", "Reemplazos", "Total ARS", "Nota"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 8px 10px", fontWeight: 600, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {data.tables.alquileresCerrados.map((a) => (
                      <tr key={a.id} style={{ borderTop: `1px solid ${DARK.border}` }}>
                        <td style={{ padding: "8px", fontWeight: 600 }}>{a.cliente ?? "-"}</td>
                        <td style={{ padding: "8px", color: DARK.muted }}>{a.direccion ?? "-"}</td>
                        <td style={{ padding: "8px", whiteSpace: "nowrap", color: DARK.muted }}>{formatDate(a.fecha_colocacion)}</td>
                        <td style={{ padding: "8px", whiteSpace: "nowrap", color: DARK.muted }}>{formatDate(a.fecha_retiro)}</td>
                        <td style={{ padding: "8px" }}><span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: a.dias && a.dias > 7 ? DARK.yellow : DARK.text }}>{a.dias ?? "-"}d</span></td>
                        <td style={{ padding: "8px", textAlign: "center" }}><span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: a.reemplazos_total && a.reemplazos_total > 0 ? "#a855f7" : DARK.muted }}>{a.reemplazos_total ?? 0}</span></td>
                        <td style={{ padding: "8px", whiteSpace: "nowrap" }}><span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: DARK.green }}>{formatARS(a.dinero_total_ars ?? 0)}</span></td>
                        <td style={{ padding: "8px", color: DARK.muted }}>{a.nota ?? "-"}</td>
                      </tr>
                    ))}
                    {data.tables.alquileresCerrados.length === 0 && <tr><td colSpan={8} style={{ padding: "28px 8px", color: DARK.muted, textAlign: "center" }}>No hay alquileres cerrados en este período</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: DARK.surface, border: `1px solid ${DARK.border}`, borderRadius: 10, padding: "20px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: DARK.muted, marginBottom: 14 }}>Últimos movimientos</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead><tr style={{ color: DARK.muted }}>{["Fecha", "Volquete", "Tipo", "Ubicación nueva", "Nota"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 8px 10px", fontWeight: 600, fontSize: 11 }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {data.tables.ultimosMovimientos.map((m) => (
                        <tr key={m.id} style={{ borderTop: `1px solid ${DARK.border}` }}>
                          <td style={{ padding: "8px", whiteSpace: "nowrap", color: DARK.muted }}>{formatDate(m.fecha)}</td>
                          <td style={{ padding: "8px", fontWeight: 600 }}>{m.volquete}</td>
                          <td style={{ padding: "8px" }}><span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "#4f7cff18", border: "1px solid #4f7cff30", color: "#7aa0ff" }}>{m.tipo}</span></td>
                          <td style={{ padding: "8px", color: DARK.muted }}>{m.ubicacion_nueva ?? "-"}</td>
                          <td style={{ padding: "8px", color: DARK.muted }}>{m.nota ?? "-"}</td>
                        </tr>
                      ))}
                      {data.tables.ultimosMovimientos.length === 0 && <tr><td colSpan={5} style={{ padding: "20px 8px", color: DARK.muted, textAlign: "center" }}>Sin movimientos</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
              <div style={{ background: DARK.surface, border: `1px solid ${DARK.border}`, borderRadius: 10, padding: "20px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: DARK.muted, marginBottom: 14 }}>Alquileres activos</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead><tr style={{ color: DARK.muted }}>{["Cliente", "Dirección", "Colocación", "Días", "Nota"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 8px 10px", fontWeight: 600, fontSize: 11 }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {data.tables.alquileresActivos.map((a) => (
                        <tr key={a.id} style={{ borderTop: `1px solid ${DARK.border}` }}>
                          <td style={{ padding: "8px", fontWeight: 600 }}>{a.cliente}</td>
                          <td style={{ padding: "8px", color: DARK.muted }}>{a.direccion}</td>
                          <td style={{ padding: "8px", whiteSpace: "nowrap", color: DARK.muted }}>{formatDate(a.fecha_colocacion)}</td>
                          <td style={{ padding: "8px" }}><span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: a.dias_activo > 7 ? DARK.yellow : DARK.text }}>{a.dias_activo}d</span></td>
                          <td style={{ padding: "8px", color: DARK.muted }}>{a.nota ?? "-"}</td>
                        </tr>
                      ))}
                      {data.tables.alquileresActivos.length === 0 && <tr><td colSpan={5} style={{ padding: "20px 8px", color: DARK.muted, textAlign: "center" }}>Sin alquileres activos</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}