import { Link } from "react-router-dom";
import "../styles/sidebar.css";

export default function Sidebar({ collapsed, setCollapsed }) {
  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <button
        className="toggle-btn"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? "☰" : "✕"}
      </button>

      <div className="sidebar-header">
        <img src="/logo.png" alt="Logo" className="sidebar-logo" />

        {!collapsed && (
          <h2 className="sidebar-title">PORCYS</h2>
        )}
      </div>

      <ul>
        <li>
          <Link to="/">
            {collapsed ? "📊" : "📊 Dashboard"}
          </Link>
        </li>

        <li>
          <Link to="/animales">
            {collapsed ? "🐖" : "🐖 Animales"}
          </Link>
        </li>

        <li>
          <Link to="/ventas">
            {collapsed ? "💰" : "💰 Ventas"}
          </Link>
        </li>

        <li>
          <Link to="/gestaciones">
            {collapsed ? "🤰" : "🤰 Gestaciones"}
          </Link>
        </li>

        <li>
          <Link to="/maternidad">
            {collapsed ? "🐷" : "🐷 Maternidad"}
          </Link>
        </li>

        <li>
          <Link to="/corrales">
            {collapsed ? "🏠" : "🏠 Corrales"}
          </Link>
        </li>

        <li>
          <Link to="/inventario">
            {collapsed ? "📦" : "📦 Inventario"}
          </Link>
        </li>

        <li>
          <Link to="/medicamentos">
            {collapsed ? "💊" : "💊 Medicamentos"}
          </Link>
        </li>

        <li>
          <Link to="/sanidad">
            {collapsed ? "🩺" : "🩺 Sanidad"}
          </Link>
        </li>

        <li>
          <Link to="/alertas">
            {collapsed ? "🚨" : "🚨 Alertas"}
          </Link>
        </li>

        <li>
          <Link to="/clientes">
            {collapsed ? "👨🏻‍💼" : "👨🏻‍💼 Clientes"}
          </Link>
        </li>

        <li>
          <Link to="/reportes">
            {collapsed ? "📑" : "📑 Reportes"}
          </Link>
        </li>

        <li>
          <Link to="/finanzas">
            {collapsed ? "💵" : "💵 Finanzas"}
          </Link>
        </li>

        <li>
          <Link to="/compras">
            {collapsed ? "🛒" : "🛒 Compras"}
          </Link>
        </li>
      </ul>
    </div>
  );
}
