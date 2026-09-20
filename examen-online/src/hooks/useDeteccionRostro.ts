import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODELO =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

export function useDeteccionRostro(
  video: RefObject<HTMLVideoElement | null>,
  activo: boolean
) {
  const [rostros, setRostros] = useState(0);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!activo) return;
    let detector: FaceDetector | undefined;
    let intervalo: number | undefined;
    let cancelado = false;

    async function iniciar() {
      const vision = await FilesetResolver.forVisionTasks(WASM);
      detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODELO },
        runningMode: "VIDEO",
      });
      if (cancelado) return;
      setListo(true);
      intervalo = window.setInterval(() => {
        const v = video.current;
        if (v && v.readyState >= 2) {
          const r = detector!.detectForVideo(v, performance.now());
          setRostros(r.detections.length);
        }
      }, 500);
    }
    iniciar();

    return () => {
      cancelado = true;
      if (intervalo) clearInterval(intervalo);
      detector?.close();
    };
  }, [activo, video]);

  return { rostros, listo };
}
