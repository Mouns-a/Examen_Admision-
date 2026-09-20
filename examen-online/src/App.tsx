import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Verificacion from "./pages/Verificacion";
import Examen from "./pages/Examen";
import Finalizado from "./pages/Finalizado";
import Inspector from "./pages/Inspector";
import RutaProtegida from "./components/RutaProtegida";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verificacion" element={<RutaProtegida><Verificacion /></RutaProtegida>} />
      <Route path="/examen" element={<RutaProtegida><Examen /></RutaProtegida>} />
      <Route path="/finalizado" element={<RutaProtegida><Finalizado /></RutaProtegida>} />
      <Route path="/inspector" element={<Inspector />} />
    </Routes>
  );
}