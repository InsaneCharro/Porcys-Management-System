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
        <img src="/logo.png" alt="Logo" className="sidebar-logo" />

        {!collapsed && (
          <h2 className="sidebar-title">PORCYS</h2>
        )}
      </div>

      {!collapsed && usuario && (
        <div
          style={{
            margin: "10px 14px 16px",
            padding: "12px",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.10)",
            color: "#ffffff",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: "14px" }}>
            {usuario.name}
          </div>

          <div
            style={{
              fontSize: "12px",
              opacity: 0.85,
              marginTop: "4px",
              textTransform: "capitalize",
            }}
          >
            Rol: {usuario.role}
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