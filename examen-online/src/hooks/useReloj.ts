import { useEffect, useRef, useState } from "react";

export function useReloj(totalSegundos: number, pausado: boolean, onFin: () => void) {
  const [restante, setRestante] = useState(totalSegundos);
  const restanteMs = useRef(totalSegundos * 1000);
  const cb = useRef(onFin);
  useEffect(() => {
    cb.current = onFin;
  });

  useEffect(() => {
    if (pausado) return;
    const base = restanteMs.current;
    const inicio = Date.now();
    const id = setInterval(() => {
      const ms = base - (Date.now() - inicio);
      if (ms <= 0) {
        clearInterval(id);
        restanteMs.current = 0;
        setRestante(0);
        cb.current();
      } else {
        setRestante(Math.ceil(ms / 1000));
      }
    }, 250);
    return () => {
      clearInterval(id);
      restanteMs.current = Math.max(0, base - (Date.now() - inicio));
    };
  }, [pausado]);

  return restante;
}
