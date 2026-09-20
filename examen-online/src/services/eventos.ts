export interface Evento {
  tipo: string;
  t: string; // fecha y hora ISO
}

const eventos: Evento[] = [];

export function registrarEvento(tipo: string) {
  eventos.push({ tipo, t: new Date().toISOString() });
  sessionStorage.setItem("eventos", JSON.stringify(eventos));
}

export const obtenerEventos = () => eventos;
