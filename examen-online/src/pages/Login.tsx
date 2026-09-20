import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { iniciarSesion, verificarCodigo } from "../services/auth";

export default function Login() {
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState<"credenciales" | "codigo">("credenciales");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviarCredenciales(e: FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await iniciarSesion(correo, password);
      setEtapa("codigo");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCargando(false);
    }
  }

  async function enviarCodigo(e: FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await verificarCodigo(correo, codigo);
      navigate("/verificacion");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="login">
      <h1>Examen en línea</h1>

      {etapa === "credenciales" ? (
        <form onSubmit={enviarCredenciales}>
          <label>Correo institucional</label>
          <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
          <label>Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button disabled={cargando}>{cargando ? "Verificando..." : "Continuar"}</button>
        </form>
      ) : (
        <form onSubmit={enviarCodigo}>
          <p>Ingresa el código de 6 dígitos enviado a tu correo.</p>
          <input
            inputMode="numeric"
            maxLength={6}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            required
          />
          <button disabled={cargando}>{cargando ? "Verificando..." : "Entrar"}</button>
        </form>
      )}

      {error && <p className="error">{error}</p>}
    </main>
  );
}