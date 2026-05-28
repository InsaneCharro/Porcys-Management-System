import { Link } from "react-router-dom";
import "../styles/sidebar.css";

const ADMIN = "administrador";
const EMPLEADO = "empleado";
const INVERSIONISTA = "inversionista";

const opcionesMenu = [
  {
    to: "/",
    icono: "📊",
    texto: "Dashboard",
    roles: [ADMIN, EMPLEADO, INVERSIONISTA],
  },
  {
    to: "/animales",
    icono: "🐖",
    texto: "Animales",
    roles: [ADMIN, EMPLEADO],
  },
  {
    to: "/pesos-pendientes",
    icono: "⚖️",
    texto: "Pesos pendientes",
    roles: [ADMIN, EMPLEADO],
  },
  {
    to: "/ventas",
    icono: "💰",
    texto: "Ventas",
    roles: [ADMIN, EMPLEADO],
  },
  {
    to: "/gestaciones",
    icono: "🤰",
    texto: "Gestaciones",
    roles: [ADMIN, EMPLEADO],
  },
  {
    to: "/maternidad",
    icono: "🐷",
    texto: "Maternidad",
    roles: [ADMIN, EMPLEADO],
  },
  {
    to: "/corrales",
    icono: "🏠",
    texto: "Corrales",
    roles: [ADMIN, EMPLEADO],
  },
  {
    to: "/inventario",
    icono: "📦",
    texto: "Inventario",
    roles: [ADMIN, EMPLEADO],
  },
  {
    to: "/alimentacion",
    icono: "🌽",
    texto: "Alimentación",
    roles: [ADMIN, EMPLEADO],
  },
  {
    to: "/medicamentos",
    icono: "💊",
    texto: "Medicamentos",
    roles: [ADMIN, EMPLEADO],
  },
  {
    to: "/sanidad",
    icono: "🩺",
    texto: "Sanidad",
    roles: [ADMIN, EMPLEADO],
  },
  {
    to: "/mortalidad-bajas",
    icono: "☠️",
    texto: "Mortalidad / Bajas",
    roles: [ADMIN, EMPLEADO],
  },
  {
    to: "/alertas",
    icono: "🚨",
    texto: "Alertas",
    roles: [ADMIN, EMPLEADO],
  },
  {
    to: "/predicciones",
    icono: "🔮",
    texto: "Predicciones",
    roles: [ADMIN, EMPLEADO],
  },
  {
    to: "/clientes",
    icono: "👨🏻‍💼",
    texto: "Clientes",
    roles: [ADMIN, EMPLEADO],
  },
  {
    to: "/reportes",
    icono: "📑",
    texto: "Reportes",
    roles: [ADMIN, INVERSIONISTA],
  },
  {
    to: "/finanzas",
    icono: "💵",
    texto: "Finanzas",
    roles: [ADMIN, INVERSIONISTA],
  },
  {
    to: "/compras",
    icono: "🛒",
    texto: "Compras",
    roles: [ADMIN, EMPLEADO],
  },
  {
    to: "/usuarios",
    icono: "👥",
    texto: "Usuarios",
    roles: [ADMIN],
  },
];

export default function Sidebar({ collapsed, setCollapsed, usuario, onLogout }) {
  const opcionesVisibles = opcionesMenu.filter((opcion) =>
    opcion.roles.includes(usuario?.role)
  );

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <button
        className="toggle-btn"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? "☰" : "✕"}
      </button>

      <div className="sidebar-header">
        <img
          src="/logo.png"
          alt="Logo"
          className="sidebar-logo"
          style={{
            width: collapsed ? "50px" : "100px",
            height: collapsed ? "50px" : "100px",
            objectFit: "contain",
            display: "block",
            margin: "0 auto",
          }}
        />
      </div>

      {!collapsed && usuario && (
        <div
          style={{
            margin: "12px 14px 18px",
            padding: "14px",
            borderRadius: "14px",
            background: "#ffffff",
            color: "#0f172a",
            border: "1px solid #cbd5e1",
            boxShadow: "0 6px 14px rgba(15, 23, 42, 0.08)",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 800,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "6px",
            }}
          >
            Sesión activa
          </div>

          <div
            style={{
              display: "inline-block",
              padding: "6px 10px",
              borderRadius: "999px",
              background: "#e0f2fe",
              color: "#075985",
              fontSize: "14px",
              fontWeight: 900,
              textTransform: "capitalize",
            }}
          >
            {usuario.role}
          </div>
        </div>
      )}

      <ul>
        {opcionesVisibles.map((opcion) => (
          <li key={opcion.to}>
            <Link to={opcion.to}>
              {collapsed ? opcion.icono : `${opcion.icono} ${opcion.texto}`}
            </Link>
          </li>
        ))}

        <li>
          <button
            type="button"
            onClick={onLogout}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              color: "#ffffff",
              textAlign: "left",
              padding: "12px 18px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: 700,
            }}
          >
            {collapsed ? "🚪" : "🚪 Cerrar sesión"}
          </button>
        </li>
      </ul>
    </div>
  );
}