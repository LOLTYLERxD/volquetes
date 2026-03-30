"use client";

import { useMemo, useState, useEffect } from "react";
import ConfirmModal from "@/components/confirm-modal";
import { X, Trash2, Calendar, AlertTriangle, MapPin, User, FileText, TruckIcon, RotateCcw } from "lucide-react";
import type { Volquete } from "@/lib/volquetes";
import { calcularDias, estaVencido } from "@/lib/volquetes";
import { fetchVolqueteStats, fetchAlquileres, actualizarNota } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/components/ui/use-toast";

interface VolqueteSidebarProps {
  volquete: Volquete;
  onClose: () => void;
  onDelete: () => void;
  onColocar: (data: { direccion: string; lat: number; lng: number; cliente?: string; nota?: string }) => void;
  onRetirar: (data: { nota?: string }) => void;
  onReemplazar?: (data: { nota?: string }) => void;
}

export default function VolqueteSidebar({ volquete, onClose, onDelete, onColocar, onRetirar, onReemplazar }: VolqueteSidebarProps) {
  const { isJefe } = useAuth();

  const [direccion, setDireccion] = useState(volquete.direccion || "");
  const [cliente, setCliente] = useState(volquete.cliente || "");
  const [lat, setLat] = useState(String(volquete.lat));
  const [lng, setLng] = useState(String(volquete.lng));
  const [nota, setNota] = useState(volquete.alquilerActual?.nota ?? "");
  const [stats, setStats] = useState<any | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [alquileres, setAlquileres] = useState<any[]>([]);
  const [loadingAlquileres, setLoadingAlquileres] = useState(false);
  const [guardandoNota, setGuardandoNota] = useState(false);

  async function handleGuardarNota() {
    if (!nota.trim() && !volquete.colocado) return;
    setGuardandoNota(true);
    try {
      await actualizarNota(volquete.id, nota.trim() || "");
      toast({ title: "✅ Nota guardada", description: "La nota fue actualizada correctamente" });
    } catch {
      toast({ title: "Error", description: "No se pudo guardar la nota", variant: "destructive" });
    } finally {
      setGuardandoNota(false);
    }
  }

  type ConfirmAction = "colocar" | "retirar" | "reemplazar" | "eliminar" | null;
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  useEffect(() => {
    setDireccion(volquete.direccion || "");
    setCliente(volquete.cliente || "");
    setLat(String(volquete.lat));
    setLng(String(volquete.lng));
    setNota(volquete.alquilerActual?.nota ?? "");
  }, [volquete.id]);

  useEffect(() => {
    if (!isJefe) return;
    let alive = true;
    setLoadingStats(true);
    fetchVolqueteStats(volquete.id)
      .then((data) => { if (!alive) return; setStats(data ?? null); })
      .catch(() => { if (!alive) return; setStats(null); })
      .finally(() => { if (!alive) return; setLoadingStats(false); });
    return () => { alive = false; };
  }, [volquete.id, isJefe]);

  useEffect(() => {
    if (!isJefe) return;
    let alive = true;
    if (volquete.esPrivado === false) { setAlquileres([]); return; }
    setLoadingAlquileres(true);
    fetchAlquileres(volquete.id)
      .then((data) => { if (!alive) return; setAlquileres(Array.isArray(data) ? data : []); })
      .catch(() => { if (!alive) return; setAlquileres([]); })
      .finally(() => { if (!alive) return; setLoadingAlquileres(false); });
    return () => { alive = false; };
  }, [volquete.id, volquete.esPrivado, isJefe]);

  const dias = useMemo(() => calcularDias(volquete.fechaColocacion), [volquete.fechaColocacion]);
  const vencido = useMemo(() => estaVencido(volquete.fechaColocacion, 7), [volquete.fechaColocacion]);
  const dineroTotal = volquete.dineroTotalArs ?? 0;
  const dineroFmt = useMemo(() => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(dineroTotal), [dineroTotal]);

  const esPrivado = volquete.esPrivado !== false;
  // "en alquiler" solo aplica a privados — municipales siempre tienen colocado=true por diseño
  const enAlquiler = esPrivado && volquete.colocado;
  const statusLabel = !esPrivado ? "Público" : volquete.colocado ? "En alquiler" : "Libre";
  const statusColor = !esPrivado ? "text-sky-400 bg-sky-400/10 border-sky-400/20" : volquete.colocado ? "text-amber-400 bg-amber-400/10 border-amber-400/20" : "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";

  function handleColocar() {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (!direccion.trim() || isNaN(parsedLat) || isNaN(parsedLng)) return;
    setConfirmAction("colocar");
  }

  function handleConfirmColocar() {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    onColocar({ direccion: direccion.trim(), ...(esPrivado ? { cliente: cliente.trim() || undefined } : {}), lat: parsedLat, lng: parsedLng, nota: nota.trim() || undefined });
    setNota(""); setConfirmAction(null);
  }

  function handleConfirmReemplazar() {
    onReemplazar?.({ nota: nota.trim() || undefined });
    setNota(""); setConfirmAction(null);
  }

  function handleConfirmRetirar() {
    onRetirar({ nota: nota.trim() || undefined });
    setNota(""); setConfirmAction(null);
  }

  function handleConfirmEliminar() {
    setConfirmAction(null); onDelete();
  }

  return (
    <div className="h-full flex flex-col bg-[#0f1117] text-white font-['DM_Sans',sans-serif]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        .sidebar-input { width: 100%; background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #e2e5f0; font-family: 'DM Sans', sans-serif; transition: border-color 0.15s, background 0.15s; outline: none; }
        .sidebar-input:focus { border-color: #4f7cff; background: #1e2130; }
        .sidebar-input::placeholder { color: #4a4f6a; }
        .sidebar-textarea { width: 100%; background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #e2e5f0; font-family: 'DM Sans', sans-serif; resize: none; transition: border-color 0.15s, background 0.15s; outline: none; }
        .sidebar-textarea:focus { border-color: #4f7cff; background: #1e2130; }
        .stat-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1e2130; }
        .stat-row:last-child { border-bottom: none; }
        .btn-primary { width: 100%; padding: 11px; border-radius: 8px; background: #4f7cff; color: white; font-weight: 600; font-size: 13px; letter-spacing: 0.02em; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.15s, transform 0.1s; }
        .btn-primary:hover { background: #6690ff; } .btn-primary:active { transform: scale(0.98); }
        .btn-danger { width: 100%; padding: 11px; border-radius: 8px; background: #ff4f4f18; color: #ff6b6b; font-weight: 600; font-size: 13px; letter-spacing: 0.02em; border: 1px solid #ff4f4f30; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.15s, transform 0.1s; }
        .btn-danger:hover { background: #ff4f4f28; } .btn-danger:active { transform: scale(0.98); }
        .btn-secondary { width: 100%; padding: 11px; border-radius: 8px; background: #1e2130; color: #9ba3c0; font-weight: 600; font-size: 13px; letter-spacing: 0.02em; border: 1px solid #2a2d3a; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.15s, color 0.15s, transform 0.1s; }
        .btn-secondary:hover { background: #242840; color: #c0c8e0; } .btn-secondary:active { transform: scale(0.98); }
        .section-label { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #4a4f6a; margin-bottom: 10px; }
        .scrollbar-custom::-webkit-scrollbar { width: 4px; } .scrollbar-custom::-webkit-scrollbar-track { background: transparent; } .scrollbar-custom::-webkit-scrollbar-thumb { background: #2a2d3a; border-radius: 4px; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #1e2130" }}>
        <div className="flex items-center gap-3">
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #4f7cff22, #4f7cff44)", border: "1px solid #4f7cff40", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TruckIcon size={17} color="#4f7cff" />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#e8ecf8", lineHeight: 1.2 }}>{volquete.nombre}</h2>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, border: "1px solid", marginTop: 3, display: "inline-block" }} className={statusColor}>{statusLabel}</span>
          </div>
        </div>
        <button onClick={onClose} style={{ padding: 8, borderRadius: 8, background: "#1a1d27", border: "1px solid #2a2d3a", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={16} color="#6b7290" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto scrollbar-custom px-5 py-4 space-y-5">

        {/* Stats Card — solo privados */}
        {esPrivado && (
          <div style={{ background: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Calendar size={14} color="#4f7cff" />
              <p className="section-label" style={{ margin: 0 }}>Control de alquiler</p>
            </div>
            {volquete.colocado ? (
              <>
                <div>
                  <div className="stat-row"><span style={{ fontSize: 13, color: "#9ba3c0" }}>Colocado</span><span style={{ fontSize: 13, fontWeight: 500, color: "#e2e5f0", fontFamily: "'DM Mono', monospace" }}>{volquete.fechaColocacion}</span></div>
                  <div className="stat-row"><span style={{ fontSize: 13, color: "#9ba3c0" }}>Días activo</span><span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: vencido ? "#ff6b6b" : "#4ade80" }}>{dias}</span></div>
                  <div className="stat-row"><span style={{ fontSize: 13, color: "#9ba3c0" }}>Reemplazos</span><span style={{ fontSize: 13, fontWeight: 600, color: "#e2e5f0", fontFamily: "'DM Mono', monospace" }}>{volquete.reemplazosTotal ?? 0}</span></div>
                  {isJefe && (
                    <div className="stat-row">
                      <span style={{ fontSize: 13, color: "#9ba3c0" }}>Total facturado</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", fontFamily: "'DM Mono', monospace" }}>{dineroFmt}</span>
                    </div>
                  )}
                </div>
                {vencido && (
                  <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 8, background: "#ff4f4f12", border: "1px solid #ff4f4f30", display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertTriangle size={14} color="#ff6b6b" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#ff6b6b" }}>Vencido — más de 7 días</span>
                  </div>
                )}
              </>
            ) : (
              <p style={{ fontSize: 13, color: "#4a4f6a", margin: 0 }}>Este volquete está libre. Colocalo para iniciar el alquiler.</p>
            )}
          </div>
        )}

        {/* Form Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <MapPin size={12} color="#4a4f6a" />
              <span className="section-label" style={{ margin: 0 }}>Dirección</span>
            </label>
            <input className="sidebar-input" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Ej: Av. Colón 1234" />
          </div>
          {esPrivado && (
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <User size={12} color="#4a4f6a" />
                <span className="section-label" style={{ margin: 0 }}>Cliente</span>
              </label>
              <input className="sidebar-input" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Nombre del cliente" />
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6 }}><span className="section-label" style={{ margin: 0 }}>Latitud</span></label>
              <input className="sidebar-input" style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }} value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-38.719" />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6 }}><span className="section-label" style={{ margin: 0 }}>Longitud</span></label>
              <input className="sidebar-input" style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }} value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-62.270" />
            </div>
          </div>
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <FileText size={12} color="#4a4f6a" />
              <span className="section-label" style={{ margin: 0 }}>Nota <span style={{ opacity: 0.5, textTransform: "none", letterSpacing: 0, fontSize: 10 }}>(opcional)</span></span>
            </label>
            <textarea className="sidebar-textarea" value={nota} onChange={(e) => setNota(e.target.value)} rows={2} placeholder="Observaciones adicionales..." />
            {enAlquiler && (
              <button
                type="button"
                onClick={handleGuardarNota}
                disabled={guardandoNota}
                style={{
                  marginTop: 6,
                  width: "100%",
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: guardandoNota ? "#1a1d27" : "#4f7cff18",
                  border: "1px solid #4f7cff35",
                  color: guardandoNota ? "#4a4f6a" : "#7aa0ff",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: guardandoNota ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  transition: "all 0.15s",
                }}
              >
                <FileText size={12} />
                {guardandoNota ? "Guardando..." : "Guardar nota"}
              </button>
            )}
          </div>
        </div>

        <div style={{ borderTop: "1px solid #1e2130" }} />

        {/* ── Alertas de estado ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Vencido — solo privados en alquiler */}
          {enAlquiler && vencido && (
            <div style={{ padding: "10px 12px", borderRadius: 8, background: "#ff4f4f12", border: "1px solid #ff4f4f35", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={14} color="#ff6b6b" style={{ flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#ff6b6b", display: "block" }}>Alquiler vencido</span>
                <span style={{ fontSize: 11, color: "#ff6b6b99" }}>Llevan {dias} días — límite 7 días</span>
              </div>
            </div>
          )}
          {/* Libre — privado sin alquiler */}
          {esPrivado && !enAlquiler && (
            <div style={{ padding: "10px 12px", borderRadius: 8, background: "#4f7cff10", border: "1px solid #4f7cff30", display: "flex", alignItems: "center", gap: 8 }}>
              <TruckIcon size={14} color="#7aa0ff" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#7aa0ff" }}>Libre — sin alquiler activo</span>
            </div>
          )}
          {/* Municipal sin dirección */}
          {!esPrivado && !volquete.direccion?.trim() && (
            <div style={{ padding: "10px 12px", borderRadius: 8, background: "#f59e0b10", border: "1px solid #f59e0b30", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b" }}>Sin dirección registrada</span>
            </div>
          )}
          {/* No se puede eliminar si está en alquiler (solo privados) */}
          {isJefe && enAlquiler && (
            <div style={{ padding: "10px 12px", borderRadius: 8, background: "#ff4f4f08", border: "1px solid #ff4f4f20", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={14} color="#ff6b6b55" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: "#ff6b6b55" }}>Retirá el volquete antes de eliminarlo</span>
            </div>
          )}
          {/* No se puede reemplazar si no hay alquiler activo (solo privados) */}
          {isJefe && esPrivado && !enAlquiler && (
            <div style={{ padding: "10px 12px", borderRadius: 8, background: "#9ba3c010", border: "1px solid #9ba3c025", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={14} color="#9ba3c055" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: "#9ba3c055" }}>El reemplazo solo aplica con alquiler activo</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Colocar — solo privados libres */}
          {esPrivado && !enAlquiler && (
            <button className="btn-primary" onClick={handleColocar}>
              <MapPin size={15} />Colocar — iniciar alquiler
            </button>
          )}
          {/* Retirar — solo privados en alquiler */}
          {esPrivado && enAlquiler && (
            <button className="btn-danger" onClick={() => setConfirmAction("retirar")}>
              <TruckIcon size={15} />Retirar — finalizar alquiler
            </button>
          )}

          {/* Reemplazar y Eliminar — solo jefe */}
          {isJefe && (
            <>
              {/* Reemplazar: solo privados en alquiler */}
              <button
                className="btn-secondary"
                onClick={() => setConfirmAction("reemplazar")}
                disabled={esPrivado && !enAlquiler}
                title={esPrivado && !enAlquiler ? "Solo se puede reemplazar si hay alquiler activo" : undefined}
                style={esPrivado && !enAlquiler ? { opacity: 0.35, cursor: "not-allowed" } : {}}
              >
                <RotateCcw size={14} />Reemplazar volquete
              </button>
              {/* Eliminar: bloqueado solo si privado en alquiler */}
              <button
                className="btn-secondary"
                onClick={() => setConfirmAction("eliminar")}
                disabled={enAlquiler}
                title={enAlquiler ? "No se puede eliminar un volquete en alquiler" : undefined}
                style={enAlquiler
                  ? { opacity: 0.35, cursor: "not-allowed" }
                  : { color: "#ff6b6b55", borderColor: "#ff4f4f18" }
                }
              >
                <Trash2 size={14} />Eliminar volquete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        open={confirmAction === "colocar"}
        title="Confirmar colocación"
        description={`Se iniciará el alquiler de "${volquete.nombre}" en ${direccion || "la ubicación indicada"}.`}
        confirmLabel="Iniciar alquiler"
        variant="primary"
        icon={<MapPin size={16} color="#4f7cff" />}
        onConfirm={handleConfirmColocar}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmModal
        open={confirmAction === "retirar"}
        title="Finalizar alquiler"
        description={`Se registrará el retiro de "${volquete.nombre}". El alquiler quedará cerrado.`}
        confirmLabel="Finalizar alquiler"
        variant="warning"
        icon={<TruckIcon size={16} color="#f59e0b" />}
        onConfirm={handleConfirmRetirar}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmModal
        open={confirmAction === "reemplazar"}
        title="Reemplazar volquete"
        description={`Se registrará un reemplazo de "${volquete.nombre}" en la misma ubicación.`}
        confirmLabel="Confirmar reemplazo"
        variant="primary"
        icon={<RotateCcw size={16} color="#4f7cff" />}
        onConfirm={handleConfirmReemplazar}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmModal
        open={confirmAction === "eliminar"}
        title="Eliminar volquete"
        description={`Esta acción es irreversible. Se eliminará permanentemente "${volquete.nombre}" y todo su historial.`}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        icon={<Trash2 size={16} color="#ff6b6b" />}
        onConfirm={handleConfirmEliminar}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}