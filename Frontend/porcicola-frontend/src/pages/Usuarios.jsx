import { useEffect, useState } from "react";
import {
  actualizarUsuario,
  crearUsuario,
  desactivarUsuario,
  obtenerUsuarios,
} from "../services/userService";
import { obtenerUsuarioGuardado } from "../services/authService";

const formularioInicial = {
  name: "",
  email: "",
  password: "",
  role: "empleado",
  activo: true,
};

export default function Usuarios() {
  const usuarioActual = obtenerUsuarioGuardado();

  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(formularioInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const esAdministrador = usuarioActual?.role === "administrador";

  const cargarUsuarios = async () => {
    if (!esAdministrador) {
      return;
    }

    setCargando(true);
    setError("");

    try {
      const data = await obtenerUsuarios(usuarioActual);
      setUsuarios(data);
    } catch (error) {
      const mensajeError =
        error.response?.data?.message ||
        "No se pudieron cargar los usuarios.";

      setError(mensajeError);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cambiarCampo = (evento) => {
    const { name, value } = evento.target;

    setForm((anterior) => ({
      ...anterior,
      [name]: name === "activo" ? value === "1" : value,
    }));
  };

  const limpiarFormulario = () => {
    setForm(formularioInicial);
    setEditandoId(null);
    setMensaje("");
    setError("");
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    setCargando(true);
    setMensaje("");
    setError("");

    try {
      const datos = {
        name: form.name,
        email: form.email,
        role: form.role,
        activo: form.activo,
      };

      if (form.password.trim() !== "") {
        datos.password = form.password;
      }

      if (!editandoId && !datos.password) {
        setError("La contraseña es obligatoria al crear un usuario.");
        setCargando(false);
        return;
      }

      if (editandoId) {
        await actualizarUsuario(editandoId, datos, usuarioActual);
        setMensaje("Usuario actualizado correctamente.");
      } else {
        await crearUsuario(datos, usuarioActual);
        setMensaje("Usuario creado correctamente.");
      }

      limpiarFormulario();
      await cargarUsuarios();
    } catch (error) {
      const mensajeError =
        error.response?.data?.message ||
        "No se pudo guardar el usuario.";

      setError(mensajeError);
    } finally {
      setCargando(false);
    }
  };

  const editar = (usuario) => {
    setEditandoId(usuario.id);
    setForm({
      name: usuario.name,
      email: usuario.email,
      password: "",
      role: usuario.role,
      activo: Boolean(usuario.activo),
    });
    setMensaje("");
    setError("");
  };

  const desactivar = async (usuario) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas desactivar a ${usuario.name}?`
    );

    if (!confirmar) {
      return;
    }

    setCargando(true);
    setMensaje("");
    setError("");

    try {
      await desactivarUsuario(usuario.id, usuarioActual);
      setMensaje("Usuario desactivado correctamente.");
      await cargarUsuarios();
    } catch (error) {
      const mensajeError =
        error.response?.data?.message ||
        "No se pudo desactivar el usuario.";

      setError(mensajeError);
    } finally {
      setCargando(false);
    }
  };

  if (!esAdministrador) {
    return (
      <div style={{ padding: "32px" }}>
        <h1>Acceso denegado</h1>
        <p>Solo el administrador puede gestionar usuarios.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        padding: "24px 32px",
      }}
    >
      <h1
        style={{
          fontSize: "40px",
          fontWeight: 900,
          letterSpacing: "-0.04em",
          margin: "0 0 6px",
        }}
      >
        👥 Usuarios, roles y permisos
      </h1>

      <p
        style={{
          margin: "0 0 22px",
          color: "#475569",
          fontSize: "15px",
        }}
      >
        Alta, edición y desactivación de usuarios del sistema PORCYS.
      </p>

      {mensaje && (
        <div
          style={{
            background: "#dcfce7",
            color: "#166534",
            padding: "12px",
            borderRadius: "10px",
            marginBottom: "16px",
            fontWeight: 800,
          }}
        >
          {mensaje}
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: "12px",
            borderRadius: "10px",
            marginBottom: "16px",
            fontWeight: 800,
          }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={guardar}
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "24px",
          boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          {editandoId ? "Editar usuario" : "Crear usuario"}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
          }}
        >
          <div>
            <label style={{ fontWeight: 800 }}>Nombre</label>
            <input
              name="name"
              value={form.name}
              onChange={cambiarCampo}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontWeight: 800 }}>Correo</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={cambiarCampo}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontWeight: 800 }}>
              Contraseña {editandoId ? "(opcional)" : ""}
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={cambiarCampo}
              minLength={editandoId ? undefined : 8}
              required={!editandoId}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontWeight: 800 }}>Rol</label>
            <select
              name="role"
              value={form.role}
              onChange={cambiarCampo}
              style={inputStyle}
            >
              <option value="administrador">Administrador</option>
              <option value="empleado">Empleado</option>
              <option value="inversionista">Inversionista</option>
            </select>
          </div>

          <div>
            <label style={{ fontWeight: 800 }}>Estado</label>
            <select
              name="activo"
              value={form.activo ? "1" : "0"}
              onChange={cambiarCampo}
              style={inputStyle}
            >
              <option value="1">Activo</option>
              <option value="0">Inactivo</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
          <button
            type="submit"
            disabled={cargando}
            style={{
              ...buttonStyle,
              background: "#2563eb",
            }}
          >
            {editandoId ? "Guardar cambios" : "Crear usuario"}
          </button>

          {editandoId && (
            <button
              type="button"
              onClick={limpiarFormulario}
              style={{
                ...buttonStyle,
                background: "#64748b",
              }}
            >
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr style={{ background: "#0f172a", color: "#ffffff" }}>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Correo</th>
              <th style={thStyle}>Rol</th>
              <th style={thStyle}>Estado</th>
              <th style={thStyle}>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td style={tdStyle}>{usuario.id}</td>
                <td style={tdStyle}>{usuario.name}</td>
                <td style={tdStyle}>{usuario.email}</td>
                <td style={tdStyle}>{usuario.role}</td>
                <td style={tdStyle}>
                  {usuario.activo ? "Activo" : "Inactivo"}
                </td>
                <td style={tdStyle}>
                  <button
                    type="button"
                    onClick={() => editar(usuario)}
                    style={{
                      ...smallButtonStyle,
                      background: "#2563eb",
                    }}
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => desactivar(usuario)}
                    style={{
                      ...smallButtonStyle,
                      background: "#dc2626",
                      marginLeft: "8px",
                    }}
                  >
                    Desactivar
                  </button>
                </td>
              </tr>
            ))}

            {usuarios.length === 0 && (
              <tr>
                <td colSpan="6" style={{ ...tdStyle, textAlign: "center" }}>
                  {cargando ? "Cargando usuarios..." : "No hay usuarios."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "11px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  marginTop: "6px",
};

const buttonStyle = {
  border: "none",
  color: "#ffffff",
  padding: "11px 16px",
  borderRadius: "10px",
  fontWeight: 900,
  cursor: "pointer",
};

const smallButtonStyle = {
  border: "none",
  color: "#ffffff",
  padding: "8px 10px",
  borderRadius: "8px",
  fontWeight: 800,
  cursor: "pointer",
};

const thStyle = {
  padding: "12px",
  textAlign: "left",
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #e2e8f0",
};