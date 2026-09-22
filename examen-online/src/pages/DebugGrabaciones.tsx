import { leerGrabaciones, limpiarGrabaciones } from "../services/almacen";

async function descargar() {
  const grabaciones = await leerGrabaciones();
  Object.entries(grabaciones).forEach(([nombre, partes]) => {
    const url = URL.createObjectURL(new Blob(partes, { type: "video/webm" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nombre}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

// Solo para pruebas locales del desarrollador: las grabaciones viven en el
// IndexedDB de ESTE navegador. No sirve como panel de administrador real;
// eso requiere subir el video al servidor (pendiente en el backend).
export default function DebugGrabaciones() {
  return (
    <main className="examen">
      <h1>Grabaciones locales (solo desarrollo)</h1>
      <button onClick={descargar}>Descargar</button>
      <button onClick={() => limpiarGrabaciones()}>Borrar</button>
    </main>
  );
}
