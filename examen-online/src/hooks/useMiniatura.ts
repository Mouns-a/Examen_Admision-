import { useEffect, useRef } from "react";
import { obtenerStream } from "../services/media";

export function useMiniatura(activo: boolean, onFoto: (dataUrl: string) => void, clave = 0) {
  const cb = useRef(onFoto);
  useEffect(() => {
    cb.current = onFoto;
  });

  useEffect(() => {
    if (!activo) return;
    const stream = obtenerStream();
    if (!stream) return;

    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    video.play().catch(() => {});

    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 120;
    const ctx = canvas.getContext("2d");

    const capturar = () => {
      if (!ctx || video.readyState < 2) return;
      ctx.drawImage(video, 0, 0, 160, 120);
      cb.current(canvas.toDataURL("image/jpeg", 0.5));
    };
    const primera = setTimeout(capturar, 1500);
    const id = setInterval(capturar, 5000);

    return () => {
      clearTimeout(primera);
      clearInterval(id);
      video.srcObject = null;
    };
  }, [activo, clave]);
}
