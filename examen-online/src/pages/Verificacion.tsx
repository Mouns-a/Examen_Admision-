import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { guardarStream } from "../services/media";
import { useDeteccionRostro } from "../hooks/useDeteccionRostro";

export default function Verificacion() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camaraLista, setCamaraLista] = useState(false);
  const [error, setError] = useState("");
  const { rostros, listo } = useDeteccionRostro(videoRef, camaraLista);

  async function activarCamara() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      guardarStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamaraLista(true);
    } catch {
      setError("No se pudo acceder a la cámara o micrófono. Revisa los permisos.");
    }
  }

  async function comenzar() {
    try {
      await document.documentElement.requestFullscreen();
      navigate("/examen");
    } catch {
      setError("Debes permitir la pantalla completa para continuar.");
    }
  }

  let estado = "Activa tu cámara para comenzar";
  if (camaraLista && !listo) estado = "Cargando detector de rostro...";
  else if (listo && rostros === 0) estado = "No se detecta tu rostro";
  else if (listo && rostros > 1) estado = "Se detecta más de una persona";
  else if (listo && rostros === 1) estado = "Rostro detectado ✓";

  const puedeComenzar = camaraLista && listo && rostros === 1;

  return (
    <main className="verificacion">
      <h1>Verificación previa</h1>
      <video ref={videoRef} autoPlay muted playsInline />
      <p>{estado}</p>

      {!camaraLista && <button onClick={activarCamara}>Activar cámara y micrófono</button>}
      <button onClick={comenzar} disabled={!puedeComenzar}>
        Comenzar examen (pantalla completa)
      </button>

      {error && <p className="error">{error}</p>}
    </main>
  );
}
