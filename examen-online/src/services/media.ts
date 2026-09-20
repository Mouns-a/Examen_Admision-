let stream: MediaStream | null = null;

export const guardarStream = (s: MediaStream) => { stream = s; };
export const obtenerStream = () => stream;
export const detenerStream = () => {
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
};