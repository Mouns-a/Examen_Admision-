import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { obtenerSesion } from "../services/auth";

export default function RutaProtegida({ children }: { children: ReactNode }) {
  return obtenerSesion() ? <>{children}</> : <Navigate to="/login" replace />;
}