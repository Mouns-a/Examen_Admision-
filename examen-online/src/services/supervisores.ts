import type { Supervisor } from "./modelos";

// DEMO: en producción se valida contra la tabla Supervisores desde el backend.
const SUPERVISORES: (Supervisor & { password: string })[] = [
  { id: 1, nombre: "Carla Ibarra", curp: "IBAC900101MDFRLR01", email: "carla@universidad.edu.mx", password: "inspector1" },
];

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function iniciarSesionSupervisor(email: string, password: string): Promise<Supervisor> {
  await espera(500);
  const s = SUPERVISORES.find((x) => x.email === email && x.password === password);
  if (!s) throw new Error("Correo o contraseña incorrectos");
  const { password: _p, ...datos } = s;
  sessionStorage.setItem("supervisor", JSON.stringify(datos));
  return datos;
}

export function obtenerSupervisor(): Supervisor | null {
  const s = sessionStorage.getItem("supervisor");
  return s ? (JSON.parse(s) as Supervisor) : null;
}

export function cerrarSesionSupervisor() {
  sessionStorage.removeItem("supervisor");
}
