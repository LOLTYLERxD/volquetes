"use client";

import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import type { Volquete } from "@/lib/volquetes";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type VisualState = "libre" | "colocado_privado" | "colocado_municipal" | "vencido";

const VISUAL_COLORS: Record<VisualState, string> = {
  libre: "#9ba3c0",
  colocado_privado: "#eab308",
  colocado_municipal: "#4ade80",
  vencido: "#ff6b6b",
};

const VISUAL_LABELS: Record<VisualState, string> = {
  libre: "Libre",
  colocado_privado: "Colocado (privado)",
  colocado_municipal: "Colocado (municipal)",
  vencido: "Vencido (+7 días)",
};

function daysBetween(dateIso: string, now = new Date()) {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((now.getTime() - d.getTime()) / 86400000);
}

function getVisualState(v: Volquete): { state: VisualState; daysInRent: number | null } {
  if (!v.colocado) {
    return { state: "libre", daysInRent: null };
  }

  if (v.esPrivado !== false && v.fechaColocacion) {
    const days = daysBetween(v.fechaColocacion);
    if (typeof days === "number" && days >= 7) {
      return { state: "vencido", daysInRent: days };
    }
    const daysInRent = typeof days === "number" ? days : null;
    return { state: "colocado_privado", daysInRent };
  }

  if (v.esPrivado === false) {
    return { state: "colocado_municipal", daysInRent: null };
  }

  return { state: "colocado_privado", daysInRent: null };
}

function getMarkerIcon(state: VisualState, isSelected = false) {
  const color = VISUAL_COLORS[state];
  const size = isSelected ? 38 : 30;
  const pinH = isSelected ? 50 : 40;

  const glowRing = isSelected
    ? `<circle cx="${size / 2}" cy="${size / 2 - 2}" r="${size / 2 - 1}" fill="none" stroke="${color}" stroke-width="2" opacity="0.35"/>`
    : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size + 8}" height="${pinH + 8}" viewBox="0 0 ${size + 8} ${pinH + 8}">
    <defs>
      <filter id="shadow${state}" x="-30%" y="-20%" width="160%" height="160%">
        <feDropShadow dx="0" dy="2" stdDeviation="${isSelected ? 4 : 2}" flood-color="${color}" flood-opacity="${isSelected ? 0.6 : 0.35}"/>
      </filter>
      <radialGradient id="grad${state}" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stop-color="${color}" stop-opacity="1"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0.75"/>
      </radialGradient>
    </defs>
    <g transform="translate(4,4)" filter="url(#shadow${state})">
      ${glowRing}
      <path d="M${size / 2} 0C${size * 0.225} 0 0 ${size * 0.225} 0 ${size / 2}c0 ${size * 0.45} ${size / 2} ${pinH - size / 2} ${size / 2} ${pinH - size / 2}S${size} ${size * 0.95} ${size} ${size / 2}C${size} ${size * 0.225} ${size * 0.775} 0 ${size / 2} 0z" fill="url(#grad${state})"/>
      <circle cx="${size / 2}" cy="${size / 2 - 1}" r="${size * 0.26}" fill="#0f1117" opacity="0.55"/>
      <rect x="${size * 0.27}" y="${size * 0.27}" width="${size * 0.46}" height="${size * 0.32}" rx="2" fill="#0f1117" stroke="${color}" stroke-width="0.8" opacity="0.9"/>
      <line x1="${size * 0.36}" y1="${size * 0.27}" x2="${size * 0.36}" y2="${size * 0.59}" stroke="${color}" stroke-width="0.5" opacity="0.6"/>
      <line x1="${size * 0.5}" y1="${size * 0.27}" x2="${size * 0.5}" y2="${size * 0.59}" stroke="${color}" stroke-width="0.5" opacity="0.6"/>
      <line x1="${size * 0.64}" y1="${size * 0.27}" x2="${size * 0.64}" y2="${size * 0.59}" stroke="${color}" stroke-width="0.5" opacity="0.6"/>
    </g>
  </svg>`;

  return L.divIcon({
    html: svg,
    className: "volquete-marker",
    iconSize: [size + 8, pinH + 8],
    iconAnchor: [(size + 8) / 2, pinH + 8],
    popupAnchor: [0, -(pinH + 6)],
  });
}

interface VolqueteMapProps {
  volquetes: Volquete[];
  statsVolquetes: Volquete[];
  galponStock: number;
  selectedVolquete: Volquete | null;
  onSelectVolquete: (volquete: Volquete) => void;
  onMapClick?: (lat: number, lng: number) => void;
  isAddingMode: boolean;
}

export default function VolqueteMap({
  volquetes,
  statsVolquetes,
  galponStock,
  selectedVolquete,
  onSelectVolquete,
  onMapClick,
  isAddingMode,
}: VolqueteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const darkLayerRef = useRef<L.TileLayer | null>(null);
  const lightLayerRef = useRef<L.TileLayer | null>(null);

  const [mapTheme, setMapTheme] = useState<"dark" | "light">("dark");

  const handleMapClick = useCallback(
    (e: L.LeafletMouseEvent) => {
      if (isAddingMode && onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
    [isAddingMode, onMapClick]
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-39.2833, -65.6667],
      zoom: 14,
      zoomControl: false,
    });

    const darkLayer = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }
    );

    const lightLayer = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }
    );

    darkLayer.addTo(map);

    darkLayerRef.current = darkLayer;
    lightLayerRef.current = lightLayer;

    L.control.zoom({ position: "bottomright" }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      darkLayerRef.current = null;
      lightLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const darkLayer = darkLayerRef.current;
    const lightLayer = lightLayerRef.current;

    if (!map || !darkLayer || !lightLayer) return;

    if (mapTheme === "dark") {
      if (map.hasLayer(lightLayer)) map.removeLayer(lightLayer);
      if (!map.hasLayer(darkLayer)) darkLayer.addTo(map);
    } else {
      if (map.hasLayer(darkLayer)) map.removeLayer(darkLayer);
      if (!map.hasLayer(lightLayer)) lightLayer.addTo(map);
    }
  }, [mapTheme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [handleMapClick]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    mapContainerRef.current.style.cursor = isAddingMode ? "crosshair" : "";
  }, [isAddingMode]);

  useEffect(() => {
    if (!markersRef.current || !mapRef.current) return;

    markersRef.current.clearLayers();

    volquetes.forEach((v) => {
      const { state, daysInRent } = getVisualState(v);
      const isSelected = selectedVolquete?.id === v.id;

      const marker = L.marker([v.lat, v.lng], {
        icon: getMarkerIcon(state, isSelected),
        zIndexOffset: isSelected ? 1000 : 0,
      });

      const color = VISUAL_COLORS[state];
      const popupBg = mapTheme === "dark" ? "#0f1117" : "#ffffff";
      const popupBorder = mapTheme === "dark" ? "#2a2d3a" : "#d1d5db";
      const popupText = mapTheme === "dark" ? "#e8ecf8" : "#111827";
      const popupMuted = mapTheme === "dark" ? "#9ba3c0" : "#4b5563";
      const popupSubtle = mapTheme === "dark" ? "#1e2130" : "#e5e7eb";

      const popupContent = `
        <div style="
          font-family: 'DM Sans', system-ui, sans-serif;
          min-width: 210px;
          background: ${popupBg};
          border-radius: 10px;
          padding: 14px 16px;
        ">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
            <div style="
              width:28px; height:28px; border-radius:7px;
              background:${color}18; border:1px solid ${color}35;
              display:flex; align-items:center; justify-content:center;
              font-size:14px;
            ">🚛</div>
            <div>
              <div style="font-weight:700; font-size:14px; color:${popupText}; line-height:1.2;">${v.nombre}</div>
              <div style="font-size:11px; color:${color}; font-weight:600; letter-spacing:0.04em;">${VISUAL_LABELS[state]}</div>
            </div>
            ${
              typeof daysInRent === "number"
                ? `<div style="margin-left:auto; background:${color}18; border:1px solid ${color}30; border-radius:6px; padding:3px 8px; font-size:11px; font-weight:700; color:${color}; font-family:monospace;">${daysInRent}d</div>`
                : ""
            }
          </div>

          <div style="border-top:1px solid ${popupSubtle}; padding-top:8px; display:flex; flex-direction:column; gap:4px;">
            ${
              v.direccion
                ? `<div style="display:flex; gap:6px; align-items:flex-start;">
              <span style="color:${popupMuted}; font-size:11px; margin-top:1px;">📍</span>
              <span style="font-size:12px; color:${popupMuted}; line-height:1.4;">${v.direccion}</span>
            </div>`
                : ""
            }
            ${
              v.cliente
                ? `<div style="display:flex; gap:6px; align-items:center;">
              <span style="color:${popupMuted}; font-size:11px;">👤</span>
              <span style="font-size:12px; color:${popupMuted};">${v.cliente}</span>
            </div>`
                : ""
            }
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: mapTheme === "dark" ? "volquete-popup-dark" : "volquete-popup-light",
        closeButton: false,
        maxWidth: 260,
      });

      marker.on("click", () => onSelectVolquete(v));
      markersRef.current!.addLayer(marker);
    });
  }, [volquetes, selectedVolquete, onSelectVolquete, mapTheme]);

  useEffect(() => {
    if (selectedVolquete && mapRef.current) {
      mapRef.current.flyTo([selectedVolquete.lat, selectedVolquete.lng], 16, {
        duration: 0.7,
      });
    }
  }, [selectedVolquete]);

  const counts = useMemo(() => {
    return statsVolquetes.reduce(
      (acc, v) => {
        const { state } = getVisualState(v);
        acc[state]++;
        return acc;
      },
      { libre: 0, colocado_privado: 0, colocado_municipal: 0, vencido: 0 } as Record<
        VisualState,
        number
      >
    );
  }, [statsVolquetes]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        .volquete-popup-dark .leaflet-popup-content-wrapper {
          background: #0f1117 !important;
          border: 1px solid #2a2d3a !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
          padding: 0 !important;
        }

        .volquete-popup-light .leaflet-popup-content-wrapper {
          background: #ffffff !important;
          border: 1px solid #d1d5db !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.18) !important;
          padding: 0 !important;
        }

        .volquete-popup-dark .leaflet-popup-content,
        .volquete-popup-light .leaflet-popup-content {
          margin: 0 !important;
        }

        .volquete-popup-dark .leaflet-popup-tip-container,
        .volquete-popup-light .leaflet-popup-tip-container {
          display: none !important;
        }

        .leaflet-zoom-animated .volquete-marker {
          transition: filter 0.2s ease;
        }

        .leaflet-zoom-animated .volquete-marker:hover {
          filter: brightness(1.15);
        }

        .leaflet-container {
          z-index: 1 !important;
        }

        .leaflet-control-container {
          z-index: 2 !important;
        }
      `}</style>

      <div className="relative h-full w-full">
        <div ref={mapContainerRef} className="h-full w-full" />

        <button
          onClick={() => setMapTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 1000,
            background: mapTheme === "dark" ? "#0f1117ee" : "#ffffffee",
            color: mapTheme === "dark" ? "#e8ecf8" : "#111827",
            border: `1px solid ${mapTheme === "dark" ? "#2a2d3a" : "#d1d5db"}`,
            borderRadius: 10,
            padding: "10px 14px",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            cursor: "pointer",
            boxShadow:
              mapTheme === "dark"
                ? "0 8px 24px rgba(0,0,0,0.35)"
                : "0 8px 24px rgba(0,0,0,0.12)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: mapTheme === "dark" ? "#eab308" : "#4f7cff",
              boxShadow: `0 0 8px ${mapTheme === "dark" ? "#eab308" : "#4f7cff"}80`,
              flexShrink: 0,
            }}
          />
          {mapTheme === "dark" ? "Fondo blanco" : "Fondo oscuro"}
        </button>

        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 16,
            zIndex: 1000,
            background: mapTheme === "dark" ? "#0f1117ee" : "#ffffffee",
            border: `1px solid ${mapTheme === "dark" ? "#2a2d3a" : "#d1d5db"}`,
            borderRadius: 12,
            padding: "10px 14px",
            backdropFilter: "blur(10px)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            boxShadow:
              mapTheme === "dark"
                ? "0 8px 24px rgba(0,0,0,0.32)"
                : "0 8px 24px rgba(0,0,0,0.12)",
          }}
        >
          {(["colocado_municipal", "colocado_privado", "libre", "vencido"] as VisualState[]).map(
            (s) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: VISUAL_COLORS[s],
                    boxShadow: `0 0 6px ${VISUAL_COLORS[s]}80`,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    color: mapTheme === "dark" ? "#9ba3c0" : "#4b5563",
                    minWidth: 150,
                  }}
                >
                  {VISUAL_LABELS[s]}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: VISUAL_COLORS[s],
                    fontFamily: "monospace",
                    marginLeft: "auto",
                  }}
                >
                  {counts[s]}
                </span>
              </div>
            )
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#a78bfa",
                boxShadow: "0 0 6px #a78bfa80",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 12,
                color: mapTheme === "dark" ? "#9ba3c0" : "#4b5563",
                minWidth: 150,
              }}
            >
              En galpón
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#a78bfa",
                fontFamily: "monospace",
                marginLeft: "auto",
              }}
            >
              {galponStock}
            </span>
          </div>
        </div>

        {isAddingMode && (
          <div
            style={{
              position: "absolute",
              top: 16,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,
              animation: "fadeSlideIn 0.25s ease",
            }}
          >
            <div
              style={{
                background: mapTheme === "dark" ? "#0f1117ee" : "#ffffffee",
                border: "1px solid #4f7cff50",
                borderRadius: 10,
                padding: "10px 18px",
                backdropFilter: "blur(12px)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 0 24px #4f7cff20",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#4f7cff",
                  boxShadow: "0 0 8px #4f7cff",
                  animation: "pulse 1.4s ease-in-out infinite",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#4f7cff",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                Clic en el mapa para colocar el volquete
              </span>
            </div>
          </div>
        )}

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; box-shadow: 0 0 8px #4f7cff; }
            50% { opacity: 0.5; box-shadow: 0 0 3px #4f7cff; }
          }

          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
        `}</style>
      </div>
    </>
  );
}