import { obtenerEventos } from "../services/eventos";

export default function Finalizado() {
  const r = JSON.parse(sessionStorage.getItem("resultado") ?? "null");
  return (
    <main className="examen">
      <h1>{r?.cancelado ? "Examen cancelado" : "Examen enviado"}</h1>
      {r?.cancelado && <p>Se canceló por salir del examen en repetidas ocasiones.</p>}
      {r && !r.cancelado && <p>Demo: {r.aciertos} de {r.total} correctas.</p>}
      <p>Eventos registrados: {obtenerEventos().length}</p>
    </main>
  );
}
