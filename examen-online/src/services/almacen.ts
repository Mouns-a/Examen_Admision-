const DB = "examen-grabaciones";
const STORE = "chunks";

interface Chunk {
  clave: string;
  tipo: string;
  sesion: number;
  indice: number;
  blob: Blob;
}

function abrir(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: "clave" });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

export async function guardarChunk(tipo: string, sesion: number, indice: number, blob: Blob) {
  const db = await abrir();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    const clave = `${tipo}-${sesion}-${String(indice).padStart(6, "0")}`;
    tx.objectStore(STORE).put({ clave, tipo, sesion, indice, blob });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  db.close();
}

// Devuelve un archivo por cada grabación (una por fuente y por reinicio)
export async function leerGrabaciones(): Promise<Record<string, Blob[]>> {
  const db = await abrir();
  const todos = await new Promise<Chunk[]>((res, rej) => {
    const r = db.transaction(STORE).objectStore(STORE).getAll();
    r.onsuccess = () => res(r.result as Chunk[]);
    r.onerror = () => rej(r.error);
  });
  db.close();
  const out: Record<string, Blob[]> = {};
  todos
    .sort((a, b) => a.sesion - b.sesion || a.indice - b.indice)
    .forEach((c) => {
      const k = `${c.tipo}-${c.sesion}`;
      out[k] = out[k] ?? [];
      out[k].push(c.blob);
    });
  return out;
}

export async function limpiarGrabaciones() {
  const db = await abrir();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  db.close();
}
