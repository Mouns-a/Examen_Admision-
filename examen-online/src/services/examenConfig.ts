import type { ExamenConfig } from "./modelos";

// DEMO: en producción esto viene de la tabla Examen, consultada por el backend
// según el examen asignado al aspirante (no fijo en el código del frontend).
const EXAMEN_ACTUAL: ExamenConfig = {
  id: 1,
  titulo: "Examen de admisión 2026",
  duracionMinutos: 180,
  totalPreguntas: 120,
};

export function obtenerExamenConfig(): ExamenConfig {
  return EXAMEN_ACTUAL;
}
