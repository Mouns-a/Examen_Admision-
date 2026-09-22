export interface Sesion {
  token: string;
  id: string;
  nombre: string;
}

interface Aspirante {
  id: string;
  nombre: string;
  fechaNacimiento: string; // AAAA-MM-DD
}

// DEMO: en producción esto viene de la base de datos de aspirantes,
// consultada y validada desde el backend (nunca desde el navegador).
// El código de verificación por correo se agrega también en el backend.
const ASPIRANTES: Aspirante[] = [
  { id: "A0001", nombre: "Ana Pérez López", fechaNacimiento: "2007-03-15" },
  { id: "A0002", nombre: "Luis Gómez Ruiz", fechaNacimiento: "2006-11-02" },
];

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));
const buscar = (id: string) => ASPIRANTES.find((a) => a.id === id.trim().toUpperCase());

export async function iniciarSesion(id: string, fechaNacimiento: string): Promise<Sesion> {
  await espera(600);
  const a = buscar(id);
  if (!a || a.fechaNacimiento !== fechaNacimiento) {
    throw new Error("ID o fecha de nacimiento incorrectos");
  }
  const sesion: Sesion = { token: "token-demo", id: a.id, nombre: a.nombre };
  sessionStorage.setItem("sesion", JSON.stringify(sesion));
  return sesion;
}

export function obtenerSesion(): Sesion | null {
  const s = sessionStorage.getItem("sesion");
  return s ? (JSON.parse(s) as Sesion) : null;
}
