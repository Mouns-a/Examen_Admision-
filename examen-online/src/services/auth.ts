export interface Sesion {
  token: string;
  nombre: string;
}

// Cámbialo por el dominio de tu institución
const DOMINIO = "@universidad.edu.mx";

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Paso 1: correo + contraseña (simulado)
export async function iniciarSesion(correo: string, password: string) {
  await espera(600);
  if (!correo.endsWith(DOMINIO) || password.length < 6) {
    throw new Error("Correo institucional o contraseña incorrectos");
  }
}

// Paso 2: código de verificación (simulado: el código es 123456)
export async function verificarCodigo(correo: string, codigo: string): Promise<Sesion> {
  await espera(600);
  if (codigo !== "123456") throw new Error("Código incorrecto");
  const sesion: Sesion = { token: "token-demo", nombre: correo.split("@")[0] };
  sessionStorage.setItem("sesion", JSON.stringify(sesion));
  return sesion;
}
export function obtenerSesion(): Sesion | null {
  const s = sessionStorage.getItem("sesion");
  return s ? (JSON.parse(s) as Sesion) : null;
}