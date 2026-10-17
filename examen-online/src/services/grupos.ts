// DEMO: en producción el backend asigna cada aspirante a un GruposSupervision
// real (supervisor_id, examen_id, capacidad_maxima) al iniciar sesión,
// llenando grupos de 25 en 25.
const CAPACIDAD = 25;

export function obtenerGrupoSupervision(aspiranteId: string): number {
  // Simulación: agrupa de forma estable según el ID del aspirante.
  let hash = 0;
  for (const c of aspiranteId) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return (hash % CAPACIDAD) + 1; // id de grupo de ejemplo (1..25)
}
