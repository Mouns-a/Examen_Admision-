import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { iniciarSesion } from "../services/auth";
import { iniciarSesionSupervisor } from "../services/supervisores";

const MAX_INTENTOS = 5;
const BLOQUEO_MS = 60000;

export default function Login() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState(""); // fecha de nacimiento (aspirante) o contraseña (supervisor)
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [intentos, setIntentos] = useState(0);
  const [bloqueadoHasta, setBloqueadoHasta] = useState(0);

  const esCorreo = usuario.includes("@");
  const bloqueado = () => Date.now() < bloqueadoHasta;

  function registrarFallo(mensaje: string) {
    const n = intentos + 1;
    if (n >= MAX_INTENTOS) {
      setIntentos(0);
      setBloqueadoHasta(Date.now() + BLOQUEO_MS);
      setError("Demasiados intentos. Espera un minuto para volver a intentar.");
    } else {
      setIntentos(n);
      setError(mensaje);
    }
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (bloqueado()) {
      setError("Espera un momento antes de volver a intentar.");
      return;
    }
    setError("");
    setCargando(true);
    try {
      if (usuario.includes("@")) {
        await iniciarSesionSupervisor(usuario, clave);
        navigate("/inspector");
      } else {
        await iniciarSesion(usuario, clave);
        navigate("/prueba-equipo");
      }
    } catch (err) {
      registrarFallo((err as Error).message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="login">
      <h1>Examen en línea</h1>
      <form onSubmit={enviar}>
        <label>ID de aspirante o correo de supervisor</label>
        <input value={usuario} onChange={(e) => setUsuario(e.target.value)} required />
        <label>{esCorreo ? "Contraseña" : "Fecha de nacimiento"}</label>
        <input
          type={esCorreo ? "password" : "date"}
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          required
        />
        <button disabled={cargando}>{cargando ? "Verificando..." : "Continuar"}</button>
      </form>
      {error && <p className="error">{error}</p>}
    </main>
  );
}
