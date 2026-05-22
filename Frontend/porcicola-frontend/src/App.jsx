import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";

import Sidebar from "./components/Sidebar";

import DashboardPage from "./pages/DashboardPage";
import AnimalesPage from "./pages/AnimalesPage";
import VentasPage from "./pages/VentasPage";
import Gestaciones from "./pages/Gestaciones";
import AnimalDetalle from "./pages/AnimalDetalle";
import Alertas from "./pages/Alertas";
import Inventario from "./pages/Inventario";
import Corrales from "./pages/Corrales";
import CorralDetalle from "./pages/CorralDetalle";
import Maternidad from "./pages/Maternidad";
import DetalleCamada from "./pages/DetalleCamada";
import Clientes from "./pages/Clientes";
import Reportes from "./pages/Reportes";
import Finanzas from "./pages/Finanzas";
import Compras from "./pages/Compras";
import Medicamentos from "./pages/Medicamentos";
import EventosSanitarios from "./pages/EventosSanitarios";
import Alimentacion from "./pages/Alimentacion";
import MortalidadBajas from "./pages/MortalidadBajas";

function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Router>
      <div style={{ display: "flex" }}>
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />

        <div
          style={{
            marginLeft: collapsed ? "90px" : "260px",
            width: "100%",
            transition: "all 0.3s ease",
          }}
        >
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/animales" element={<AnimalesPage />} />
            <Route path="/ventas" element={<VentasPage />} />
            <Route path="/gestaciones" element={<Gestaciones />} />
            <Route path="/animales/:id" element={<AnimalDetalle />} />
            <Route path="/alertas" element={<Alertas />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/corrales" element={<Corrales />} />
            <Route path="/corrales/:id" element={<CorralDetalle />} />
            <Route path="/maternidad" element={<Maternidad />} />
            <Route path="/maternidad/:id" element={<DetalleCamada />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/finanzas" element={<Finanzas />} />
            <Route path="/compras" element={<Compras />} />
            <Route path="/medicamentos" element={<Medicamentos />} />
            <Route path="/sanidad" element={<EventosSanitarios />} />
            <Route path="/alimentacion" element={<Alimentacion />} />
            <Route path="/mortalidad-bajas" element={<MortalidadBajas />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;