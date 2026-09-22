import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { detectarNavegador, detectarPantalla, medirVelocidad } from "../services/equipo";
import type { ResultadoVelocidad } from "../services/equipo";

type Resultado = "pendiente" | "ok" | "error";

export default function PruebaEquipo() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const analizadorRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [camara, setCamara] = useState<Resultado>("pendiente");
  const [microfono, setMicrofono] = useState<Resultado>("pendiente");
  const [nivelAudio, setNivelAudio] = useState(0);
  const [altavocesOk, setAltavocesOk] = useState<Resultado>("pendiente");
  const [velocidad, setVelocidad] = useState<ResultadoVelocidad | null>(null);
  const [midiendoVelocidad, setMidiendoVelocidad] = useState(false);
  const [error, setError] = useState("");

  const nav = detectarNavegador();
  const pantalla = detectarPantalla();

  function detenerTodo() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
  }

  // Cierra la cámara/micrófono de esta prueba si el aspirante navega a otra página
  useEffect(() => detenerTodo, []);

  async function probarCamaraYMicrofono() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamara("ok");

      const ctx = new AudioContext();
      const fuente = ctx.createMediaStreamSource(stream);
      const analizador = ctx.createAnalyser();
      analizador.fftSize = 512;
      fuente.connect(analizador);
      audioCtxRef.current = ctx;
      analizadorRef.current = analizador;

      const datos = new Uint8Array(analizador.frequencyBinCount);
      const medir = () => {
        if (!streamRef.current) return; // se detuvo la prueba, deja de medir
        analizador.getByteFrequencyData(datos);
        const promedio = datos.reduce((a, b) => a + b, 0) / datos.length;
        setNivelAudio(promedio);
        if (promedio > 8) setMicrofono("ok");
        requestAnimationFrame(medir);
      };
      medir();
    } catch {
      setCamara("error");
      setMicrofono("error");
      setError("No se pudo acceder a la cámara o al micrófono. Revisa los permisos del navegador.");
    }
  }

  function probarAltavoces() {
    const ctx = audioCtxRef.current ?? new AudioContext();
    const osc = ctx.createOscillator();
    osc.frequency.value = 440;
    osc.connect(ctx.destination);
    osc.start();
    setTimeout(() => osc.stop(), 800);
  }

  async function probarVelocidad() {
    setMidiendoVelocidad(true);
    setError("");
    try {
      setVelocidad(await medirVelocidad());
    } catch {
      setError("No se pudo medir la velocidad de internet. Revisa tu conexión.");
    } finally {
      setMidiendoVelocidad(false);
    }
  }

  function continuar() {
    detenerTodo(); // apaga la cámara de esta prueba antes de ir a la verificación real
    navigate("/verificacion");
  }

  const internetOk = true; // medición solo informativa en este prototipo
  const todoListo =
    camara === "ok" &&
    microfono === "ok" &&
    altavocesOk === "ok" &&
    internetOk &&
    !pantalla.posiblesVarias &&
    nav.compatible;

  const icono = (r: Resultado | boolean) =>
    r === "ok" || r === true ? "✓" : r === "error" || r === false ? "✗" : "…";

  return (
    <main className="prueba-equipo">
      <h1>Prueba de equipo</h1>
      <p>Revisa esto antes del día del examen. Necesitas Windows 10+ o macOS 14+, con Chrome o Edge.</p>

      <section>
        <h2>1. Cámara y micrófono</h2>
        <video ref={videoRef} autoPlay muted playsInline />
        {camara === "pendiente" && <button onClick={probarCamaraYMicrofono}>Probar cámara y micrófono</button>}
        <p>{icono(camara)} Cámara {camara === "ok" ? "funcionando" : camara === "error" ? "no disponible" : "sin probar"}</p>
        <p>
          {icono(microfono)} Micrófono{" "}
          {microfono === "ok" ? "funcionando" : microfono === "error" ? "no disponible" : "habla para detectarlo"}
        </p>
        {camara === "ok" && (
          <div className="medidor"><div style={{ width: `${Math.min(100, nivelAudio * 2)}%` }} /></div>
        )}
      </section>

      <section>
        <h2>2. Altavoces</h2>
        <button onClick={probarAltavoces} disabled={camara !== "ok"}>Reproducir sonido de prueba</button>
        <p>¿Escuchaste el tono?</p>
        <button onClick={() => setAltavocesOk("ok")}>Sí</button>
        <button onClick={() => setAltavocesOk("error")}>No</button>
        <p>{icono(altavocesOk)} Altavoces {altavocesOk === "ok" ? "confirmados" : altavocesOk === "error" ? "revisa el dispositivo de salida" : "sin confirmar"}</p>
      </section>

      <section>
        <h2>3. Internet</h2>
        <button onClick={probarVelocidad} disabled={midiendoVelocidad}>
          {midiendoVelocidad ? "Midiendo..." : "Probar velocidad"}
        </button>
        {velocidad && (
          <p>
            ✓ Bajada: {velocidad.bajadaMbps.toFixed(1)} Mbps · Subida: {velocidad.subidaMbps.toFixed(1)} Mbps
            {velocidad.estimado && " · estimado"}
          </p>
        )}
      </section>

      <section>
        <h2>4. Pantalla</h2>
        <p>
          {icono(!pantalla.posiblesVarias)} Resolución {pantalla.ancho}×{pantalla.alto}
          {pantalla.posiblesVarias && " — parece haber más de un monitor; se permite solo uno"}
        </p>
      </section>

      <section>
        <h2>5. Navegador</h2>
        <p>
          {icono(nav.compatible)} {nav.navegador}
          {nav.esMovil && " (dispositivo móvil, no permitido)"}
          {!nav.compatible && !nav.esMovil && " (usa Chrome o Edge)"}
        </p>
      </section>

      {error && <p className="error">{error}</p>}

      <button className="final" disabled={!todoListo} onClick={continuar}>
        {todoListo ? "Continuar al examen" : "Completa todas las pruebas para continuar"}
      </button>
    </main>
  );
}
