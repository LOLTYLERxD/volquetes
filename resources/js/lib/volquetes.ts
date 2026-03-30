export type MovimientoTipo = "colocacion" | "retiro" | "traslado";

export interface Movimiento {
  id: string;
  fecha: string;
  tipo: MovimientoTipo;
  direccion?: string;
  lat?: number;
  lng?: number;
  nota?: string;
}

export interface AlquilerActual {
  id: string;
  fechaColocacion?: string | null;
  fechaRetiro?: string | null;
  direccion?: string | null;
  cliente?: string | null;
  lat?: number;
  lng?: number;
  nota?: string | null;
}

export interface Volquete {
  id: string;
  nombre: string;

  lat: number;
  lng: number;
  direccion: string;
  cliente?: string | null;

  esPrivado?: boolean;
  movimientosTotal?: number;
  trasladosTotal?: number;
  reemplazosTotal?: number;
  dineroTotalArs?: number;

  colocado: boolean;

  fechaColocacion?: string | null;
  fechaRetiro?: string | null;

  alquilerActual?: AlquilerActual | null;

  movimientos: Movimiento[];
}

export function calcularDias(fechaColocacion?: string | null): number {
  if (!fechaColocacion) return 0;
  const inicio = new Date(fechaColocacion);
  const hoy = new Date();
  const diffMs = hoy.getTime() - inicio.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays < 0 ? 0 : diffDays;
}

export function estaVencido(fechaColocacion?: string | null, limiteDias: number = 7): boolean {
  if (!fechaColocacion) return false;
  return calcularDias(fechaColocacion) > limiteDias;
}