import { guardarStream, guardarPantalla } from "./media";

export async function pedirCamara(): Promise<MediaStream> {
  const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  guardarStream(s);
  return s;
}

export async function pedirPantalla(): Promise<MediaStream> {
  const opciones = { video: { displaySurface: "monitor", frameRate: 5 }, audio: false };
  const s = await navigator.mediaDevices.getDisplayMedia(opciones);
  const pista = s.getVideoTracks()[0];
  const tipo = (pista.getSettings() as unknown as { displaySurface?: string }).displaySurface;
  if (tipo !== "monitor") {
    s.getTracks().forEach((t) => t.stop());
    throw new Error("Debes compartir toda la pantalla, no una ventana ni una pestaña.");
  }
  guardarPantalla(s);
  return s;
}
