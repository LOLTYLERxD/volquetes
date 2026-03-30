"use client";

import { useMemo, useEffect, useState } from "react";
import { X, Truck, Package, Clock, RefreshCw } from "lucide-react";
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
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              innerRadius={56}
              outerRadius={82}
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
            <span className="sp-legend-dot" style={{ background: colors[i % colors.length] }} />
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
}: {
  label: string;
  value: string | number;
  icon?: any;
  accent?: boolean;
}) {
  return (
    <div className={`sp-stat-card ${accent ? "sp-stat-card--accent" : ""}`}>
      {Icon && <Icon size={14} className="sp-stat-icon" />}
      <div className="sp-stat-label">{label}</div>
      <div className="sp-stat-value">{value}</div>
    </div>
  );
}

export default function StatsPanel({
  volquetes = [],
  onClose,
}: {
  volquetes?: any[];
  onClose: () => void;
}) {
  const { isJefe } = useAuth();

  // Ingresos del día desde el endpoint
  const [ingresosHoy, setIngresosHoy] = useState<{ colocacion: number; reemplazo: number; traslado: number; total: number } | null>(null);
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
        setIngresosHoy({ colocacion, reemplazo, traslado, total: colocacion + reemplazo + traslado });
      })
      .catch(() => setIngresosHoy({ colocacion: 0, reemplazo: 0, traslado: 0, total: 0 }))
      .finally(() => setLoadingIngresos(false));
  }, [isJefe]);

  const privados = useMemo(() => volquetes.filter((v) => v.esPrivado !== false), [volquetes]);
  const colocados = useMemo(() => privados.filter((v) => v.colocado), [privados]);
  const libres = useMemo(() => privados.filter((v) => !v.colocado), [privados]);
  const vencidos = useMemo(
    () => privados.filter((v) => v.colocado && v.esPrivado !== false && estaVencido(v.fechaColocacion, 7)),
    [privados]
  );

  const promedioDias = useMemo(() => {
    if (!colocados.length) return 0;
    return Math.round(colocados.reduce((a, v) => a + calcularDias(v.fechaColocacion), 0) / colocados.length);
  }, [colocados]);

  const ocupacionPct = useMemo(
    () => (privados.length ? Math.round((colocados.length / privados.length) * 100) : 0),
    [privados.length, colocados.length]
  );

  const reemplazosTotales = useMemo(
    () => privados.reduce((a, v) => a + (v.reemplazosTotal ?? 0), 0),
    [privados]
  );

  const estadoData = useMemo(
    () => [
      { name: "En alquiler", value: colocados.length },
      { name: "Libres", value: libres.length },
      { name: "Vencidos", value: vencidos.length },
    ],
    [colocados.length, libres.length, vencidos.length]
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
        .sp-root { --sp-bg:#0d0f11; --sp-surface:#13171b; --sp-surface-2:#1a1f25; --sp-border:#252b33; --sp-border-hi:#2e3740; --sp-text:#e8ecf0; --sp-muted:#5a6472; --sp-accent:#f5c842; --sp-accent-dim:rgba(245,200,66,.12); --sp-font-mono:'DM Mono', monospace; --sp-font-ui:'DM Sans', system-ui, sans-serif; --sp-radius:6px; font-family:var(--sp-font-ui); background:var(--sp-bg); color:var(--sp-text); height:100%; display:flex; flex-direction:column; position:relative; overflow:hidden; }
        .sp-root::before { content:''; position:absolute; inset:0; background-image:linear-gradient(var(--sp-border) 1px, transparent 1px), linear-gradient(90deg, var(--sp-border) 1px, transparent 1px); background-size:32px 32px; opacity:.28; pointer-events:none; z-index:0; }
        .sp-root > * { position:relative; z-index:1; }
        .sp-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid var(--sp-border); background:linear-gradient(135deg, var(--sp-surface) 0%, var(--sp-surface-2) 100%); flex-shrink:0; }
        .sp-header-left { display:flex; align-items:center; gap:10px; }
        .sp-header-icon { width:32px; height:32px; border-radius:6px; background:var(--sp-accent-dim); border:1px solid rgba(245,200,66,.3); display:flex; align-items:center; justify-content:center; color:var(--sp-accent); }
        .sp-header-title { font-family:var(--sp-font-mono); font-size:13px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--sp-text); }
        .sp-header-sub { font-size:11px; color:var(--sp-muted); letter-spacing:.04em; margin-top:1px; }
        .sp-header-badge { background:var(--sp-accent-dim); border:1px solid rgba(245,200,66,.25); color:var(--sp-accent); font-family:var(--sp-font-mono); font-size:10px; font-weight:700; letter-spacing:.06em; padding:2px 8px; border-radius:3px; text-transform:uppercase; }
        .sp-close-btn { width:30px; height:30px; border-radius:5px; border:1px solid var(--sp-border); background:transparent; color:var(--sp-muted); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .15s; margin-left:12px; }
        .sp-close-btn:hover { background:var(--sp-surface-2); color:var(--sp-text); border-color:var(--sp-border-hi); }
        .sp-content { flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:16px; }
        .sp-section-label { font-family:var(--sp-font-mono); font-size:10px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--sp-muted); display:flex; align-items:center; gap:8px; margin-bottom:2px; }
        .sp-section-label::after { content:''; flex:1; height:1px; background:var(--sp-border); }
        .sp-donut-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        @media (max-width:640px){ .sp-donut-grid { grid-template-columns:1fr; } }
        .sp-donut-card { background:var(--sp-surface); border:1px solid var(--sp-border); border-radius:var(--sp-radius); padding:16px; position:relative; overflow:hidden; }
        .sp-donut-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg, var(--sp-accent) 0%, transparent 100%); opacity:.5; }
        .sp-donut-title { font-family:var(--sp-font-mono); font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--sp-muted); margin-bottom:8px; }
        .sp-donut-wrap { position:relative; height:180px; overflow:hidden; border-radius:8px; }
        .sp-donut-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; pointer-events:none; gap:2px; }
        .sp-donut-center-label { font-family:var(--sp-font-mono); font-size:9px; font-weight:700; letter-spacing:.1em; color:var(--sp-muted); text-transform:uppercase; }
        .sp-donut-center-value { font-family:var(--sp-font-mono); font-size:18px; font-weight:800; color:var(--sp-text); line-height:1; }
        .sp-legend { margin-top:10px; display:flex; flex-direction:column; gap:5px; border-top:1px solid var(--sp-border); padding-top:10px; }
        .sp-legend-row { display:flex; align-items:center; gap:7px; font-size:11px; }
        .sp-legend-dot { width:8px; height:8px; border-radius:2px; flex-shrink:0; }
        .sp-legend-name { color:var(--sp-muted); flex:1; font-size:11px; }
        .sp-legend-value { font-family:var(--sp-font-mono); font-size:12px; font-weight:700; color:var(--sp-text); }
        .sp-tooltip { background:var(--sp-surface-2); border:1px solid var(--sp-border-hi); border-radius:4px; padding:6px 10px; display:flex; gap:10px; align-items:center; font-family:var(--sp-font-mono); font-size:11px; }
        .sp-tooltip-label { color:var(--sp-muted); }
        .sp-tooltip-value { color:var(--sp-accent); font-weight:700; }
        .sp-stat-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .sp-stat-card { background:var(--sp-surface); border:1px solid var(--sp-border); border-radius:var(--sp-radius); padding:14px 16px; }
        .sp-stat-card--accent { border-color:rgba(245,200,66,.3); background:linear-gradient(135deg, var(--sp-surface) 60%, var(--sp-accent-dim) 100%); }
        .sp-stat-icon { color:var(--sp-muted); margin-bottom:8px; }
        .sp-stat-label { font-family:var(--sp-font-mono); font-size:9px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--sp-muted); margin-bottom:6px; }
        .sp-stat-value { font-family:var(--sp-font-mono); font-size:28px; font-weight:800; color:var(--sp-text); line-height:1; }
        .sp-occ-bar-wrap { background:var(--sp-surface); border:1px solid var(--sp-border); border-radius:var(--sp-radius); padding:14px 16px; }
        .sp-occ-bar-header { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:10px; }
        .sp-occ-bar-label { font-family:var(--sp-font-mono); font-size:9px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--sp-muted); }
        .sp-occ-bar-pct { font-family:var(--sp-font-mono); font-size:20px; font-weight:800; color:var(--sp-accent); }
        .sp-occ-track { height:6px; background:var(--sp-surface-2); border-radius:3px; overflow:hidden; }
        .sp-occ-fill { height:100%; border-radius:3px; background:linear-gradient(90deg, var(--sp-accent) 0%, #fde68a 100%); }
        .sp-loading { display:flex; align-items:center; justify-content:center; height:180px; color:var(--sp-muted); font-family:var(--sp-font-mono); font-size:11px; letter-spacing:.06em; }
      `}</style>

      <div className="sp-root">
        <div className="sp-header">
          <div className="sp-header-left">
            <div className="sp-header-icon"><Truck size={15} /></div>
            <div>
              <div className="sp-header-title">Estadísticas</div>
              <div className="sp-header-sub">{volquetes.length} volquetes cargados</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="sp-header-badge">Live</span>
            <button className="sp-close-btn" onClick={onClose}><X size={14} /></button>
          </div>
        </div>

        <div className="sp-content">
          <div className="sp-section-label">Distribución</div>

          <div className="sp-donut-grid">
            <Donut
              title="Estado · Privados"
              data={estadoData}
              colors={["#22c55e", "#3b82f6", "#ef4444"]}
              centerText={`${ocupacionPct}%`}
            />

            {isJefe && (
              loadingIngresos ? (
                <div className="sp-donut-card">
                  <div className="sp-donut-title">Ingresos del día · ARS</div>
                  <div className="sp-loading">Cargando...</div>
                </div>
              ) : (
                <Donut
                  title="Ingresos del día · ARS"
                  data={dineroData.length ? dineroData : [{ name: "Sin ingresos", value: 1 }]}
                  colors={dineroData.length ? ["#a855f7", "#f59e0b", "#06b6d4"] : ["#2e3740"]}
                  centerText={dineroFmt}
                />
              )
            )}
          </div>

          <div className="sp-occ-bar-wrap">
            <div className="sp-occ-bar-header">
              <span className="sp-occ-bar-label">Ocupación de flota privada</span>
              <span className="sp-occ-bar-pct">{ocupacionPct}%</span>
            </div>
            <div className="sp-occ-track">
              <div className="sp-occ-fill" style={{ width: `${ocupacionPct}%` }} />
            </div>
          </div>

          <div className="sp-section-label">Métricas clave</div>
          <div className="sp-stat-grid">
            <StatCard label="Total volquetes" value={volquetes.length} icon={Package} />
            <StatCard label="Privados" value={privados.length} icon={Truck} />
            <StatCard label="Prom. días colocado" value={promedioDias} icon={Clock} accent />
            <StatCard label="Reemplazos totales" value={reemplazosTotales} icon={RefreshCw} />
          </div>
        </div>
      </div>
    </>
  );
}