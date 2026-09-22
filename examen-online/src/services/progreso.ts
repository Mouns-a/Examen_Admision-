import type { Pregunta } from "./examen";

export interface Progreso {
  examen: Pregunta[];
  respuestas: (number | null)[];
  marcadas: boolean[];
  actual: number;
  restante: number; // segundos
  infracciones: number;
}

const clave = (nombre: string) => `progreso_examen_${nombre}`;

export function guardarProgreso(nombre: string, p: Progreso) {
  try {
    localStorage.setItem(clave(nombre), JSON.stringify(p));
  } catch {
    /* almacenamiento lleno o no disponible */
  }
}

export function cargarProgreso(nombre: string): Progreso | null {
  try {
    const s = localStorage.getItem(clave(nombre));
    return s ? (JSON.parse(s) as Progreso) : null;
  } catch {
    return null;
  }
}

export function borrarProgreso(nombre: string) {
  localStorage.removeItem(clave(nombre));
}
