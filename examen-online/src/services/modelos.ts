export interface Aspirante {
  id: number;
  nombre: string;
  curp: string;
  fechaNacimiento: string; // date
  email: string;
  fotoReferenciaUrl: string;
}

export interface ExamenConfig {
  id: number;
  titulo: string;
  duracionMinutos: number;
  totalPreguntas: number;
}

export type EstadoAplicacion =
  | "no_iniciado"
  | "en_examen"
  | "bloqueado"
  | "cancelado"
  | "finalizado";

export interface AplicacionExamen {
  id: number;
  aspiranteId: number;
  examenId: number;
  grupoSupervisionId: number;
  sedeId: number | null;
  estado: EstadoAplicacion;
  motivoCancelacion: string | null;
  identidadVerificada: boolean;
  horaInicio: string | null;
  horaFin: string | null;
}

export interface Supervisor {
  id: number;
  nombre: string;
  curp: string;
  email: string;
}

export type NivelGravedad = "bajo" | "medio" | "alto";

export interface EventoSospechoso {
  aplicacionId: number;
  tipoEvento: string;
  nivelGravedad: NivelGravedad;
  capturaPantallaUrl: string | null;
  timestampEvento: string;
}
