import axios from "axios";
import type { Volquete } from "@/lib/volquetes";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "X-Requested-With": "XMLHttpRequest",
  },
  withCredentials: true,
});

export async function fetchVolquetes(): Promise<Volquete[]> {
  const res = await api.get("/volquetes");
  return res.data.map((v: any) => ({ ...v, id: String(v.id) }));
}

export async function fetchDineroResumen(params?: { desde?: string; hasta?: string }) {
  const q = new URLSearchParams();
  if (params?.desde) q.set("desde", params.desde);
  if (params?.hasta) q.set("hasta", params.hasta);
  const res = await api.get(`/dinero/resumen?${q.toString()}`);
  return res.data;
}

export async function createVolquete(data: {
  nombre: string;
  direccion: string;
  cliente?: string;
  lat: number;
  lng: number;
  esPrivado?: boolean;
}): Promise<Volquete> {
  const res = await api.post("/volquetes", data);
  return { ...res.data, id: String(res.data.id) };
}

export async function deleteVolquete(id: string): Promise<void> {
  await api.delete(`/volquetes/${id}`);
}

export async function colocarVolquete(
  id: string,
  data: {
    direccion: string;
    lat: number;
    lng: number;
    cliente?: string;
    nota?: string;
  }
): Promise<Volquete> {
  const res = await api.post(`/volquetes/${id}/colocar`, data);
  return { ...res.data, id: String(res.data.id) };
}

export async function retirarVolquete(
  id: string,
  data?: { nota?: string }
): Promise<Volquete> {
  const res = await api.post(`/volquetes/${id}/retirar`, data ?? {});
  return { ...res.data, id: String(res.data.id) };
}

export async function trasladarVolquete(
  id: string,
  data: {
    direccion: string;
    lat: number;
    lng: number;
    motivo?: string;
    nota?: string;
  }
): Promise<Volquete> {
  const res = await api.post(`/volquetes/${id}/trasladar`, data);
  return { ...res.data, id: String(res.data.id) };
}

export async function fetchMovimientos(id: string): Promise<any[]> {
  const res = await api.get(`/volquetes/${id}/movimientos`);
  return res.data;
}

export async function fetchVolqueteStats(id: string): Promise<any> {
  const res = await api.get(`/volquetes/${id}/stats`);
  return res.data;
}

export async function fetchAlquileres(id: string): Promise<any[]> {
  const res = await api.get(`/volquetes/${id}/alquileres`);
  return res.data;
}

export async function reemplazarVolquete(
  id: string,
  data: {
    direccion?: string;
    lat?: number;
    lng?: number;
    nota?: string;
  }
): Promise<Volquete> {
  const res = await api.post(`/volquetes/${id}/reemplazar`, data);
  return { ...res.data, id: String(res.data.id) };
}
export async function fetchVolquete(id: string): Promise<Volquete> {
  const res = await api.get(`/volquetes/${id}`);
  return { ...res.data, id: String(res.data.id) };
}
export async function actualizarNota(
  id: string,
  nota: string
): Promise<Volquete> {
  const res = await api.patch(`/volquetes/${id}/nota`, { nota });
  return { ...res.data, id: String(res.data.id) };
}
export async function fetchPrecioVolquete(): Promise<number> {
  const res = await api.get("/config/precio-volquete");
  return Number(res.data?.valor ?? 0);
}

export async function updatePrecioVolquete(valor: number): Promise<void> {
  await api.put("/config/precio-volquete", { valor });
}