import React, { useEffect, useMemo, useState } from "react";
import { Head } from "@inertiajs/react";
import Chart from "react-apexcharts";

type Card = { label: string; value: number };
type SimpleChart = { labels: string[]; values: number[] };
type MovimientoRow = { id: string; fecha: string; tipo: string; volquete: string; ubicacion_nueva?: string | null; nota?: string | null; };
type MunicipalColocadoRow = { id: string; nombre: string; direccion: string; cliente?: string | null; fecha_colocacion: string | null; dias_colocado: number | null; };
type StatsResponse = {
  cards: Card[];
  charts: { actividad: SimpleChart; estadoVolquetes: SimpleChart; tiposMovimiento: SimpleChart; topMovimientos: SimpleChart; mastiempoColocados: SimpleChart; };
  tables: { ultimosMovimientos: MovimientoRow[]; municipalesColocados: MunicipalColocadoRow[]; };
};

const DARK = { bg: "#0d0f11", surface: "#13171b", surface2: "#1a1f25", border: "#252b33", text: "#e8ecf0", muted: "#5a6472", accent: "#4f7cff", yellow: "#f5c842", green: "#22c55e", red: "#ef4444" };

function formatDate(d: string | null | undefined) { if (!d) return "-"; const date = new Date(d); if (Number.isNaN(date.getTime())) return d; return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(date); }

export default function Municipales() {
  const [days, setDays] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/dashboard/municipales/stats?days=${days}`, { headers: { Accept: "application/json" }, credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e: any) { setError(e?.message ?? "Error"); } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [days]);

  const actividadOptions = useMemo(() => ({
    chart: { type: "area" as const, toolbar: { show: false }, zoom: { enabled: false }, background: "transparent" },
    stroke: { curve: "smooth" as const, width: 2 },
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.0 } },
    grid: { borderColor: DARK.border, strokeDashArray: 4 },
    xaxis: { categories: data?.charts.actividad.labels ?? [], labels: { rotate: -45, hideOverlappingLabels: true, style: { colors: DARK.muted, fontSize: "10px" } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: DARK.muted, fontSize: "11px" } } },
    colors: [DARK.accent], tooltip: { theme: "dark" }, theme: { mode: "dark" as const },
  }), [data]);

  const actividadSeries = useMemo(() => [{ name: "Movimientos", data: data?.charts.actividad.values ?? [] }], [data]);

  const donutOpts = (labels: string[], colors?: string[]) => ({
    chart: { type: "donut" as const, background: "transparent" }, labels,
    legend: { position: "bottom" as const, labels: { colors: DARK.muted } },
    dataLabels: { enabled: false }, stroke: { width: 0 },
    colors: colors ?? [DARK.accent, DARK.yellow, DARK.green, DARK.red, "#a855f7", "#06b6d4"],
    tooltip: { theme: "dark" }, theme: { mode: "dark" as const }, plotOptions: { pie: { donut: { size: "65%" } } },
  });

  const barOpts = (labels: string[], horizontal = true) => ({
    chart: { type: "bar" as const, toolbar: { show: false }, background: "transparent" },
    plotOptions: { bar: { horizontal, borderRadius: 4, dataLabels: { position: "top" } } },
    dataLabels: { enabled: true, style: { colors: [DARK.text], fontSize: "11px" } },
    grid: { borderColor: DARK.border, strokeDashArray: 4 },
    xaxis: { categories: labels, labels: { style: { colors: DARK.muted, fontSize: "11px" } }, axisBorder: { show: false } },
    yaxis: { labels: { style: { colors: DARK.muted, fontSize: "11px" } } },
    colors: [DARK.accent], tooltip: { theme: "dark" }, theme: { mode: "dark" as const },
  });

  return (
    <div style={{ minHeight: "100vh", background: DARK.bg, color: DARK.text, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500&display=swap'); a.nav-btn { transition: all 0.15s; } a.nav-btn:hover { opacity: 0.8; }`}</style>
      <Head title="Municipales" />

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${DARK.border}`, background: DARK.surface, padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <a href="/dashboard" className="nav-btn" style={{ display: "flex", alignItems: "center", gap: 6, color: DARK.muted, fontSize: 12, textDecoration: "none", background: DARK.surface2, border: `1px solid ${DARK.border}`, padding: "6px 12px", borderRadius: 7, fontWeight: 500 }}>
              ← App
            </a>
            <span style={{ color: DARK.border, fontSize: 16 }}>|</span>
            <a href="/stats" className="nav-btn" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, textDecoration: "none", padding: "6px 12px", borderRadius: 7, fontWeight: 600, background: DARK.surface2, border: `1px solid ${DARK.border}`, color: DARK.muted }}>
              ← Privados
            </a>
            <a href="/stats/municipales" className="nav-btn" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, textDecoration: "none", padding: "6px 12px", borderRadius: 7, fontWeight: 700, background: "#f5c84218", border: "1px solid #f5c84240", color: DARK.yellow }}>
              Municipales
            </a>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Estadísticas Operativas</h1>
          <p style={{ fontSize: 12, color: DARK.muted, margin: "2px 0 0" }}>Actividad y rendimiento de volquetes municipales</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ background: DARK.surface2, border: `1px solid ${DARK.border}`, color: DARK.text, borderRadius: 8, padding: "8px 12px", fontSize: 13, cursor: "pointer", outline: "none" }}>
            <option value={7}>7 días</option><option value={30}>30 días</option><option value={90}>90 días</option>
          </select>
          <button onClick={() => void load()} style={{ background: DARK.yellow, border: "none", color: "#0d0f11", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Actualizar</button>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
        {error && <div style={{ background: "#ff4f4f15", border: "1px solid #ff4f4f40", borderRadius: 10, padding: "14px 18px", color: "#ff6b6b", fontSize: 13 }}>Error: {error}</div>}
        {loading && <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>{Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ height: 80, borderRadius: 10, background: DARK.surface, border: `1px solid ${DARK.border}`, opacity: 0.5 }} />)}</div>}

        {!loading && data && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
              {data.cards.map((c, i) => (
                <div key={i} style={{ background: DARK.surface, border: `1px solid ${DARK.border}`, borderRadius: 10, padding: "16px 18px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: DARK.muted, marginBottom: 8 }}>{c.label}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{c.value.toLocaleString("es-AR")}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
              <div style={{ background: DARK.surface, border: `1px solid ${DARK.border}`, borderRadius: 10, padding: "20px 20px 10px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: DARK.muted, marginBottom: 12 }}>Actividad operativa · movimientos por día</div>
                <Chart options={actividadOptions as any} series={actividadSeries as any} type="area" height={240} />
              </div>
              <div style={{ background: DARK.surface, border: `1px solid ${DARK.border}`, borderRadius: 10, padding: "20px 20px 10px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: DARK.muted, marginBottom: 12 }}>Estado de flota</div>
                {data.charts.estadoVolquetes.values.some(v => v > 0)
                  ? <Chart options={donutOpts(data.charts.estadoVolquetes.labels) as any} series={data.charts.estadoVolquetes.values as any} type="donut" height={240} />
                  : <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: DARK.muted, fontSize: 12 }}>Sin datos</div>}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
              <div style={{ background: DARK.surface, border: `1px solid ${DARK.border}`, borderRadius: 10, padding: "20px 20px 10px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: DARK.muted, marginBottom: 12 }}>Tipos de movimiento</div>
                {data.charts.tiposMovimiento.values.some(v => v > 0)
                  ? <Chart options={donutOpts(data.charts.tiposMovimiento.labels, [DARK.accent, DARK.yellow, DARK.green, DARK.red]) as any} series={data.charts.tiposMovimiento.values as any} type="donut" height={240} />
                  : <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: DARK.muted, fontSize: 12 }}>Sin movimientos</div>}
              </div>
              <div style={{ background: DARK.surface, border: `1px solid ${DARK.border}`, borderRadius: 10, padding: "20px 20px 10px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: DARK.muted, marginBottom: 12 }}>Top volquetes · más movimientos en el período</div>
                {data.charts.topMovimientos.labels.length > 0
                  ? <Chart options={barOpts(data.charts.topMovimientos.labels) as any} series={[{ name: "Movimientos", data: data.charts.topMovimientos.values }] as any} type="bar" height={240} />
                  : <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: DARK.muted, fontSize: 12 }}>Sin datos</div>}
              </div>
            </div>

            <div style={{ background: DARK.surface, border: `1px solid ${DARK.border}`, borderRadius: 10, padding: "20px 20px 10px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: DARK.muted, marginBottom: 12 }}>Volquetes con más días colocados actualmente</div>
              {data.charts.mastiempoColocados.labels.length > 0
                ? <Chart options={barOpts(data.charts.mastiempoColocados.labels, false) as any} series={[{ name: "Días colocado", data: data.charts.mastiempoColocados.values }] as any} type="bar" height={200} />
                : <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: DARK.muted, fontSize: 12 }}>Ningún municipal colocado</div>}
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
                          <td style={{ padding: "8px" }}><span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "#f5c84218", border: "1px solid #f5c84230", color: DARK.yellow }}>{m.tipo}</span></td>
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
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: DARK.muted, marginBottom: 14 }}>Municipales colocados actualmente</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead><tr style={{ color: DARK.muted }}>{["Volquete", "Dirección", "Cliente", "Días"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 8px 10px", fontWeight: 600, fontSize: 11 }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {data.tables.municipalesColocados.map((v) => (
                        <tr key={v.id} style={{ borderTop: `1px solid ${DARK.border}` }}>
                          <td style={{ padding: "8px", fontWeight: 600 }}>{v.nombre}</td>
                          <td style={{ padding: "8px", color: DARK.muted }}>{v.direccion}</td>
                          <td style={{ padding: "8px", color: DARK.muted }}>{v.cliente ?? "-"}</td>
                          <td style={{ padding: "8px" }}><span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: v.dias_colocado && v.dias_colocado > 7 ? DARK.yellow : DARK.text }}>{v.dias_colocado ?? "-"}d</span></td>
                        </tr>
                      ))}
                      {data.tables.municipalesColocados.length === 0 && <tr><td colSpan={4} style={{ padding: "20px 8px", color: DARK.muted, textAlign: "center" }}>Ningún municipal colocado</td></tr>}
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