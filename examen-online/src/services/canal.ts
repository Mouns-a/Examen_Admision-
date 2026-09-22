import type { Evento } from "./eventos";

export type Estado = "en_examen" | "bloqueado" | "autorizado" | "cancelado" | "finalizado";
export type Decision = "reanudar" | "advertir" | "cancelar";

export interface MensajeEstado {
  tipo: "estado";
  alumnoId: string;
  nombre: string;
  estado: Estado;
  infracciones: number;
  respondidas: number;
  motivo: string;
  eventos: Evento[];
  miniatura?: string;
  t: string;
}

export interface MensajeDecision {
  tipo: "decision";
  alumnoId: string;
  decision: Decision;
}

export type Mensaje = MensajeEstado | MensajeDecision;

// Prototipo: BroadcastChannel comunica pestañas del mismo navegador.
// Con backend, solo se reemplaza este archivo por un WebSocket.
const canal = new BroadcastChannel("examen-inspector");

export function enviar(m: Mensaje) {
  canal.postMessage(m);
}

export function escuchar(fn: (m: Mensaje) => void) {
  const h = (e: MessageEvent<Mensaje>) => fn(e.data);
  canal.addEventListener("message", h);
  return () => canal.removeEventListener("message", h);
}
