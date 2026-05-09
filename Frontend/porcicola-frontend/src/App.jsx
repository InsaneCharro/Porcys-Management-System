import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";

import DashboardPage from "./pages/DashboardPage";
import AnimalesPage from "./pages/AnimalesPage";
import VentasPage from "./pages/VentasPage";
import AnimalDetalle from "./pages/AnimalDetalle";
import Alertas from "./pages/Alertas";
import Inventario from "./pages/Inventario";
import Corrales from "./pages/Corrales";
import CorralDetalle from "./pages/CorralDetalle";
import Maternidad from "./pages/Maternidad";
import DetalleCamada from "./pages/DetalleCamada";
import Clientes from "./pages/Clientes";
import Reportes from "./pages/Reportes";
function App() {
  return (
    <Router>
      <Sidebar />

      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/animales" element={<AnimalesPage />} />
        <Route path="/ventas" element={<VentasPage />} />
        <Route path="/animales/:id" element={<AnimalDetalle />} />
        <Route path="/alertas" element={<Alertas />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/corrales" element={<Corrales />} />
        <Route path="/corrales/:id" element={<CorralDetalle />} />
        <Route path="/maternidad" element={<Maternidad />} />
        <Route path="/maternidad/:id" element={<DetalleCamada />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/reportes" element={<Reportes />} />
      </Routes>
    </Router>
  );
}

export default App;