import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { obtenerSupervisor } from "../services/supervisores";

export default function RutaSupervisor({ children }: { children: ReactNode }) {
  return obtenerSupervisor() ? <>{children}</> : <Navigate to="/login" replace />;
}
