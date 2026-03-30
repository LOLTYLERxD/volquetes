"use client";

import { useEffect, useState } from "react";
import { X, MapPin, Lock, Globe } from "lucide-react";

interface AddVolqueteModalProps {
  lat?: number | null;
  lng?: number | null;
  direccionInicial?: string;
  isLoadingDireccion?: boolean;
  onConfirm: (data: {
    nombre: string;
    direccion: string;
    cliente?: string;
    lat: number;
    lng: number;
    esPrivado?: boolean;
  }) => void;
  onCancel: () => void;
}

export default function AddVolqueteModal({ lat, lng, direccionInicial, isLoadingDireccion, onConfirm, onCancel }: AddVolqueteModalProps) {
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState(direccionInicial ?? "");

  // Sync when geocoded address arrives
  useEffect(() => {
    if (direccionInicial !== undefined) setDireccion(direccionInicial);
  }, [direccionInicial]);
  const [cliente, setCliente] = useState("");
  const [esPrivado, setEsPrivado] = useState(true);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !direccion.trim()) return;
    if (typeof lat !== "number" || typeof lng !== "number") return;
    onConfirm({
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      cliente: esPrivado ? (cliente.trim() || undefined) : undefined,
      lat, lng, esPrivado,
    });
  }

  const hasCoords = typeof lat === "number" && typeof lng === "number";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        .modal-overlay {
          position: fixed; inset: 0; z-index: 2000;
          display: flex; align-items: center; justify-content: center;
          background: rgba(5, 7, 12, 0.75);
          backdrop-filter: blur(6px);
          padding: 16px;
          animation: overlayIn 0.2s ease;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        @keyframes overlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .modal-card {
          width: 100%; max-width: 420px;
          background: #0f1117;
          border: 1px solid #2a2d3a;
          border-radius: 16px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px #ffffff05;
          animation: cardIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: hidden;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }

        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px 16px;
          border-bottom: 1px solid #1e2130;
        }

        .modal-close-btn {
          width: 30px; height: 30px; border-radius: 8px;
          background: #1a1d27; border: 1px solid #2a2d3a;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.15s;
        }
        .modal-close-btn:hover { background: #242840; }

        .modal-coords {
          display: flex; align-items: center; gap: 8px;
          margin: 14px 20px 0;
          padding: 9px 12px;
          background: #1a1d27;
          border: 1px solid #2a2d3a;
          border-radius: 9px;
        }

        .modal-body { padding: 16px 20px 20px; display: flex; flex-direction: column; gap: 14px; }

        .modal-field label {
          display: block;
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: #4a4f6a;
          margin-bottom: 6px;
        }

        .modal-input {
          width: 100%; box-sizing: border-box;
          background: #1a1d27;
          border: 1px solid #2a2d3a;
          border-radius: 9px;
          padding: 10px 14px;
          font-size: 13px; color: #e2e5f0;
          font-family: 'DM Sans', system-ui, sans-serif;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
        }
        .modal-input:focus { border-color: #4f7cff; background: #1e2130; }
        .modal-input::placeholder { color: #3d4260; }

        .modal-toggle {
          display: flex; gap: 6px;
        }
        .modal-toggle-opt {
          flex: 1; padding: 9px 10px;
          border-radius: 9px; border: 1px solid #2a2d3a;
          background: #1a1d27;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          font-size: 12px; font-weight: 600;
          color: #6b7290; cursor: pointer;
          transition: all 0.15s;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .modal-toggle-opt.active-privado {
          background: #4f7cff18; border-color: #4f7cff40; color: #7aa0ff;
        }
        .modal-toggle-opt.active-publico {
          background: #9ba3c018; border-color: #9ba3c040; color: #9ba3c0;
        }

        .modal-divider { height: 1px; background: #1e2130; }

        .modal-actions { display: flex; gap: 8px; }

        .btn-cancel {
          flex: 1; padding: 11px;
          border-radius: 9px;
          background: #1a1d27; border: 1px solid #2a2d3a;
          font-size: 13px; font-weight: 600; color: #6b7290;
          cursor: pointer; transition: all 0.15s;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .btn-cancel:hover { background: #1e2130; color: #9ba3c0; }

        .btn-confirm {
          flex: 1; padding: 11px;
          border-radius: 9px;
          background: #4f7cff; border: none;
          font-size: 13px; font-weight: 600; color: #fff;
          cursor: pointer; transition: all 0.15s;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .btn-confirm:hover { background: #6690ff; }
        .btn-confirm:active { transform: scale(0.98); }
        .btn-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      <div
        className="modal-overlay"
        onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      >
        <div className="modal-card">

          {/* Header */}
          <div className="modal-header">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: "linear-gradient(135deg, #4f7cff22, #4f7cff44)",
                border: "1px solid #4f7cff40",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 16 }}>🚛</span>
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e8ecf8", margin: 0, lineHeight: 1.2 }}>
                  Nuevo volquete
                </h3>
                <p style={{ fontSize: 11, color: "#4a4f6a", margin: 0 }}>
                  Completá los datos para registrarlo
                </p>
              </div>
            </div>
            <button className="modal-close-btn" onClick={onCancel} aria-label="Cerrar">
              <X size={15} color="#6b7290" />
            </button>
          </div>

          {/* Coords */}
          <div className="modal-coords">
            <MapPin size={13} color="#4f7cff" style={{ flexShrink: 0 }} />
            <span style={{
              fontSize: 12, fontFamily: "'DM Mono', monospace",
              color: hasCoords ? "#9ba3c0" : "#3d4260",
            }}>
              {hasCoords
                ? `${lat!.toFixed(5)}, ${lng!.toFixed(5)}`
                : "Sin coordenadas"}
            </span>
            {hasCoords && (
              <span style={{
                marginLeft: "auto", fontSize: 10, fontWeight: 600,
                color: "#4ade80", background: "#4ade8015",
                border: "1px solid #4ade8030", borderRadius: 5,
                padding: "2px 7px",
              }}>
                ✓ Ubicación
              </span>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body">

              {/* Nombre */}
              <div className="modal-field">
                <label htmlFor="nombre">Nombre / ID *</label>
                <input
                  id="nombre" className="modal-input"
                  type="text" placeholder="VOL-007"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required autoFocus
                />
              </div>

              {/* Dirección */}
              <div className="modal-field">
                <label htmlFor="direccion" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  Dirección *
                  {isLoadingDireccion && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      fontSize: 10, color: "#4f7cff", fontWeight: 500,
                      textTransform: "none", letterSpacing: 0,
                    }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%",
                        border: "1.5px solid #4f7cff",
                        borderTopColor: "transparent",
                        display: "inline-block",
                        animation: "spin 0.7s linear infinite",
                      }} />
                      Buscando dirección...
                    </span>
                  )}
                  {!isLoadingDireccion && direccion && (
                    <span style={{
                      fontSize: 10, color: "#4ade80", fontWeight: 600,
                      textTransform: "none", letterSpacing: 0,
                    }}>
                      ✓ Autocompletada
                    </span>
                  )}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="direccion" className="modal-input"
                    type="text" placeholder={isLoadingDireccion ? "Obteniendo dirección…" : "Av. Ejemplo 1234"}
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    required
                    style={{ paddingRight: direccion && !isLoadingDireccion ? 32 : undefined }}
                  />
                  {direccion && !isLoadingDireccion && (
                    <button
                      type="button"
                      onClick={() => setDireccion("")}
                      title="Limpiar dirección"
                      style={{
                        position: "absolute", right: 10, top: "50%",
                        transform: "translateY(-50%)",
                        background: "none", border: "none",
                        cursor: "pointer", color: "#4a4f6a", padding: 0,
                        display: "flex", alignItems: "center",
                        fontSize: 14, lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Tipo toggle */}
              <div className="modal-field">
                <label>Tipo de volquete</label>
                <div className="modal-toggle">
                  <button
                    type="button"
                    className={`modal-toggle-opt ${esPrivado ? "active-privado" : ""}`}
                    onClick={() => setEsPrivado(true)}
                  >
                    <Lock size={13} />
                    Privado
                  </button>
                  <button
                    type="button"
                    className={`modal-toggle-opt ${!esPrivado ? "active-publico" : ""}`}
                    onClick={() => setEsPrivado(false)}
                  >
                    <Globe size={13} />
                    Público
                  </button>
                </div>
              </div>

              {/* Cliente (solo privado) */}
              {esPrivado && (
                <div className="modal-field" style={{ animation: "fadeIn 0.15s ease" }}>
                  <label htmlFor="cliente">Cliente <span style={{ opacity: 0.5, textTransform: "none", letterSpacing: 0, fontSize: 10 }}>(opcional)</span></label>
                  <input
                    id="cliente" className="modal-input"
                    type="text" placeholder="Nombre del cliente"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                  />
                </div>
              )}

              <div className="modal-divider" />

              {/* Actions */}
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={onCancel}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-confirm"
                  disabled={!nombre.trim() || !direccion.trim() || !hasCoords || isLoadingDireccion}
                >
                  Agregar volquete
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}