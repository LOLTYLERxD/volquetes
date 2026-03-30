import { useState, useCallback, useEffect, useRef } from "react";
import { Plus, BarChart3, Truck, List, X, Bell, LogOut, ChevronDown } from "lucide-react";
import type { Volquete } from "@/lib/volquetes";
import {
  fetchVolquetes,
  createVolquete,
  deleteVolquete,
  colocarVolquete,
  trasladarVolquete,
  reemplazarVolquete,
  retirarVolquete,
} from "@/lib/api";

import VolqueteList from "@/components/volquete-list";
import VolqueteSidebar from "@/components/volquete-sidebar";
import StatsPanel from "@/components/stats-panel";
import AddVolqueteModal from "@/components/add-volquete-modal";
import VolqueteMap from "@/components/volquete-map";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { usePage, router } from "@inertiajs/react";

type MobileTab = "map" | "list" | "stats";
type RightPanel = "none" | "detail" | "stats";
type FilterStatus = "all" | "libres" | "colocados" | "vencidos";

export default function Home() {
  const { isJefe } = useAuth();
  const { auth } = usePage<{ auth: { user: { name: string; role: string } } }>().props;
  const user = auth?.user;

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const [volquetes, setVolquetes] = useState<Volquete[]>([]);
  const [selectedVolquete, setSelectedVolquete] = useState<Volquete | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanel>("none");

  const [isAddingMode, setIsAddingMode] = useState(false);
  const [addingCoords, setAddingCoords] = useState<{ lat: number; lng: number; direccion?: string } | null>(null);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);

  const [mobileTab, setMobileTab] = useState<MobileTab>("map");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [notifications, setNotifications] = useState<{ volquete: Volquete; dias: number }[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifRead, setNotifRead] = useState(false);
  const notifBtnRef = useRef<HTMLButtonElement>(null);
  const notifPanelRef = useRef<HTMLDivElement>(null);
  const vencidosNotifiedRef = useRef(false);

  const [statsMenuOpen, setStatsMenuOpen] = useState(false);
  const statsMenuRef = useRef<HTMLDivElement>(null);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close notif on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (!notifBtnRef.current?.contains(target) && !notifPanelRef.current?.contains(target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Close stats menu on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (statsMenuRef.current && !statsMenuRef.current.contains(e.target as Node)) setStatsMenuOpen(false);
    }
    if (statsMenuOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [statsMenuOpen]);

  // Close user menu on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    if (userMenuOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [userMenuOpen]);

  useEffect(() => {
    fetchVolquetes()
      .then((data) => {
        setVolquetes(data);
        if (vencidosNotifiedRef.current) return;
        vencidosNotifiedRef.current = true;
        const hoy = new Date();
        const vencidos = data.filter((v) => {
          if (!v.colocado || v.esPrivado === false || !v.fechaColocacion) return false;
          const dias = Math.floor((hoy.getTime() - new Date(v.fechaColocacion).getTime()) / 86400000);
          return dias >= 7;
        });
        if (!vencidos.length) return;
        setNotifications(
          vencidos.map((v) => ({
            volquete: v,
            dias: Math.floor((hoy.getTime() - new Date(v.fechaColocacion!).getTime()) / 86400000),
          }))
        );
      })
      .catch((e) => { console.error(e); setVolquetes([]); });
  }, []);

  useEffect(() => {
    if (mobileTab !== "map") setMobileDetailOpen(false);
  }, [mobileTab]);

  const handleSelectVolquete = useCallback((v: Volquete) => {
    setSelectedVolquete(v);
    setRightPanel("detail");
    setMobileDetailOpen(true);
    setMobileTab("map");
  }, []);

  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      if (!isAddingMode) return;
      setIsAddingMode(false);
      setMobileTab("map");
      setIsGeocodingAddress(true);
      setAddingCoords({ lat, lng, direccion: undefined });
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
          { headers: { "Accept-Language": "es" } }
        );
        const data = await res.json();
        const a = data.address ?? {};
        const road = a.road ?? a.pedestrian ?? a.footway ?? a.path ?? "";
        const number = a.house_number ? ` ${a.house_number}` : "";
        const city = a.city ?? a.town ?? a.village ?? a.municipality ?? "";
        const formatted = [road + number, city].filter(Boolean).join(", ") || data.display_name || "";
        setAddingCoords({ lat, lng, direccion: formatted });
      } catch {
        setAddingCoords({ lat, lng, direccion: "" });
      } finally {
        setIsGeocodingAddress(false);
      }
    },
    [isAddingMode]
  );

  const handleAddVolquete = useCallback(
    async (data: { nombre: string; direccion: string; cliente?: string; lat: number; lng: number }) => {
      const nombreNorm = data.nombre.trim().toLowerCase();
      const duplicado = volquetes.some((v) => v.nombre.trim().toLowerCase() === nombreNorm);
      if (duplicado) {
        toast({
          title: "⚠️ Nombre en uso",
          description: `Ya existe un volquete llamado "${data.nombre}". Usá un nombre distinto.`,
          variant: "destructive",
        });
        return;
      }
      const created = await createVolquete(data);
      toast({
        title: "🚛 Volquete agregado",
        description: `${created.nombre} fue registrado en ${created.direccion}`,
      });
      setVolquetes((prev) => [...prev, created]);
      setAddingCoords(null);
      setSelectedVolquete(created);
      setRightPanel("detail");
      setMobileDetailOpen(true);
      setMobileTab("map");
    }, [volquetes]
  );

  const handleDeleteVolquete = useCallback(
    async (id: string) => {
      const nombre = volquetes.find((v) => v.id === id)?.nombre ?? "Volquete";
      await deleteVolquete(id);
      toast({
        title: "🗑️ Volquete eliminado",
        description: `${nombre} fue eliminado permanentemente`,
        variant: "destructive",
      });
      setVolquetes((prev) => prev.filter((v) => v.id !== id));
      if (selectedVolquete?.id === id) {
        setSelectedVolquete(null);
        setRightPanel("none");
        setMobileDetailOpen(false);
      }
    }, [selectedVolquete, volquetes]
  );

  const handleColocar = useCallback(
    async (data: { direccion: string; lat: number; lng: number; cliente?: string; nota?: string }) => {
      if (!selectedVolquete) return;
      const payload = { direccion: data.direccion, lat: data.lat, lng: data.lng, cliente: data.cliente, nota: data.nota };
      const updated =
        selectedVolquete.esPrivado === false
          ? await trasladarVolquete(selectedVolquete.id, {
              direccion: payload.direccion, lat: payload.lat, lng: payload.lng,
              motivo: (data as any).motivo, nota: payload.nota,
            })
          : await colocarVolquete(selectedVolquete.id, payload);
      toast({
        title: selectedVolquete.esPrivado === false ? "✅ Volquete trasladado" : "✅ Alquiler iniciado",
        description: selectedVolquete.esPrivado === false
          ? `${updated.nombre} fue trasladado a ${updated.direccion}`
          : `${updated.nombre} colocado en ${updated.direccion}`,
      });
      setVolquetes((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      setSelectedVolquete(updated);
      setMobileDetailOpen(true);
      setMobileTab("map");
    }, [selectedVolquete]
  );

  const handleRetirar = useCallback(
    async (data: { nota?: string }) => {
      if (!selectedVolquete) return;
      const updated = await retirarVolquete(selectedVolquete.id, data);
      toast({
        title: "📦 Alquiler finalizado",
        description: `${updated.nombre} fue retirado y está libre nuevamente`,
      });
      setVolquetes((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      setSelectedVolquete(updated);
      setMobileDetailOpen(true);
      setMobileTab("map");
    }, [selectedVolquete]
  );

  const handleReemplazar = useCallback(
    async (data: { nota?: string }) => {
      if (!selectedVolquete) return;
      try {
        const updated = await reemplazarVolquete(selectedVolquete.id, {
          direccion: selectedVolquete.direccion, lat: selectedVolquete.lat,
          lng: selectedVolquete.lng, nota: data.nota,
        });
        toast({ title: "Volquete reemplazado", description: `Reemplazos totales: ${updated.reemplazosTotal ?? 0}` });
        setVolquetes((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
        setSelectedVolquete(updated);
        setMobileDetailOpen(true);
        setMobileTab("map");
      } catch (err: any) {
        toast({ title: "No se pudo reemplazar", description: err?.response?.data?.message ?? "Error del servidor", variant: "destructive" });
      }
    }, [selectedVolquete]
  );

  const toggleStats = useCallback(() => {
    if (rightPanel === "stats") { setRightPanel("none"); }
    else { setRightPanel("stats"); setSelectedVolquete(null); }
  }, [rightPanel]);

  const filteredVolquetes = volquetes.filter((v) => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      q.length === 0 ||
      v.nombre.toLowerCase().includes(q) ||
      (v.direccion || "").toLowerCase().includes(q) ||
      (v.cliente || "").toLowerCase().includes(q);
    let matchStatus = true;
    if (filterStatus === "libres") matchStatus = !v.colocado;
    if (filterStatus === "colocados") matchStatus = v.colocado;
    if (filterStatus === "vencidos") {
      if (!v.fechaColocacion) matchStatus = false;
      else matchStatus = Math.floor((new Date().getTime() - new Date(v.fechaColocacion).getTime()) / 86400000) > 7;
    }
    return matchSearch && matchStatus;
  });

  const stats = {
    total: volquetes.length,
    colocados: volquetes.filter((v) => v.colocado).length,
    libres: volquetes.filter((v) => !v.colocado).length,
  };

  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.matchMedia("(min-width: 768px)").matches : true
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column", background: "#0f1117", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500&display=swap');
        * { box-sizing: border-box; }
        .hdr-stat { display: flex; align-items: center; gap: 7px; padding: 5px 11px; background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; font-family: 'DM Sans', system-ui, sans-serif; }
        .hdr-stat-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .hdr-stat-val { font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 500; }
        .hdr-stat-label { font-size: 11px; color: #4a4f6a; font-weight: 500; }
        .hdr-sep { width: 1px; height: 20px; background: #1e2130; }
        .hdr-icon-btn { width: 34px; height: 34px; border-radius: 9px; background: #1a1d27; border: 1px solid #2a2d3a; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; flex-shrink: 0; }
        .hdr-icon-btn:hover { background: #1e2130; border-color: #3a3d50; }
        .hdr-icon-btn.active { background: #4f7cff18; border-color: #4f7cff40; }
        .hdr-add-btn { display: flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 9px; border: none; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', system-ui, sans-serif; white-space: nowrap; flex-shrink: 0; }
        .hdr-add-btn.default { background: #4f7cff; color: #fff; }
        .hdr-add-btn.default:hover { background: #6690ff; }
        .hdr-add-btn.cancel { background: #ff4f4f18; color: #ff6b6b; border: 1px solid #ff4f4f35 !important; }
        .hdr-add-btn.cancel:hover { background: #ff4f4f28; }
        .hdr-add-btn:active { transform: scale(0.97); }
        .mob-nav-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 6px 20px; border-radius: 9px; border: none; background: transparent; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', system-ui, sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.04em; color: #4a4f6a; text-transform: uppercase; }
        .mob-nav-btn.active { color: #7aa0ff; background: #4f7cff12; }
        .mob-nav-btn:hover:not(.active) { color: #9ba3c0; }
        .user-btn { display: flex; align-items: center; gap: 8px; padding: 4px 10px 4px 4px; border-radius: 10px; background: #1a1d27; border: 1px solid #2a2d3a; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', system-ui, sans-serif; }
        .user-btn:hover { background: #1e2232; border-color: #3a3d50; }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-6px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @media (min-width: 768px) { .md-hidden { display: none !important; } .desktop-only { display: flex !important; } }
        @media (max-width: 767px) { .desktop-only { display: none !important; } }
      `}</style>

      {/* ── Header ── */}
      <header style={{ height: 56, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", background: "#0a0d14", borderBottom: "1px solid #1e2130", zIndex: 99990, position: "relative", fontFamily: "'DM Sans', system-ui, sans-serif", gap: 12 }}>

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, #4f7cff22, #4f7cff44)", border: "1px solid #4f7cff40", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Truck size={15} color="#4f7cff" />
          </div>
          <div>
            <h1 style={{ fontSize: 13, fontWeight: 700, color: "#e8ecf8", margin: 0, lineHeight: 1.25, letterSpacing: "-0.01em" }}>
              TomasGardon<span style={{ color: "#4f7cff" }}>Volquetes</span>
            </h1>
            <p style={{ fontSize: 10, color: "#3d4260", margin: 0, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>Sistema de Gestión</p>
          </div>
        </div>

        {/* Quick stats (desktop) */}
        <div className="desktop-only" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div className="hdr-stat">
            <span className="hdr-stat-dot" style={{ background: "#4ade80", boxShadow: "0 0 5px #4ade8080" }} />
            <span className="hdr-stat-val" style={{ color: "#4ade80" }}>{stats.colocados}</span>
            <span className="hdr-stat-label">alquilados</span>
          </div>
          <div className="hdr-stat">
            <span className="hdr-stat-dot" style={{ background: "#9ba3c0" }} />
            <span className="hdr-stat-val" style={{ color: "#9ba3c0" }}>{stats.libres}</span>
            <span className="hdr-stat-label">libres</span>
          </div>
          <div className="hdr-sep" />
          <div className="hdr-stat">
            <span className="hdr-stat-val" style={{ color: "#e2e5f0" }}>{stats.total}</span>
            <span className="hdr-stat-label">total</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>

          {/* Stats inline panel */}
          <button className={`hdr-icon-btn desktop-only${rightPanel === "stats" ? " active" : ""}`} onClick={toggleStats} aria-label="Ver estadísticas" style={{ display: "flex" }} title="Estadísticas rápidas">
            <BarChart3 size={16} color={rightPanel === "stats" ? "#7aa0ff" : "#6b7290"} />
          </button>

          {/* Stats pages dropdown — jefe desktop only */}
          {isJefe && (
            <div ref={statsMenuRef} style={{ position: "relative" }} className="desktop-only">
              <button
                className={`hdr-icon-btn${statsMenuOpen ? " active" : ""}`}
                style={{ display: "flex" }}
                title="Panel de estadísticas"
                onClick={() => setStatsMenuOpen((o) => !o)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={statsMenuOpen ? "#7aa0ff" : "#6b7290"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
              </button>
              {statsMenuOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#0f1117", border: "1px solid #2a2d3a", borderRadius: 10, boxShadow: "0 16px 48px rgba(0,0,0,0.7)", zIndex: 9999, overflow: "hidden", minWidth: 190, animation: "dropIn 0.18s cubic-bezier(0.34,1.56,0.64,1)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid #1e2130" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#4a4f6a" }}>Panel de estadísticas</span>
                  </div>
                  <a href="/stats" style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", color: "#e2e5f0", textDecoration: "none", fontSize: 13, fontWeight: 600, borderBottom: "1px solid #1e2130" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1d27")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: "#4f7cff18", border: "1px solid #4f7cff30", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <BarChart3 size={13} color="#4f7cff" />
                    </div>
                    Privados
                  </a>
                  <a href="/stats/municipales" style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", color: "#e2e5f0", textDecoration: "none", fontSize: 13, fontWeight: 600 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1d27")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: "#f5c84218", border: "1px solid #f5c84230", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <BarChart3 size={13} color="#f5c842" />
                    </div>
                    Municipales
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Bell */}
          <button ref={notifBtnRef} className={`hdr-icon-btn${notifOpen ? " active" : ""}`} onClick={() => { setNotifOpen((o) => !o); setNotifRead(true); }} aria-label="Notificaciones" style={{ position: "relative" }}>
            <Bell size={16} color={notifOpen ? "#7aa0ff" : notifications.length > 0 ? "#ff6b6b" : "#6b7290"} />
            {notifications.length > 0 && !notifRead && (
              <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: "#ff6b6b", boxShadow: "0 0 6px #ff6b6b", border: "1.5px solid #0a0d14" }} />
            )}
          </button>

          {/* Agregar — solo jefe */}
          {isJefe && (
            <button className={`hdr-add-btn ${isAddingMode ? "cancel" : "default"}`} onClick={() => { setIsAddingMode(!isAddingMode); if (isAddingMode) setAddingCoords(null); else setMobileTab("map"); }}>
              {isAddingMode ? <X size={14} /> : <Plus size={14} />}
              <span className="desktop-only" style={{ display: "inline" }}>{isAddingMode ? "Cancelar" : "Agregar"}</span>
            </button>
          )}

          {/* User menu */}
          <div ref={userMenuRef} style={{ position: "relative", flexShrink: 0 }}>
            <button className="user-btn" onClick={() => setUserMenuOpen((o) => !o)}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, #4f7cff, #7aa0ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff", letterSpacing: "0.02em", flexShrink: 0 }}>
                {initials}
              </div>
              <div className="desktop-only" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#c8cedf", lineHeight: 1.2 }}>{user?.name ?? "Usuario"}</span>
                <span style={{ fontSize: 10, color: "#3d4870", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1.2 }}>{user?.role ?? ""}</span>
              </div>
              <ChevronDown size={12} color="#3d4870" style={{ marginLeft: 2 }} className="desktop-only" />
            </button>

            {userMenuOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, minWidth: 210, background: "#0f1117", border: "1px solid #2a2d3a", borderRadius: 12, boxShadow: "0 16px 48px rgba(0,0,0,0.7)", zIndex: 9999, overflow: "hidden", animation: "dropIn 0.18s cubic-bezier(0.34,1.56,0.64,1)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                {/* User info */}
                <div style={{ padding: "14px 14px 12px", borderBottom: "1px solid #1e2130" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #4f7cff, #7aa0ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e5f0" }}>{user?.name ?? "Usuario"}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 5px #4ade8080", display: "inline-block" }} />
                        <span style={{ fontSize: 10, color: "#4a5270", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{user?.role ?? ""} · activo</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Logout */}
                <button
                  onClick={() => { setUserMenuOpen(false); router.post("/logout"); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "transparent", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#ff6b6b", fontFamily: "'DM Sans', system-ui, sans-serif", textAlign: "left" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#ff4f4f12")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <LogOut size={14} />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        <aside className="desktop-only" style={{ width: 300, flexShrink: 0, borderRight: "1px solid #1e2130", background: "#0c0e16", display: "flex", flexDirection: "column", position: "relative", zIndex: 5 }}>
          <VolqueteList volquetes={filteredVolquetes} selectedId={selectedVolquete?.id ?? null} onSelect={handleSelectVolquete} filterStatus={filterStatus} onFilterChange={setFilterStatus} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        </aside>

        {!isDesktop && mobileTab === "list" && (
          <div style={{ position: "fixed", top: 56, left: 0, right: 0, bottom: 56, zIndex: 9998, background: "#0f1117f5", backdropFilter: "blur(6px)" }}>
            <VolqueteList volquetes={filteredVolquetes} selectedId={selectedVolquete?.id ?? null} onSelect={(v) => { handleSelectVolquete(v); setMobileTab("map"); }} filterStatus={filterStatus} onFilterChange={setFilterStatus} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          </div>
        )}

        {!isDesktop && mobileTab === "stats" && (
          <div style={{ position: "fixed", top: 56, left: 0, right: 0, bottom: 56, zIndex: 9998, background: "#0f1117f5", backdropFilter: "blur(6px)", overflow: "hidden" }}>
            <StatsPanel volquetes={volquetes} onClose={() => setMobileTab("map")} />
          </div>
        )}

        <main style={{ flex: 1, position: "relative", zIndex: 1, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
            <VolqueteMap
              volquetes={filteredVolquetes}
              statsVolquetes={volquetes}
              selectedVolquete={selectedVolquete}
              onSelectVolquete={handleSelectVolquete}
              onMapClick={handleMapClick}
              isAddingMode={isAddingMode}
            />
          </div>
        </main>

        {rightPanel !== "none" && (
          <aside className="desktop-only" style={{ width: 340, flexShrink: 0, borderLeft: "1px solid #1e2130", background: "#0c0e16", display: "flex", flexDirection: "column", position: "relative", zIndex: 5 }}>
            {rightPanel === "detail" && selectedVolquete && (
              <VolqueteSidebar volquete={selectedVolquete} onClose={() => setRightPanel("none")} onDelete={() => handleDeleteVolquete(selectedVolquete.id)} onColocar={handleColocar} onRetirar={handleRetirar} onReemplazar={handleReemplazar} />
            )}
            {rightPanel === "stats" && <StatsPanel volquetes={volquetes} onClose={() => setRightPanel("none")} />}
          </aside>
        )}

        {!isDesktop && mobileDetailOpen && selectedVolquete && (
          <div style={{ position: "fixed", top: 56, left: 0, right: 0, bottom: 56, zIndex: 9999, background: "#0f1117f5", backdropFilter: "blur(6px)", overflow: "hidden" }}>
            <VolqueteSidebar volquete={selectedVolquete} onClose={() => setMobileDetailOpen(false)} onDelete={() => handleDeleteVolquete(selectedVolquete.id)} onColocar={handleColocar} onRetirar={handleRetirar} onReemplazar={handleReemplazar} />
          </div>
        )}

        {addingCoords && (
          <AddVolqueteModal lat={addingCoords.lat} lng={addingCoords.lng} direccionInicial={addingCoords.direccion} isLoadingDireccion={isGeocodingAddress} onConfirm={handleAddVolquete} onCancel={() => { setAddingCoords(null); setIsGeocodingAddress(false); }} />
        )}
      </div>

      {/* ── Mobile bottom nav ── */}
      <div style={{ height: 56, flexShrink: 0, borderTop: "1px solid #1e2130", background: "#0a0d14", display: "flex", alignItems: "center", justifyContent: "space-around", position: "relative", zIndex: 10000 }} className="md-hidden">
        {(["map", "list", "stats"] as MobileTab[]).map((tab) => {
          const labels: Record<MobileTab, string> = { map: "Mapa", list: "Lista", stats: "Stats" };
          const icons: Record<MobileTab, React.ReactNode> = {
            map: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>,
            list: <List size={16} />,
            stats: <BarChart3 size={16} />,
          };
          return (
            <button key={tab} className={`mob-nav-btn${mobileTab === tab ? " active" : ""}`} onClick={() => setMobileTab(tab)}>
              {icons[tab]}{labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Notification dropdown */}
      {notifOpen && (
        <div ref={notifPanelRef} style={{
          position: "fixed",
          top: (() => { const r = notifBtnRef.current?.getBoundingClientRect(); return r ? r.bottom + 8 : 64; })(),
          ...(window.innerWidth < 640
            ? { left: "50%", transform: "translateX(-50%)", right: "auto" }
            : { right: (() => { const r = notifBtnRef.current?.getBoundingClientRect(); return r ? window.innerWidth - r.right : 8; })() }
          ),
          width: Math.min(300, window.innerWidth - 24),
          background: "#0f1117", border: "1px solid #2a2d3a", borderRadius: 12,
          boxShadow: "0 16px 48px rgba(0,0,0,0.85)", zIndex: 99999, overflow: "hidden", isolation: "isolate",
          animation: "dropIn 0.18s cubic-bezier(0.34,1.56,0.64,1)",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px 10px", borderBottom: "1px solid #1e2130" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Bell size={13} color="#ff6b6b" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e5f0" }}>Notificaciones</span>
            </div>
            {notifications.length > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: "#ff6b6b18", border: "1px solid #ff6b6b30", color: "#ff6b6b" }}>
                {notifications.length} vencido{notifications.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div style={{ maxHeight: 320, overflowY: "auto", padding: "6px 0" }}>
            {notifications.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "24px 16px" }}>
                <Bell size={22} color="#2a2d3a" />
                <span style={{ fontSize: 12, color: "#3d4260" }}>Sin notificaciones</span>
              </div>
            ) : (
              notifications.map(({ volquete: v, dias }) => (
                <button key={v.id} onClick={() => { handleSelectVolquete(v); setNotifOpen(false); }}
                  style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "transparent", border: "none", borderBottom: "1px solid #1a1d27", cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start", fontFamily: "'DM Sans', system-ui, sans-serif" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1d27")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: "#ff6b6b15", border: "1px solid #ff6b6b30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🚛</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e5f0" }}>{v.nombre}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "#ff6b6b18", border: "1px solid #ff6b6b30", color: "#ff6b6b", whiteSpace: "nowrap" }}>{dias}d vencido</span>
                    </div>
                    {v.direccion && <div style={{ fontSize: 11, color: "#4a4f6a", display: "flex", gap: 4 }}><span>📍</span><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.direccion}</span></div>}
                    {v.cliente && <div style={{ fontSize: 11, color: "#4a4f6a", display: "flex", gap: 4, marginTop: 1 }}><span>👤</span><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.cliente}</span></div>}
                  </div>
                  <span style={{ color: "#2a2d3a", fontSize: 14, marginTop: 6, flexShrink: 0 }}>→</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}