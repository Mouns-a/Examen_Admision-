export interface Pregunta {
  id: number;
  enunciado: string;
  opciones: string[];
  correcta: number; // índice de la opción correcta
}

const banco = [
  {
    enunciado: "Si P(A)=0.3, P(B)=0.5 y A y B son independientes, P(A∩B) es:",
    opciones: ["0.15", "0.8", "0.2", "0.35"],
    correcta: 0,
  },
  {
    enunciado: "La desviación estándar es:",
    opciones: [
      "La raíz cuadrada de la varianza",
      "El cuadrado de la varianza",
      "La media de los datos",
      "El rango dividido entre 2",
    ],
    correcta: 0,
  },
  {
    enunciado: "En la distribución normal estándar, la media es:",
    opciones: ["0", "1", "-1", "Depende de la varianza"],
    correcta: 0,
  },
  {
    enunciado: "El estimador de máxima verosimilitud maximiza:",
    opciones: [
      "La función de verosimilitud",
      "El error cuadrático medio",
      "La varianza muestral",
      "El sesgo",
    ],
    correcta: 0,
  },
];

function mezclar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mezclarOpciones(p: Omit<Pregunta, "id">, id: number): Pregunta {
  const idx = mezclar(p.opciones.map((_, i) => i));
  return {
    id,
    enunciado: p.enunciado,
    opciones: idx.map((i) => p.opciones[i]),
    correcta: idx.indexOf(p.correcta),
  };
}

// Pregunta con datos distintos para cada alumno
function preguntaMedia(id: number): Pregunta {
  const datos = Array.from({ length: 5 }, () => Math.floor(Math.random() * 10) + 1);
  const media = datos.reduce((a, b) => a + b, 0) / datos.length;
  const opciones = [media, media - 1, media + 1, media + 2].map((x) => x.toFixed(1));
  return mezclarOpciones(
    { enunciado: `La media de los datos ${datos.join(", ")} es:`, opciones, correcta: 0 },
    id
  );
}

export function generarExamen(n: number): Pregunta[] {
  const elegidas = mezclar(banco).slice(0, n - 1).map((p, i) => mezclarOpciones(p, i));
  return mezclar([...elegidas, preguntaMedia(99)]);
}