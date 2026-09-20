import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { generarExamen } from "../services/examen";
import { detenerStream } from "../services/media";
import { registrarEvento } from "../services/eventos";
import { useVigilancia } from "../hooks/useVigilancia";

const TOTAL = 5;
const SEGUNDOS = 60;
const MAX_INFRACCIONES = 3;

export default function Examen() {
  const navigate = useNavigate();
  const [examen] = useState(() => generarExamen(TOTAL));
  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState<(number | null)[]>([]);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [tiempo, setTiempo] = useState(SEGUNDOS);
  const [infracciones, setInfracciones] = useState(0);
  const [advertencia, setAdvertencia] = useState(false);
  const terminado = useRef(false);
  const ultima = useRef(0);

  function finalizar(finales: (number | null)[], cancelado: boolean) {
    terminado.current = true;
    const aciertos = examen.filter((p, i) => finales[i] === p.correcta).length;
    sessionStorage.setItem(
      "resultado",
      JSON.stringify({ aciertos, total: examen.length, cancelado })
    );
    detenerStream();
    if (document.fullscreenElement) document.exitFullscreen();
    navigate("/finalizado");
  }

  function siguiente() {
    const nuevas = [...respuestas];
    nuevas[indice] = seleccion;
    setRespuestas(nuevas);
    setSeleccion(null);

    if (indice + 1 >= examen.length) finalizar(nuevas, false);
    else setIndice(indice + 1);
  }

  useVigilancia(true, () => {
    if (terminado.current) return;
    const ahora = Date.now();
    if (ahora - ultima.current < 1500) return; // evita contar doble un mismo evento
    ultima.current = ahora;

    const total = infracciones + 1;
    setInfracciones(total);
    if (total >= MAX_INFRACCIONES) {
      registrarEvento("examen_cancelado");
      finalizar(respuestas, true);
    } else {
      setAdvertencia(true);
    }
  });

  async function volverPantallaCompleta() {
    try {
      await document.documentElement.requestFullscreen();
      setAdvertencia(false);
    } catch {
      /* el alumno debe permitir la pantalla completa */
    }
  }

  // Siempre apunta a la versión más reciente de "siguiente"
  const siguienteRef = useRef(siguiente);
  useEffect(() => {
    siguienteRef.current = siguiente;
  });

  // Temporizador basado en hora real
  useEffect(() => {
    const limite = Date.now() + SEGUNDOS * 1000;
    setTiempo(SEGUNDOS);
    const id = setInterval(() => {
      const restante = Math.ceil((limite - Date.now()) / 1000);
      if (restante <= 0) {
        clearInterval(id);
        siguienteRef.current();
      } else {
        setTiempo(restante);
      }
    }, 250);
    return () => clearInterval(id);
  }, [indice]);

  const p = examen[indice];

  return (
    <main className="examen">
      <header>
        <span>Pregunta {indice + 1} de {examen.length}</span>
        <span className={tiempo <= 10 ? "urgente" : ""}>⏱ {tiempo}s</span>
      </header>

      <h2>{p.enunciado}</h2>

      <div className="opciones">
        {p.opciones.map((op, i) => (
          <label key={i} className={seleccion === i ? "activa" : ""}>
            <input
              type="radio"
              name="opcion"
              checked={seleccion === i}
              onChange={() => setSeleccion(i)}
            />
            {op}
          </label>
        ))}
      </div>

      <button onClick={siguiente}>
        {indice + 1 === examen.length ? "Finalizar examen" : "Siguiente"}
      </button>

      {advertencia && (
        <div className="overlay">
          <div className="overlay-caja">
            <h2>⚠ Saliste del examen</h2>
            <p>
              Infracción {infracciones} de {MAX_INFRACCIONES}. Al llegar a {MAX_INFRACCIONES} el
              examen se cancela.
            </p>
            <button onClick={volverPantallaCompleta}>Volver al examen</button>
          </div>
        </div>
      )}
    </main>
  );
}
