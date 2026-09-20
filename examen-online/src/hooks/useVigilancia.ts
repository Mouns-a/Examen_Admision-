import { useEffect, useRef } from "react";
import { registrarEvento } from "../services/eventos";

export function useVigilancia(activo: boolean, onInfraccion: (motivo: string) => void) {
  const cb = useRef(onInfraccion);
  useEffect(() => {
    cb.current = onInfraccion;
  });

  useEffect(() => {
    if (!activo) return;

    const infraccion = (motivo: string) => {
      registrarEvento(motivo);
      cb.current(motivo);
    };
    const bloquear = (motivo: string) => (e: Event) => {
      e.preventDefault();
      registrarEvento(motivo);
    };

    const onVisibilidad = () => {
      if (document.hidden) infraccion("cambio_de_pestana");
    };
    const onBlur = () => infraccion("ventana_sin_foco");
    const onFullscreen = () => {
      if (!document.fullscreenElement) infraccion("salio_de_pantalla_completa");
    };
    const onCopy = bloquear("intento_copiar");
    const onCut = bloquear("intento_cortar");
    const onPaste = bloquear("intento_pegar");
    const onMenu = bloquear("clic_derecho");
    const onDrag = bloquear("arrastrar");
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ["c", "v", "x", "a", "p", "s", "u"].includes(k)) {
        e.preventDefault();
        registrarEvento("atajo_bloqueado_" + k);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") registrarEvento("print_screen");
    };

    document.addEventListener("visibilitychange", onVisibilidad);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onMenu);
    document.addEventListener("dragstart", onDrag);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilidad);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreen);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onMenu);
      document.removeEventListener("dragstart", onDrag);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [activo]);
}
