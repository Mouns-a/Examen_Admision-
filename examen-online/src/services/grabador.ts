import { guardarChunk } from "./almacen";
import { registrarEvento } from "./eventos";
import { obtenerStream, obtenerPantalla } from "./media";

export type Tipo = "camara" | "pantalla";

const activos = new Map<Tipo, MediaRecorder>();

export function iniciarGrabacion(tipo: Tipo) {
  const stream = tipo === "camara" ? obtenerStream() : obtenerPantalla();
  if (!stream) return;

  const previo = activos.get(tipo);
  if (previo && previo.state !== "inactive") previo.stop();

  const sesion = Date.now();
  let indice = 0;
  const opciones: MediaRecorderOptions = { videoBitsPerSecond: 400000, audioBitsPerSecond: 32000 };
  if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
    opciones.mimeType = "video/webm;codecs=vp8,opus";
  }

  const rec = new MediaRecorder(stream, opciones);
  rec.ondataavailable = (e) => {
    if (e.data.size === 0) return;
    guardarChunk(tipo, sesion, indice++, e.data).catch(() =>
      registrarEvento("error_guardando_" + tipo)
    );
  };
  rec.start(10000); // un fragmento cada 10 segundos
  activos.set(tipo, rec);
  registrarEvento("grabacion_iniciada_" + tipo);
}

export function detenerGrabacion() {
  activos.forEach((rec) => {
    if (rec.state !== "inactive") rec.stop();
  });
  activos.clear();
}
