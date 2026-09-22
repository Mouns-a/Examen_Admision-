export interface InfoNavegador {
  compatible: boolean;
  navegador: string;
  esMovil: boolean;
}

// Una página web NO puede saber qué otros programas tiene abiertos el usuario;
// eso exigiría una app de escritorio. Aquí solo validamos lo que el navegador expone.
export function detectarNavegador(): InfoNavegador {
  const ua = navigator.userAgent;
  const esMovil = /Mobi|Android(?!.*Chrome)|iPhone|iPad/i.test(ua);
  const esChrome = /Chrome\//.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua);
  const esEdge = /Edg\//.test(ua);
  return { compatible: (esChrome || esEdge) && !esMovil, navegador: esEdge ? "Edge" : esChrome ? "Chrome" : "Otro", esMovil };
}

export interface InfoPantalla {
  ancho: number;
  alto: number;
  posiblesVarias: boolean;
}

export function detectarPantalla(): InfoPantalla {
  const posiblesVarias = window.screen.availWidth < window.screen.width * 0.6;
  return { ancho: window.screen.width, alto: window.screen.height, posiblesVarias };
}

export interface ResultadoVelocidad {
  bajadaMbps: number;
  subidaMbps: number;
  estimado: boolean;
}

interface ConexionRed {
  downlink?: number; // Mbps, aproximado, solo bajada
  effectiveType?: string;
}

// La Network Information API (Chrome/Edge) da un estimado del navegador,
// sin depender de descargar archivos de terceros. Es aproximada, no una
// medición exacta; para precisión real hace falta un endpoint propio en el backend.
export async function medirVelocidad(): Promise<ResultadoVelocidad> {
  const nav = navigator as Navigator & { connection?: ConexionRed };
  const con = nav.connection;
  if (con?.downlink) {
    return { bajadaMbps: con.downlink, subidaMbps: con.downlink / 3, estimado: true };
  }
  // Respaldo si el navegador no expone esta información
  const inicio = performance.now();
  const resp = await fetch(location.href, { cache: "no-store" });
  await resp.blob();
  const seg = (performance.now() - inicio) / 1000;
  const bajadaMbps = seg > 0 ? 8 / seg : 0; // muy aproximado
  return { bajadaMbps, subidaMbps: bajadaMbps / 3, estimado: true };
}
