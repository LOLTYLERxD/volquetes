"use client";

import { useMemo, useEffect, useState } from "react";
import { X, Truck, Package, Clock, RefreshCw, Warehouse } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/hooks/use-auth";

const calcularDias = (fecha: string | null | undefined) => {
  if (!fecha) return 0;
  return Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000);
};

const estaVencido = (fecha: string | null | undefined, dias: number) => {
  if (!fecha) return false;
  return calcularDias(fecha) >= dias;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="sp-tooltip">
      <span className="sp-tooltip-label">{payload[0].name}</span>
      <span className="sp-tooltip-value">{payload[0].value}</span>
    </div>
  );
};

function Donut({
  title,
  data,
  colors,
  centerText,
}: {
  title: string;
  data: { name: string; value: number }[];
  colors: string[];
  centerText?: string;
}) {
  return (
    <div className="sp-donut-card">
      <div className="sp-donut-title">{title}</div>
      <div className="sp-donut-wrap">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              innerRadius={68}
              outerRadius={98}
              paddingAngle={3}
              dataKey="value"
              isAnimationActive={false}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="sp-donut-center">
          <span className="sp-donut-center-label">TOTAL</span>
          <span className="sp-donut-center-value">{centerText}</span>
        </div>
      </div>
      <div className="sp-legend">
        {data.map((d, i) => (
          <div key={i} className="sp-legend-row">
            <span
              className="sp-legend-dot"
              style={{ background: colors[i % colors.length] }}
            />
            <span className="sp-legend-name">{d.name}</span>
            <span className="sp-legend-value">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  accentColor,
}: {
  label: string;
  value: string | number;
  icon?: any;
  accent?: boolean;
  accentColor?: string;
}) {
  return (
    <div
      className={`sp-stat-card ${accent ? "sp-stat-card--accent" : ""}`}
      style={
        accentColor
          ? {
              borderColor: `${accentColor}40`,
              background: `linear-gradient(135deg, rgba(20,24,29,.96) 55%, ${accentColor}10 100%)`,
            }
          : undefined
      }
    >
      {Icon && (
        <Icon
          size={14}
          className="sp-stat-icon"
          style={accentColor ? { color: accentColor } : undefined}
        />
      )}
      <div className="sp-stat-label">{label}</div>
      <div
        className="sp-stat-value"
        style={accentColor ? { color: accentColor } : undefined}
      >
        {value}
      </div>
    </div>
  );
}

export default function StatsPanel({
  volquetes = [],
  galponStock = 0,
  onClose,
}: {
  volquetes?: any[];
  galponStock?: number;
  onClose: () => void;
}) {
  const { isJefe } = useAuth();

  const [ingresosHoy, setIngresosHoy] = useState<{
    colocacion: number;
    reemplazo: number;
    traslado: number;
    total: number;
  } | null>(null);
  const [loadingIngresos, setLoadingIngresos] = useState(false);

  useEffect(() => {
    if (!isJefe) return;

    setLoadingIngresos(true);

    fetch("/api/dashboard/stats?days=1")
      .then((r) => r.json())
      .then((data) => {
        const labels: string[] = data?.charts?.conceptoDinero?.labels ?? [];
        const values: number[] = data?.charts?.conceptoDinero?.values ?? [];

        const get = (key: string) => {
          const i = labels.findIndex((l) => l.toLowerCase().includes(key));
          return i >= 0 ? (values[i] ?? 0) : 0;
        };

        const colocacion = get("coloc");
        const reemplazo = get("reempl");
        const traslado = get("traslad");

        setIngresosHoy({
          colocacion,
          reemplazo,
          traslado,
          total: colocacion + reemplazo + traslado,
        });
      })
      .catch(() =>
        setIngresosHoy({ colocacion: 0, reemplazo: 0, traslado: 0, total: 0 })
      )
      .finally(() => setLoadingIngresos(false));
  }, [isJefe]);

  // Regla unificada:
  // - volquetes = solo los que están operativos/en calle (mapa)
  // - galponStock = stock separado en galpón
  const totalGeneral = useMemo(
    () => volquetes.length + galponStock,
    [volquetes.length, galponStock]
  );

  // ── Privados en calle ─────────────────────────────────────────────────────
  const privados = useMemo(
    () => volquetes.filter((v) => v.esPrivado !== false),
    [volquetes]
  );

  const colocados = useMemo(
    () => privados.filter((v) => v.colocado),
    [privados]
  );

  const libresEnCalle = useMemo(
    () => privados.filter((v) => !v.colocado),
    [privados]
  );

  const vencidos = useMemo(
    () =>
      privados.filter(
        (v) =>
          v.colocado &&
          v.esPrivado !== false &&
          estaVencido(v.fechaColocacion, 7)
      ),
    [privados]
  );

  const promedioDias = useMemo(() => {
    if (!colocados.length) return 0;
    return Math.round(
      colocados.reduce((a, v) => a + calcularDias(v.fechaColocacion), 0) /
        colocados.length
    );
  }, [colocados]);

  const ocupacionPct = useMemo(
    () =>
      privados.length
        ? Math.round((colocados.length / privados.length) * 100)
        : 0,
    [privados.length, colocados.length]
  );

  const reemplazosTotales = useMemo(
    () => privados.reduce((a, v) => a + (v.reemplazosTotal ?? 0), 0),
    [privados]
  );

  // ── Municipales en calle ──────────────────────────────────────────────────
  const municipales = useMemo(
    () => volquetes.filter((v) => v.esPrivado === false),
    [volquetes]
  );

  const reemplazosMunicipales = useMemo(
    () => municipales.reduce((a, v) => a + Number(v.trasladosTotal ?? 0), 0),
    [municipales]
  );

  // ── Charts ────────────────────────────────────────────────────────────────
  const estadoData = useMemo(
    () => [
      { name: "En alquiler", value: colocados.length },
      { name: "Libres en calle", value: libresEnCalle.length },
      { name: "Vencidos", value: vencidos.length },
    ],
    [colocados.length, libresEnCalle.length, vencidos.length]
  );

  const dineroData = useMemo(() => {
    if (!ingresosHoy) return [];
    return [
      { name: "Colocación", value: ingresosHoy.colocacion },
      { name: "Reemplazo", value: ingresosHoy.reemplazo },
      { name: "Traslado", value: ingresosHoy.traslado },
    ].filter((x) => x.value > 0);
  }, [ingresosHoy]);

  const dineroFmt = useMemo(
    () =>
      new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }).format(ingresosHoy?.total ?? 0),
    [ingresosHoy?.total]
  );

  return (
    <>
      <style>{`
        .sp-root {
          --sp-bg: #0b0d10;
          --sp-surface: rgba(19, 23, 27, 0.88);
          --sp-surface-2: rgba(24, 29, 35, 0.92);
          --sp-border: rgba(255, 255, 255, 0.08);
          --sp-border-hi: rgba(255, 255, 255, 0.14);
          --sp-text: #edf2f7;
          --sp-muted: #7d8794;
          --sp-accent: #f5c842;
          --sp-accent-dim: rgba(245, 200, 66, 0.12);
          --sp-shadow: 0 18px 40px rgba(0, 0, 0, 0.34);
          --sp-font-mono: 'DM Mono', monospace;
          --sp-font-ui: 'DM Sans', system-ui, sans-serif;
          --sp-radius: 18px;
          font-family: var(--sp-font-ui);
          background:
            radial-gradient(circle at top left, rgba(245, 200, 66, 0.08), transparent 32%),
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 28%),
            linear-gradient(180deg, #0a0c0f 0%, #0d1014 100%);
          color: var(--sp-text);
          height: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        .sp-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
          background-size: 36px 36px;
          opacity: .18;
          pointer-events: none;
          z-index: 0;
        }

        .sp-root > * {
          position: relative;
          z-index: 1;
        }

        .sp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 22px;
          border-bottom: 1px solid var(--sp-border);
          background: linear-gradient(135deg, rgba(20,24,29,.96) 0%, rgba(15,18,23,.86) 100%);
          backdrop-filter: blur(12px);
          flex-shrink: 0;
        }

        .sp-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sp-header-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(245,200,66,.18), rgba(245,200,66,.06));
          border: 1px solid rgba(245,200,66,.24);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--sp-accent);
        }

        .sp-header-title {
          font-family: var(--sp-font-mono);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--sp-text);
        }

        .sp-header-sub {
          font-size: 11px;
          color: var(--sp-muted);
          letter-spacing: .04em;
          margin-top: 2px;
        }

        .sp-header-badge {
          background: var(--sp-accent-dim);
          border: 1px solid rgba(245,200,66,.22);
          color: var(--sp-accent);
          font-family: var(--sp-font-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .08em;
          padding: 4px 9px;
          border-radius: 999px;
          text-transform: uppercase;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
        }

        .sp-close-btn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid var(--sp-border);
          background: rgba(255,255,255,.02);
          color: var(--sp-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all .18s ease;
          margin-left: 12px;
        }

        .sp-close-btn:hover {
          background: rgba(255,255,255,.05);
          color: var(--sp-text);
          border-color: var(--sp-border-hi);
          transform: translateY(-1px);
        }

        .sp-content {
          flex: 1;
          overflow-y: auto;
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .sp-section-label {
          font-family: var(--sp-font-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: var(--sp-muted);
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 2px;
        }

        .sp-section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, var(--sp-border-hi), transparent);
        }

        .sp-donut-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px;
          max-width: 520px;
          width: 100%;
          margin: 0 auto;
        }

        .sp-donut-card {
          background: linear-gradient(180deg, rgba(20,24,29,.96), rgba(14,17,22,.92));
          border: 1px solid var(--sp-border);
          border-radius: 22px;
          padding: 18px;
          position: relative;
          overflow: hidden;
          box-shadow: var(--sp-shadow);
          backdrop-filter: blur(10px);
        }

        .sp-donut-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--sp-accent) 0%, rgba(245,200,66,0) 100%);
          opacity: .7;
        }

        .sp-donut-title {
          font-family: var(--sp-font-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--sp-muted);
          margin-bottom: 10px;
        }

        .sp-donut-wrap {
          position: relative;
          height: 220px;
          overflow: hidden;
          border-radius: 16px;
          background: radial-gradient(circle at center, rgba(255,255,255,.02), transparent 70%);
        }

        .sp-donut-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          gap: 4px;
        }

        .sp-donut-center-label {
          font-family: var(--sp-font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .14em;
          color: var(--sp-muted);
          text-transform: uppercase;
        }

        .sp-donut-center-value {
          font-family: var(--sp-font-mono);
          font-size: 20px;
          font-weight: 800;
          color: var(--sp-text);
          line-height: 1;
          text-align: center;
          max-width: 75%;
          word-break: break-word;
        }

        .sp-legend {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          border-top: 1px solid var(--sp-border);
          padding-top: 12px;
        }

        .sp-legend-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
        }

        .sp-legend-dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          flex-shrink: 0;
          box-shadow: 0 0 10px rgba(255,255,255,.08);
        }

        .sp-legend-name {
          color: var(--sp-muted);
          flex: 1;
          font-size: 11px;
        }

        .sp-legend-value {
          font-family: var(--sp-font-mono);
          font-size: 12px;
          font-weight: 700;
          color: var(--sp-text);
        }

        .sp-tooltip {
          background: rgba(24,29,35,.98);
          border: 1px solid var(--sp-border-hi);
          border-radius: 10px;
          padding: 8px 10px;
          display: flex;
          gap: 10px;
          align-items: center;
          font-family: var(--sp-font-mono);
          font-size: 11px;
          box-shadow: 0 10px 25px rgba(0,0,0,.25);
        }

        .sp-tooltip-label { color: var(--sp-muted); }
        .sp-tooltip-value { color: var(--sp-accent); font-weight: 700; }

        .sp-stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        @media (max-width: 640px) {
          .sp-stat-grid { grid-template-columns: 1fr; }
        }

        .sp-stat-card {
          background: linear-gradient(180deg, rgba(20,24,29,.96), rgba(14,17,22,.92));
          border: 1px solid var(--sp-border);
          border-radius: 18px;
          padding: 16px 16px 15px;
          box-shadow: var(--sp-shadow);
          min-height: 112px;
        }

        .sp-stat-card--accent {
          border-color: rgba(245,200,66,.25);
          background: linear-gradient(135deg, rgba(20,24,29,.96) 55%, rgba(245,200,66,.08) 100%);
        }

        .sp-stat-icon {
          color: var(--sp-muted);
          margin-bottom: 10px;
        }

        .sp-stat-label {
          font-family: var(--sp-font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--sp-muted);
          margin-bottom: 8px;
        }

        .sp-stat-value {
          font-family: var(--sp-font-mono);
          font-size: 30px;
          font-weight: 800;
          color: var(--sp-text);
          line-height: 1;
        }

        .sp-occ-bar-wrap {
          background: linear-gradient(180deg, rgba(20,24,29,.96), rgba(14,17,22,.92));
          border: 1px solid var(--sp-border);
          border-radius: 18px;
          padding: 16px 16px 18px;
          box-shadow: var(--sp-shadow);
        }

        .sp-occ-bar-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 12px;
          gap: 10px;
        }

        .sp-occ-bar-label {
          font-family: var(--sp-font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--sp-muted);
        }

        .sp-occ-bar-pct {
          font-family: var(--sp-font-mono);
          font-size: 22px;
          font-weight: 800;
          color: var(--sp-accent);
        }

        .sp-occ-track {
          height: 10px;
          background: rgba(255,255,255,.05);
          border-radius: 999px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.04);
        }

        .sp-occ-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, var(--sp-accent) 0%, #fde68a 100%);
          box-shadow: 0 0 14px rgba(245,200,66,.25);
        }

        .sp-galpon-card {
          background: linear-gradient(135deg, rgba(20,24,29,.96) 55%, rgba(167,139,250,.08) 100%);
          border: 1px solid rgba(167,139,250,.25);
          border-radius: 18px;
          padding: 16px 16px 15px;
          box-shadow: var(--sp-shadow);
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .sp-galpon-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(167,139,250,.12);
          border: 1px solid rgba(167,139,250,.22);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a78bfa;
          flex-shrink: 0;
        }

        .sp-galpon-label {
          font-family: var(--sp-font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--sp-muted);
          margin-bottom: 6px;
        }

        .sp-galpon-value {
          font-family: var(--sp-font-mono);
          font-size: 30px;
          font-weight: 800;
          color: #a78bfa;
          line-height: 1;
        }

        .sp-galpon-sub {
          font-size: 11px;
          color: var(--sp-muted);
          margin-top: 4px;
        }

        .sp-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 220px;
          color: var(--sp-muted);
          font-family: var(--sp-font-mono);
          font-size: 11px;
          letter-spacing: .08em;
        }
      `}</style>

      <div className="sp-root">
        <div className="sp-header">
          <div className="sp-header-left">
            <div className="sp-header-icon">
              <Truck size={16} />
            </div>
            <div>
              <div className="sp-header-title">Estadísticas</div>
              <div className="sp-header-sub">
                {totalGeneral} volquetes totales · {volquetes.length} en calle · {galponStock} en galpón
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="sp-header-badge">Live</span>
            <button className="sp-close-btn" onClick={onClose}>
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="sp-content">
          <div className="sp-section-label">Distribución</div>

          <div className="sp-donut-grid">
            <Donut
              title="Estado · Privados en calle"
              data={estadoData}
              colors={["#22c55e", "#3b82f6", "#ef4444"]}
              centerText={`${ocupacionPct}%`}
            />

            {isJefe &&
              (loadingIngresos ? (
                <div className="sp-donut-card">
                  <div className="sp-donut-title">Ingresos del día · ARS</div>
                  <div className="sp-loading">Cargando...</div>
                </div>
              ) : (
                <Donut
                  title="Ingresos del día · ARS"
                  data={
                    dineroData.length
                      ? dineroData
                      : [{ name: "Sin ingresos", value: 1 }]
                  }
                  colors={
                    dineroData.length
                      ? ["#a855f7", "#f59e0b", "#06b6d4"]
                      : ["#2e3740"]
                  }
                  centerText={dineroFmt}
                />
              ))}
          </div>

          <div className="sp-occ-bar-wrap">
            <div className="sp-occ-bar-header">
              <span className="sp-occ-bar-label">Ocupación de flota privada en calle</span>
              <span className="sp-occ-bar-pct">{ocupacionPct}%</span>
            </div>
            <div className="sp-occ-track">
              <div className="sp-occ-fill" style={{ width: `${ocupacionPct}%` }} />
            </div>
          </div>

          <div className="sp-galpon-card">
            <div className="sp-galpon-icon">
              <Warehouse size={20} />
            </div>
            <div>
              <div className="sp-galpon-label">Stock en galpón</div>
              <div className="sp-galpon-value">{galponStock}</div>
              <div className="sp-galpon-sub">
                {galponStock === 1 ? "volquete disponible" : "volquetes disponibles"}
              </div>
            </div>
          </div>

          <div className="sp-section-label">Métricas clave</div>

          <div className="sp-stat-grid">
            <StatCard label="Total volquetes" value={totalGeneral} icon={Package} />
            <StatCard label="Privados en calle" value={privados.length} icon={Truck} />
            <StatCard label="Prom. días colocado" value={promedioDias} icon={Clock} accent />
            <StatCard label="Reemplazos totales" value={reemplazosTotales} icon={RefreshCw} />
          </div>

          <div className="sp-section-label">Municipales</div>

          <div className="sp-stat-grid">
            <StatCard label="Total municipales" value={municipales.length} icon={Truck} />
            <StatCard
              label="Reemplazos municipales"
              value={reemplazosMunicipales}
              icon={RefreshCw}
              accent
            />
          </div>
        </div>
      </div>
    </>
  );
}