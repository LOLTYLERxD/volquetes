"use client";

import { useEffect, useState } from "react";
import { X, MoveRight } from "lucide-react";
import type { Volquete, Movimiento } from "@/lib/volquetes";

interface MoveVolqueteModalProps {
  volquete: Volquete | null;
  onConfirm: (data: {
    tipo: Movimiento["tipo"];
    direccion: string;
    lat: number;
    lng: number;
    nota?: string;
  }) => void;
  onCancel: () => void;
}

export default function MoveVolqueteModal({ volquete, onConfirm, onCancel }: MoveVolqueteModalProps) {
  if (!volquete) return null;

  const [tipo, setTipo] = useState<Movimiento["tipo"]>("traslado");
  const [direccion, setDireccion] = useState("");
  const [lat, setLat] = useState(() => String(volquete.lat));
  const [lng, setLng] = useState(() => String(volquete.lng));
  const [nota, setNota] = useState("");

  useEffect(() => {
    setLat(String(volquete.lat));
    setLng(String(volquete.lng));
    setDireccion("");
    setNota("");
    setTipo("traslado");
  }, [volquete.id]);


  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!direccion.trim()) return;
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (isNaN(parsedLat) || isNaN(parsedLng)) return;

    onConfirm({
      tipo,
      direccion: direccion.trim(),
      lat: parsedLat,
      lng: parsedLng,
      nota: nota.trim() || undefined,
    });
  }

  const tipoOptions: { value: Movimiento["tipo"]; label: string; color: string }[] = [
    { value: "traslado", label: "Traslado", color: "#5b8def" },
    { value: "colocacion", label: "Colocacion", color: "#3ecf8e" },
    { value: "retiro", label: "Retiro", color: "#ef5350" },
  ];

  return (
<div
  className="fixed inset-0 z-[99999] flex items-center justify-center"
  style={{ background: "rgba(0,0,0,0.55)" }}
>
<div
  className="relative w-full max-w-md mx-4 rounded-xl shadow-2xl"
  style={{ background: "#0b1220", border: "1px solid rgba(255,255,255,0.12)" }}
>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <MoveRight size={18} className="text-primary" />
            <h3 className="text-lg font-bold text-foreground">
              Mover {volquete.nombre}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Cancelar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Tipo de movimiento */}
          <div>
            <label className="block text-xs text-muted-foreground font-semibold mb-1.5">
              Tipo de Movimiento
            </label>
            <div className="flex gap-2">
              {tipoOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTipo(opt.value)}
                  className={`flex-1 text-xs py-2 px-3 rounded-md border transition-all font-medium ${
                    tipo === opt.value
                      ? "border-transparent"
                      : "border-border bg-secondary/50 text-muted-foreground"
                  }`}
                  style={
                    tipo === opt.value
                      ? {
                          background: opt.color + "25",
                          color: opt.color,
                          borderColor: opt.color + "40",
                        }
                      : {}
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="move-dir" className="block text-xs text-muted-foreground font-semibold mb-1.5">
              Nueva Direccion *
            </label>
            <input
              id="move-dir"
              type="text"
              placeholder="Av. Nueva Ubicacion 1234"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="move-lat" className="block text-xs text-muted-foreground font-semibold mb-1.5">
                Latitud
              </label>
              <input
                id="move-lat"
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm text-foreground font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                required
              />
            </div>
            <div>
              <label htmlFor="move-lng" className="block text-xs text-muted-foreground font-semibold mb-1.5">
                Longitud
              </label>
              <input
                id="move-lng"
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm text-foreground font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="move-nota" className="block text-xs text-muted-foreground font-semibold mb-1.5">
              Nota (opcional)
            </label>
            <textarea
              id="move-nota"
              rows={2}
              placeholder="Detalles del movimiento..."
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:opacity-90 transition-opacity"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Confirmar Movimiento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
