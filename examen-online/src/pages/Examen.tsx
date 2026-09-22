import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { generarExamen } from "../services/examen";
import { detenerStream, obtenerStream, obtenerPantalla } from "../services/media";
import { cargarProgreso, guardarProgreso, borrarProgreso } from "../services/progreso";
import { registrarEvento, obtenerEventos } from "../services/eventos";
import { obtenerSesion } from "../services/auth";
import { enviar, escuchar } from "../services/canal";
import type { Estado } from "../services/canal";
import { pedirCamara, pedirPantalla } from "../services/fuentes";
import { iniciarGrabacion, detenerGrabacion } from "../services/grabador";
import { useVigilancia } from "../hooks/useVigilancia";
import { useReloj } from "../hooks/useReloj";
import { useMiniatura } from "../hooks/useMiniatura";

const TOTAL = 120;
const DURACION = 3 * 3600; // segundos

const formato = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return [h, m, s % 60].map((n) => String(n).padStart(2, "0")).join(":");
};

function ExamenPantalla() {
  const navigate = useNavigate();
  const nombre = obtenerSesion()?.nombre ?? "alumno";
  const [guardado] = useState(() => cargarProgreso(nombre));
  const [examen] = useState(() => guardado?.examen ?? generarExamen(TOTAL));
  const [actual, setActual] = useState(guardado?.actual ?? 0);
  const [respuestas, setRespuestas] = useState<(number | null)[]>(
    () => guardado?.respuestas ?? Array(TOTAL).fill(null)
  );
  const [marcadas, setMarcadas] = useState<boolean[]>(
    () => guardado?.marcadas ?? Array(TOTAL).fill(false)
  );
  // Si se recargó la página, el examen queda bloqueado hasta que el inspector decida
  const [estado, setEstado] = useState<Estado>(guardado ? "bloqueado" : "en_examen");
  const [infracciones, setInfracciones] = useState(guardado ? guardado.infracciones + 1 : 0);
  const [motivo, setMotivo] = useState(guardado ? "recarga_de_pagina" : "");
  const [aviso, setAviso] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [fuentes, setFuentes] = useState(0);
  const terminado = useRef(false);
  const ultima = useRef(0);
  const miniatura = useRef("");

  const sinResponder = respuestas.filter((r) => r === null).length;
  const respondidas = TOTAL - sinResponder;

  // Referencias con los valores más recientes (para timers y listeners)
  const respRef = useRef(respuestas);
  const info = useRef({ estado, infracciones, motivo, respondidas });
  useEffect(() => {
    respRef.current = respuestas;
    info.current = { estado, infracciones, motivo, respondidas };
  });

  function notificar(estadoForzado?: Estado) {
    enviar({
      tipo: "estado",
      alumnoId: nombre,
      nombre,
      ...info.current,
      estado: estadoForzado ?? info.current.estado,
      eventos: obtenerEventos().slice(-10),
      miniatura: miniatura.current,
      t: new Date().toISOString(),
    });
  }

    useMiniatura(
    !terminado.current,
    (foto) => {
      miniatura.current = foto;
      notificar();
    },
    fuentes
  );

  function finalizar(cancelado: boolean) {
    if (terminado.current) return;
    terminado.current = true;
     detenerGrabacion();
    detenerStream();
    borrarProgreso(nombre);
    const finales = respRef.current;
    const aciertos = examen.filter((p, i) => finales[i] === p.correcta).length;
    sessionStorage.setItem(
      "resultado",
      JSON.stringify({ aciertos, total: examen.length, cancelado })
    );
    notificar(cancelado ? "cancelado" : "finalizado");
    detenerGrabacion();
    detenerStream();
    if (document.fullscreenElement) document.exitFullscreen();
    navigate("/finalizado");
  }
  const finalizarRef = useRef(finalizar);
  useEffect(() => {
    finalizarRef.current = finalizar;
  });

  // Avisa al inspector cada vez que cambia el estado...
  useEffect(() => {
    notificar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, infracciones]);

  // ...y cada 3 segundos como señal de que el alumno sigue conectado
  useEffect(() => {
    const id = setInterval(() => notificar(), 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Decisiones del inspector
  useEffect(() => {
    return escuchar((m) => {
      if (m.tipo !== "decision" || m.alumnoId !== nombre || terminado.current) return;
      if (m.decision === "cancelar") {
        registrarEvento("cancelado_por_inspector");
        finalizarRef.current(true);
      } else {
        registrarEvento("autorizado_por_inspector_" + m.decision);
        setAviso(
          m.decision === "advertir"
            ? "El inspector te hizo una advertencia. Otra salida del examen puede cancelarlo."
            : ""
        );
        setEstado("autorizado");
      }
    });
  }, [nombre]);

  // El reloj se pausa mientras el examen está bloqueado o esperando
  const restante = useReloj(guardado ? guardado.restante : DURACION, estado !== "en_examen", () =>
    finalizar(false)
  );

  useEffect(() => {
    if (guardado) registrarEvento("recarga_de_pagina");
  }, [guardado]);

  // Guarda el progreso para poder recuperarlo si se recarga la página
  useEffect(() => {
    if (terminado.current) return;
    guardarProgreso(nombre, { examen, respuestas, marcadas, actual, restante, infracciones });
  }, [nombre, examen, respuestas, marcadas, actual, restante, infracciones]);

  function bloquear(m: string) {
    if (terminado.current || info.current.estado !== "en_examen") return;
    const ahora = Date.now();
    if (ahora - ultima.current < 1500) return; // evita contar doble un mismo evento
    ultima.current = ahora;
    setInfracciones((n) => n + 1);
    setMotivo(m);
    setEstado("bloqueado");
  }
  const bloquearRef = useRef(bloquear);
  useEffect(() => {
    bloquearRef.current = bloquear;
  });

  useVigilancia(true, bloquear);

  // Si se apaga la cámara o se deja de compartir pantalla, el examen se bloquea
  useEffect(() => {
    const quitar: (() => void)[] = [];
    const vigilar = (s: MediaStream | null, m: string) =>
      s?.getTracks().forEach((t) => {
        const h = () => {
          registrarEvento(m);
          bloquearRef.current(m);
        };
        t.addEventListener("ended", h);
        quitar.push(() => t.removeEventListener("ended", h));
      });
    vigilar(obtenerStream(), "camara_apagada");
    vigilar(obtenerPantalla(), "pantalla_no_compartida");
    return () => quitar.forEach((f) => f());
  }, [fuentes]);

  async function reanudarExamen() {
    try {
      await document.documentElement.requestFullscreen();
      // Si se apagó la cámara o se dejó de compartir pantalla, se piden de nuevo
      if (obtenerStream()?.getTracks().some((t) => t.readyState === "ended")) {
        await pedirCamara();
        iniciarGrabacion("camara");
      }
      if (obtenerPantalla()?.getTracks().some((t) => t.readyState === "ended")) {
        await pedirPantalla();
        iniciarGrabacion("pantalla");
      }
      setFuentes((n) => n + 1);
      registrarEvento("examen_reanudado");
      setAviso("");
      setEstado("en_examen");
    } catch {
      setAviso("No se pudo reanudar. Permite la pantalla completa, la cámara y comparte toda la pantalla.");
    }
  }

  const responder = (i: number) =>
    setRespuestas((r) => r.map((v, k) => (k === actual ? i : v)));
  const alternarMarca = () =>
    setMarcadas((m) => m.map((v, k) => (k === actual ? !v : v)));
  const p = examen[actual];

  return (
    <div className="examen-layout">
      <main className="examen">
        <header>
          <span>Pregunta {actual + 1} de {examen.length}</span>
          <span className={restante <= 600 ? "urgente" : ""}>⏱ {formato(restante)}</span>
        </header>

        <h2>{marcadas[actual] && "🚩 "}{p.enunciado}</h2>

        <div className="opciones">
          {p.opciones.map((op, i) => (
            <label key={i} className={respuestas[actual] === i ? "activa" : ""}>
              <input
                type="radio"
                name="opcion"
                checked={respuestas[actual] === i}
                onChange={() => responder(i)}
              />
              {op}
            </label>
          ))}
        </div>

        <div className="botones">
          <button onClick={() => setActual(actual - 1)} disabled={actual === 0}>
            ← Anterior
          </button>
          <button onClick={alternarMarca}>
            {marcadas[actual] ? "Quitar marca" : "Marcar para revisar"}
          </button>
          <button onClick={() => setActual(actual + 1)} disabled={actual === examen.length - 1}>
            Siguiente →
          </button>
        </div>
      </main>

      <aside className="panel">
        <p>Respondidas: {respondidas} / {TOTAL}</p>
        <div className="cuadricula">
          {examen.map((_, i) => (
            <button
              key={i}
              onClick={() => setActual(i)}
              className={[
                i === actual ? "actual" : "",
                respuestas[i] !== null ? "resp" : "",
                marcadas[i] ? "marca" : "",
              ].join(" ")}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <button className="final" onClick={() => setConfirmando(true)}>
          Finalizar examen
        </button>
      </aside>

      {confirmando && (
        <div className="overlay">
          <div className="overlay-caja">
            <h2>¿Enviar el examen?</h2>
            <p>
              {sinResponder > 0
                ? `Te faltan ${sinResponder} preguntas sin responder.`
                : "Respondiste todas las preguntas."}{" "}
              Después de enviar no podrás cambiar nada.
            </p>
            <button onClick={() => finalizar(false)}>Sí, enviar</button>
            <button onClick={() => setConfirmando(false)}>Seguir revisando</button>
          </div>
        </div>
      )}

      {estado !== "en_examen" && (
        <div className="overlay">
          <div className="overlay-caja">
            {estado === "bloqueado" ? (
              <>
                <h2>⏸ Examen bloqueado</h2>
                <p>
                  Saliste del examen. Tu tiempo está en pausa. Espera a que el inspector revise tu
                  caso y no cierres esta ventana.
                </p>
              </>
            ) : (
              <>
                <h2>Puedes continuar</h2>
                <p>{aviso || "El inspector autorizó que continúes."}</p>
                <button onClick={reanudarExamen}>Volver al examen</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Examen() {
  // Sin cámara y pantalla activas (por ejemplo, tras recargar) hay que verificar de nuevo
  if (!obtenerStream() || !obtenerPantalla()) return <Navigate to="/verificacion" replace />;
  return <ExamenPantalla />;
}