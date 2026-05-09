import { Link } from "react-router-dom";
import "../styles/sidebar.css";

export default function Sidebar() {
  return (
    <div className="sidebar">

      <div className="sidebar-header">
        <img src="/logo.png" alt="Logo" className="sidebar-logo" />
        <h2 className="sidebar-title">Porcícola</h2>
      </div>

      <ul>

        <li>
          <Link to="/">📊 Dashboard</Link>
        </li>

        <li>
          <Link to="/animales">🐖 Animales</Link>
        </li>

        <li>
          <Link to="/ventas">💰 Ventas</Link>
        </li>

        <li>
          <Link to="#">⏰ Gestaciones</Link>
        </li>

        {/* 🔥 NUEVO MÓDULO */}
        <li>
          <Link to="/maternidad">
            🐷 Maternidad
          </Link>
        </li>

        <li>
          <Link to="/corrales">🚜 Corrales</Link>
        </li>

        <li>
          <Link to="#">🫛 Alimento</Link>
        </li>

        <li>
          <Link to="/inventario">📦 Inventario</Link>
        </li>

        <li>
          <Link to="#">💊 Medicamentos</Link>
        </li>

        <li>
          <Link to="/alertas">
            🚨 Alertas
          </Link>
        </li>

        <li>
          <Link to="/clientes">👨🏻‍💼 Clientes</Link>
        </li>

        <li><Link to="/reportes">Reportes</Link></li>

      </ul>

    </div>
  );
}