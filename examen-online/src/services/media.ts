let stream: MediaStream | null = null;
let pantalla: MediaStream | null = null;

export const guardarStream = (s: MediaStream) => { stream = s; };
export const obtenerStream = () => stream;
export const guardarPantalla = (s: MediaStream) => { pantalla = s; };
export const obtenerPantalla = () => pantalla;

export const detenerStream = () => {
  stream?.getTracks().forEach((t) => t.stop());
  pantalla?.getTracks().forEach((t) => t.stop());
  stream = null;
  pantalla = null;
};
