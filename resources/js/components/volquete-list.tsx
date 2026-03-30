"use client";

import { Truck, MapPin, AlertTriangle, Search } from "lucide-react";
import type { Volquete } from "@/lib/volquetes";
import { calcularDias, estaVencido } from "@/lib/volquetes";

type FilterStatus = "all" | "libres" | "colocados" | "vencidos" | "privados" | "municipales";

interface VolqueteListProps {
  volquetes: Volquete[];
  selectedId: string | null;
  onSelect: (volquete: Volquete) => void;
  filterStatus: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const FILTER_CONFIG: { value: FilterStatus; label: string; color: string; dot: string }[] = [
  { value: "all",        label: "Todos",       color: "",        dot: "" },
  { value: "privados",   label: "Privados",    color: "#eab308", dot: "#eab308" },
  { value: "municipales",label: "Municipales", color: "#4ade80", dot: "#4ade80" },
  { value: "libres",     label: "Libres",      color: "#9ba3c0", dot: "#9ba3c0" },
  { value: "colocados",  label: "Colocados",   color: "#4f7cff", dot: "#4f7cff" },
  { value: "vencidos",   label: "Vencidos",    color: "#ff6b6b", dot: "#ff6b6b" },
];

export default function VolqueteList({
  volquetes,
  selectedId,
  onSelect,
  filterStatus,
  onFilterChange,
  searchQuery,
  onSearchChange,
}: VolqueteListProps) {
  const filtered = volquetes.filter((v) => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      q.length === 0 ||
      v.nombre.toLowerCase().includes(q) ||
      (v.direccion || "").toLowerCase().includes(q) ||
      (v.cliente || "").toLowerCase().includes(q);

    const esPrivado = v.esPrivado !== false;
    const vencido = esPrivado && estaVencido(v.fechaColocacion, 7);

    const matchFilter =
      filterStatus === "all" ||
      (filterStatus === "privados"    && esPrivado) ||
      (filterStatus === "municipales" && !esPrivado) ||
      (filterStatus === "libres"      && !v.colocado) ||
      (filterStatus === "colocados"   && v.colocado) ||
      (filterStatus === "vencidos"    && vencido);

    return matchSearch && matchFilter;
  });

  const counts = volquetes.reduce(
    (acc, v) => {
      const esPrivado = v.esPrivado !== false;
      const vencido = esPrivado && estaVencido(v.fechaColocacion, 7);
      acc.all++;
      if (esPrivado)  acc.privados++;
      if (!esPrivado) acc.municipales++;
      if (!v.colocado) acc.libres++;
      if (v.colocado)  acc.colocados++;
      if (vencido)     acc.vencidos++;
      return acc;
    },
    { all: 0, privados: 0, municipales: 0, libres: 0, colocados: 0, vencidos: 0 } as Record<FilterStatus, number>
  );

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: "#0f1117",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        .vq-search-wrap {
          position: relative;
          margin: 14px 14px 0;
        }
        .vq-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #4a4f6a;
        }
        .vq-search {
          width: 100%;
          box-sizing: border-box;
          background: #1a1d27;
          border: 1px solid #2a2d3a;
          border-radius: 9px;
          padding: 9px 14px 9px 36px;
          font-size: 13px;
          color: #e2e5f0;
          font-family: 'DM Sans', system-ui, sans-serif;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
        }
        .vq-search:focus {
          border-color: #4f7cff;
          background: #1e2130;
        }
        .vq-search::placeholder { color: #3d4260; }

        .vq-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          padding: 8px 14px;
        }

        .vq-filter-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 9px;
          border-radius: 7px;
          border: 1px solid #2a2d3a;
          background: #1a1d27;
          font-size: 11px;
          font-weight: 600;
          font-family: 'DM Sans', system-ui, sans-serif;
          color: #6b7290;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
          letter-spacing: 0.02em;
        }
        .vq-filter-btn:hover { background: #1e2130; color: #9ba3c0; }
        .vq-filter-btn.active          { background:#4f7cff18; border-color:#4f7cff40; color:#7aa0ff; }
        .vq-filter-btn.active-privados   { background:#eab30818; border-color:#eab30840; color:#eab308; }
        .vq-filter-btn.active-municipales{ background:#4ade8018; border-color:#4ade8040; color:#4ade80; }
        .vq-filter-btn.active-libres     { background:#9ba3c018; border-color:#9ba3c040; color:#9ba3c0; }
        .vq-filter-btn.active-colocados  { background:#4f7cff18; border-color:#4f7cff40; color:#7aa0ff; }
        .vq-filter-btn.active-vencidos   { background:#ff6b6b18; border-color:#ff6b6b40; color:#ff6b6b; }

        .vq-count-badge {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          padding: 1px 5px;
          border-radius: 4px;
          background: #ffffff0d;
        }

        .vq-list {
          flex: 1;
          overflow-y: auto;
          padding: 2px 10px 10px;
          scrollbar-width: thin;
          scrollbar-color: #2a2d3a transparent;
        }
        .vq-list::-webkit-scrollbar { width: 3px; }
        .vq-list::-webkit-scrollbar-thumb { background: #2a2d3a; border-radius: 4px; }

        .vq-item {
          width: 100%;
          box-sizing: border-box;
          text-align: left;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid transparent;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 3px;
          transition: background 0.12s, border-color 0.12s;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .vq-item:hover { background: #1a1d27; border-color: #2a2d3a; }
        .vq-item.selected { background: #4f7cff12; border-color: #4f7cff35; }

        .vq-icon-wrap {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .vq-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          gap: 8px;
        }
      `}</style>

      {/* Search */}
      <div className="vq-search-wrap">
        <Search size={14} className="vq-search-icon" />
        <input
          className="vq-search"
          type="text"
          placeholder="Buscar por nombre, dirección o cliente..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="vq-filters">
        {FILTER_CONFIG.map((f) => {
          const isActive = filterStatus === f.value;
          const activeClass = isActive
            ? f.value === "all" ? "active" : `active-${f.value}`
            : "";

          return (
            <button
              key={f.value}
              className={`vq-filter-btn ${activeClass}`}
              onClick={() => onFilterChange(f.value)}
            >
              {f.dot && (
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: f.dot,
                  boxShadow: isActive ? `0 0 5px ${f.dot}80` : "none",
                  display: "inline-block", flexShrink: 0,
                }} />
              )}
              {f.label}
              <span className="vq-count-badge">{counts[f.value]}</span>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#1e2130", margin: "0 14px 6px" }} />

      {/* List */}
      <div className="vq-list">
        {filtered.length === 0 ? (
          <div className="vq-empty">
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "#1a1d27", border: "1px solid #2a2d3a",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Truck size={20} color="#3d4260" />
            </div>
            <p style={{ fontSize: 13, color: "#3d4260", margin: 0 }}>
              No se encontraron volquetes
            </p>
          </div>
        ) : (
          filtered.map((v) => {
            const dias = calcularDias(v.fechaColocacion);
            const esPrivado = v.esPrivado !== false;
            const vencido = esPrivado && estaVencido(v.fechaColocacion, 7);
            const isSelected = selectedId === v.id;

            const stateColor = vencido ? "#ff6b6b"
              : !v.colocado ? "#9ba3c0"
              : esPrivado ? "#eab308"
              : "#4ade80";

            return (
              <button
                key={v.id}
                className={`vq-item${isSelected ? " selected" : ""}`}
                onClick={() => onSelect(v)}
              >
                <div className="vq-icon-wrap" style={{
                  background: `${stateColor}12`,
                  border: `1px solid ${stateColor}30`,
                }}>
                  <Truck size={15} color={stateColor} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e5f0", lineHeight: 1.2 }}>
                      {v.nombre}
                    </span>

                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 5,
                      background: esPrivado ? "#eab30815" : "#4ade8015",
                      color: esPrivado ? "#eab308" : "#4ade80",
                      border: `1px solid ${esPrivado ? "#eab30830" : "#4ade8030"}`,
                      letterSpacing: "0.03em",
                    }}>
                      {esPrivado ? "Privado" : "Municipal"}
                    </span>

                    {esPrivado ? (
                      v.colocado ? (
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          color: vencido ? "#ff6b6b" : "#4ade80",
                          display: "flex", alignItems: "center", gap: 3,
                        }}>
                          {vencido && <AlertTriangle size={10} />}
                          {vencido ? "Vencido" : `${dias}d`}
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#4a4f6a" }}>Libre</span>
                      )
                    ) : null}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                    <MapPin size={10} color="#3d4260" style={{ flexShrink: 0 }} />
                    <span style={{
                      fontSize: 11, color: "#4a4f6a",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {v.direccion || "Sin dirección"}
                    </span>
                    {v.cliente && (
                      <>
                        <span style={{ color: "#2a2d3a", fontSize: 10 }}>·</span>
                        <span style={{
                          fontSize: 11, color: "#4a4f6a",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {v.cliente}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: stateColor,
                  boxShadow: `0 0 6px ${stateColor}80`,
                  flexShrink: 0,
                }} />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}