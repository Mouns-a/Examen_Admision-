import { useEffect, useState } from "react";
import { enviar, escuchar } from "../services/canal";
import type { Decision, Estado, MensajeEstado } from "../services/canal";

interface Alumno extends MensajeEstado {
  visto: number;
  simulado?: boolean;
}

const GRUPO = 25;

const ORDEN: Record<Estado, number> = {
  bloqueado: 0,
  autorizado: 1,
  en_examen: 2,
  cancelado: 3,
  finalizado: 4,
};

const ETIQUETA: Record<Estado, string> = {
  bloqueado: "🔴 Bloqueado",
  autorizado: "🟠 Autorizado",
  en_examen: "🟢 En examen",
  cancelado: "⚫ Cancelado",
  finalizado: "⚪ Finalizó",
};

function simular(): Record<string, Alumno> {
  const estados: Estado[] = ["en_examen", "en_examen", "en_examen", "en_examen", "bloqueado", "autorizado"];
  const out: Record<string, Alumno> = {};
  for (let i = 1; i <= GRUPO; i++) {
    const id = `aspirante${String(i).padStart(2, "0")}`;
    const estado = estados[Math.floor(Math.random() * estados.length)];
    out[id] = {
      tipo: "estado",
      alumnoId: id,
      nombre: id,
      estado,
      infracciones: estado === "bloqueado" ? 1 : 0,
      respondidas: Math.floor(Math.random() * 120),
      motivo: estado === "bloqueado" ? "cambio_de_pestana" : "",
      eventos: estado === "bloqueado" ? [{ tipo: "cambio_de_pestana", t: new Date().toISOString() }] : [],
      t: new Date().toISOString(),
      visto: Date.now(),
      simulado: true,
    };
  }
  return out;
}

export default function Inspector() {
  const [alumnos, setAlumnos] = useState<Record<string, Alumno>>({});
  const [ahora, setAhora] = useState(() => Date.now());
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [soloAlertas, setSoloAlertas] = useState(false);

  useEffect(() => {
    const quitar = escuchar((m) => {
      if (m.tipo === "estado") {
        setAlumnos((a) => ({ ...a, [m.alumnoId]: { ...m, visto: Date.now() } }));
      }
    });
    const id = setInterval(() => setAhora(Date.now()), 2000);
    return () => {
      quitar();
      clearInterval(id);
    };
  }, []);

  const sinSenal = (a: Alumno) =>
    !a.simulado &&
    ahora - a.visto > 10000 &&
    a.estado !== "cancelado" &&
    a.estado !== "finalizado";

  function decidir(a: Alumno, decision: Decision) {
    enviar({ tipo: "decision", alumnoId: a.alumnoId, decision });
    setAlumnos((prev) => ({
      ...prev,
      [a.alumnoId]: {
        ...prev[a.alumnoId],
        estado: decision === "cancelar" ? "cancelado" : "autorizado",
      },
    }));
  }

  const todos = Object.values(alumnos);
  const conteo = (e: Estado) => todos.filter((a) => a.estado === e).length;
  const lista = todos
    .filter((a) => !soloAlertas || a.estado === "bloqueado" || sinSenal(a))
    .sort((a, b) => ORDEN[a.estado] - ORDEN[b.estado] || a.nombre.localeCompare(b.nombre));
  const elegido = seleccion ? alumnos[seleccion] : undefined;

  return (
    <main className="inspector">
      <div className="insp-cab">
        <h1>Panel del inspector</h1>
        <span>Grupo: {todos.length} / {GRUPO} aspirantes</span>
      </div>

      <div className="resumen">
        <span>🔴 Bloqueados: {conteo("bloqueado")}</span>
        <span>🟠 Autorizados: {conteo("autorizado")}</span>
        <span>🟢 En examen: {conteo("en_examen")}</span>
        <span>⚠ Sin señal: {todos.filter(sinSenal).length}</span>
        <label>
          <input
            type="checkbox"
            checked={soloAlertas}
            onChange={(e) => setSoloAlertas(e.target.checked)}
          />{" "}
          Solo alertas
        </label>
        <button onClick={() => setAlumnos((prev) => ({ ...prev, ...simular() }))}>
          Simular 25 aspirantes
        </button>
      </div>

      <div className="insp-cuerpo">
        <div className="rejilla">
          {lista.length === 0 && <p>Esperando aspirantes conectados...</p>}
          {lista.map((a) => (
            <button
              key={a.alumnoId}
              className={`mini ${a.estado} ${seleccion === a.alumnoId ? "sel" : ""}`}
              onClick={() => setSeleccion(a.alumnoId)}
            >
              {a.miniatura ? (
                <img src={a.miniatura} alt={a.nombre} />
              ) : (
                <div className="sinfoto">sin imagen</div>
              )}
              <strong>{a.nombre}</strong>
              <small>
                {ETIQUETA[a.estado]}
                {sinSenal(a) && " · ⚠ sin señal"}
              </small>
            </button>
          ))}
        </div>

        <aside className="detalle">
          {!elegido ? (
            <p>Selecciona un aspirante para ver su detalle.</p>
          ) : (
            <>
              <h2>{elegido.nombre}</h2>
              {elegido.miniatura && <img src={elegido.miniatura} alt={elegido.nombre} />}
              <p>
                {ETIQUETA[elegido.estado]}
                {sinSenal(elegido) && " · ⚠ sin señal"}
              </p>
              <p>
                Respondidas: {elegido.respondidas}/120 · Infracciones: {elegido.infracciones}
              </p>
              {elegido.estado === "bloqueado" && (
                <div className="acciones">
                  <button onClick={() => decidir(elegido, "reanudar")}>Reanudar</button>
                  <button onClick={() => decidir(elegido, "advertir")}>Advertir</button>
                  <button onClick={() => decidir(elegido, "cancelar")}>Cancelar</button>
                </div>
              )}
              <h3>Últimos eventos</h3>
              <ul>
                {elegido.eventos.length === 0 && <li>Sin eventos</li>}
                {elegido.eventos
                  .slice()
                  .reverse()
                  .map((e, i) => (
                    <li key={i}>
                      {new Date(e.t).toLocaleTimeString()} · {e.tipo}
                    </li>
                  ))}
              </ul>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
