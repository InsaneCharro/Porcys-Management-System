import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
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
import Predicciones from "./pages/Predicciones";
import PesosPendientes from "./pages/PesosPendientes";
import Login from "./pages/Login";
import Usuarios from "./pages/Usuarios";

import {
  guardarUsuario,
  limpiarUsuarioGuardado,
  obtenerUsuarioGuardado,
} from "./services/authService";

const ADMIN = "administrador";
const EMPLEADO = "empleado";
const INVERSIONISTA = "inversionista";

function RutaProtegida({ usuario, rolesPermitidos, children }) {
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (!rolesPermitidos.includes(usuario.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [usuario, setUsuario] = useState(obtenerUsuarioGuardado);

  const iniciarSesion = (usuarioAutenticado) => {
    guardarUsuario(usuarioAutenticado);
    setUsuario(usuarioAutenticado);
  };

  const cerrarSesion = () => {
    limpiarUsuarioGuardado();
    setUsuario(null);
  };

  const proteger = (rolesPermitidos, componente) => (
    <RutaProtegida usuario={usuario} rolesPermitidos={rolesPermitidos}>
      {componente}
    </RutaProtegida>
  );

  if (!usuario) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={iniciarSesion} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div style={{ display: "flex" }}>
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          usuario={usuario}
          onLogout={cerrarSesion}
        />

        <div
          style={{
            marginLeft: collapsed ? "90px" : "260px",
            width: "100%",
            transition: "all 0.3s ease",
          }}
        >
          <Routes>
            <Route path="/login" element={<Navigate to="/" replace />} />

            <Route
              path="/"
              element={proteger([ADMIN, EMPLEADO, INVERSIONISTA], <DashboardPage />)}
            />

            <Route
              path="/animales"
              element={proteger([ADMIN, EMPLEADO], <AnimalesPage />)}
            />

            <Route
              path="/animales/:id"
              element={proteger([ADMIN, EMPLEADO], <AnimalDetalle />)}
            />

            <Route
              path="/pesos-pendientes"
              element={proteger([ADMIN, EMPLEADO], <PesosPendientes />)}
            />

            <Route
              path="/ventas"
              element={proteger([ADMIN, EMPLEADO], <VentasPage />)}
            />

            <Route
              path="/gestaciones"
              element={proteger([ADMIN, EMPLEADO], <Gestaciones />)}
            />

            <Route
              path="/alertas"
              element={proteger([ADMIN, EMPLEADO], <Alertas />)}
            />

            <Route
              path="/inventario"
              element={proteger([ADMIN, EMPLEADO], <Inventario />)}
            />

            <Route
              path="/corrales"
              element={proteger([ADMIN, EMPLEADO], <Corrales />)}
            />

            <Route
              path="/corrales/:id"
              element={proteger([ADMIN, EMPLEADO], <CorralDetalle />)}
            />

            <Route
              path="/maternidad"
              element={proteger([ADMIN, EMPLEADO], <Maternidad />)}
            />

            <Route
              path="/maternidad/:id"
              element={proteger([ADMIN, EMPLEADO], <DetalleCamada />)}
            />

            <Route
              path="/clientes"
              element={proteger([ADMIN, EMPLEADO], <Clientes />)}
            />

            <Route
              path="/reportes"
              element={proteger([ADMIN, INVERSIONISTA], <Reportes />)}
            />

            <Route
              path="/finanzas"
              element={proteger([ADMIN, INVERSIONISTA], <Finanzas />)}
            />

            <Route
              path="/compras"
              element={proteger([ADMIN, EMPLEADO], <Compras />)}
            />

            <Route
              path="/medicamentos"
              element={proteger([ADMIN, EMPLEADO], <Medicamentos />)}
            />

            <Route
              path="/sanidad"
              element={proteger([ADMIN, EMPLEADO], <EventosSanitarios />)}
            />

            <Route
              path="/alimentacion"
              element={proteger([ADMIN, EMPLEADO], <Alimentacion />)}
            />

            <Route
              path="/mortalidad-bajas"
              element={proteger([ADMIN, EMPLEADO], <MortalidadBajas />)}
            />

            <Route
              path="/predicciones"
              element={proteger([ADMIN, EMPLEADO], <Predicciones />)}
            />

            <Route
              path="/usuarios"
              element={proteger([ADMIN], <Usuarios />)}
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;