import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { pedirCamara, pedirPantalla } from "../services/fuentes";
import { iniciarGrabacion } from "../services/grabador";
import { useDeteccionRostro } from "../hooks/useDeteccionRostro";

export default function Verificacion() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camaraLista, setCamaraLista] = useState(false);
  const [pantallaLista, setPantallaLista] = useState(false);
  const [acepto, setAcepto] = useState(false);
  const [error, setError] = useState("");
  const { rostros, listo } = useDeteccionRostro(videoRef, camaraLista);

  async function activarCamara() {
    setError("");
    try {
      const stream = await pedirCamara();
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamaraLista(true);
    } catch {
      setError("No se pudo acceder a la cámara o micrófono. Revisa los permisos.");
    }
  }

  async function compartirPantalla() {
    setError("");
    try {
      const s = await pedirPantalla();
      s.getVideoTracks()[0].addEventListener("ended", () => setPantallaLista(false));
      setPantallaLista(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setError(
        msg.startsWith("Debes")
          ? msg
          : "No se pudo compartir la pantalla. Elige la opción 'Toda la pantalla'."
      );
    }
  }

  async function comenzar() {
    try {
      await document.documentElement.requestFullscreen();
      iniciarGrabacion("camara");
      iniciarGrabacion("pantalla");
      navigate("/examen");
    } catch {
      setError("No se pudo iniciar. Permite la pantalla completa y usa Chrome o Edge.");
    }
  }

  let estado = "Activa tu cámara para comenzar";
  if (camaraLista && !listo) estado = "Cargando detector de rostro...";
  else if (listo && rostros === 0) estado = "No se detecta tu rostro";
  else if (listo && rostros > 1) estado = "Se detecta más de una persona";
  else if (listo && rostros === 1) estado = "Rostro detectado ✓";

  const puedeComenzar = camaraLista && pantallaLista && acepto && listo && rostros === 1;

  return (
    <main className="verificacion">
      <h1>Verificación previa</h1>
      <video ref={videoRef} autoPlay muted playsInline />
      <p>{estado}</p>

      {!camaraLista && <button onClick={activarCamara}>Activar cámara y micrófono</button>}
      {camaraLista && !pantallaLista && (
        <button onClick={compartirPantalla}>Compartir pantalla completa</button>
      )}
      {pantallaLista && <p>Pantalla compartida ✓</p>}

      <label>
        <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} />{" "}
        Acepto que se grabe mi cámara, micrófono y pantalla durante el examen.
      </label>

      <button onClick={comenzar} disabled={!puedeComenzar}>
        Comenzar examen (pantalla completa)
      </button>

      {error && <p className="error">{error}</p>}
    </main>
  );
}
