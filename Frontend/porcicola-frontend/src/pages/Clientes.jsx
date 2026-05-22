import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000/api";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");

  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    telefono: "",
    email: "",
    direccion: "",
    tipo_cliente: "otro",
    notas: ""
  });

  const [editandoId, setEditandoId] = useState(null);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    setLoading(true);
    setMensaje("");

    try {
      const res = await axios.get(`${API}/clientes`);
      setClientes(res.data || []);
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Error al cargar clientes.");
    } finally {
      setLoading(false);
    }
  };

  const guardarCliente = async () => {
    if (!nuevoCliente.nombre.trim()) {
      alert("El nombre es obligatorio.");
      return;
    }

    try {
      if (editandoId) {
        await axios.put(`${API}/clientes/${editandoId}`, nuevoCliente);
        setMensaje("Cliente actualizado correctamente.");
      } else {
        await axios.post(`${API}/clientes`, nuevoCliente);
        setMensaje("Cliente registrado correctamente.");
      }

      resetFormulario();
      cargarClientes();
    } catch (err) {
      console.error(err.response?.data || err);
      alert(err.response?.data?.message || "Error al guardar cliente.");
    }
  };

  const eliminarCliente = async (id) => {
    if (!window.confirm("¿Eliminar cliente?")) return;

    try {
      await axios.delete(`${API}/clientes/${id}`);
      setMensaje("Cliente eliminado correctamente.");
      cargarClientes();
    } catch (err) {
      console.error(err.response?.data || err);

      alert(
        err.response?.data?.error ||
        "No se pudo eliminar el cliente."
      );
    }
  };

  const editarCliente = (cliente) => {
    setNuevoCliente({
      nombre: cliente.nombre || "",
      telefono: cliente.telefono || "",
      email: cliente.email || "",
      direccion: cliente.direccion || "",
      tipo_cliente: cliente.tipo_cliente || "otro",
      notas: cliente.notas || ""
    });

    setEditandoId(cliente.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetFormulario = () => {
    setNuevoCliente({
      nombre: "",
      telefono: "",
      email: "",
      direccion: "",
      tipo_cliente: "otro",
      notas: ""
    });

    setEditandoId(null);
  };

  const formatoMoneda = (valor) => {
    return Number(valor || 0).toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN"
    });
  };

  const etiquetaTipoCliente = (tipo) => {
    const mapa = {
      abasto: "Abasto",
      pie_cria: "Pie de cría",
      distribuidor: "Distribuidor",
      otro: "Otro"
    };

    return mapa[tipo] || "Otro";
  };

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f8fafc",
      color: "#0f172a",
      padding: "24px 32px"
    },
    header: {
      marginBottom: "20px"
    },
    title: {
      fontSize: "40px",
      fontWeight: 900,
      letterSpacing: "-0.04em",
      margin: "0 0 6px",
      color: "#0f172a"
    },
    subtitle: {
      margin: 0,
      color: "#475569",
      fontSize: "15px"
    },
    card: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "20px",
      boxShadow: "0 8px 28px rgba(15, 23, 42, 0.08)",
      padding: "22px",
      marginBottom: "22px"
    },
    cardTitle: {
      margin: "0 0 16px",
      fontSize: "24px",
      fontWeight: 900,
      color: "#0f172a"
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
      gap: "12px"
    },
    input: {
      padding: "11px 12px",
      border: "1px solid #cbd5e1",
      borderRadius: "12px",
      background: "#ffffff",
      color: "#0f172a",
      fontSize: "15px",
      outline: "none"
    },
    button: {
      padding: "10px 14px",
      border: "none",
      borderRadius: "12px",
      background: "#2563eb",
      color: "#ffffff",
      fontWeight: 800,
      cursor: "pointer"
    },
    secondaryButton: {
      padding: "10px 14px",
      border: "1px solid #cbd5e1",
      borderRadius: "12px",
      background: "#ffffff",
      color: "#0f172a",
      fontWeight: 800,
      cursor: "pointer"
    },
    dangerButton: {
      padding: "10px 14px",
      border: "none",
      borderRadius: "12px",
      background: "#dc2626",
      color: "#ffffff",
      fontWeight: 800,
      cursor: "pointer"
    },
    message: {
      background: "#dcfce7",
      color: "#166534",
      padding: "12px 16px",
      borderRadius: "14px",
      fontWeight: 800,
      marginBottom: "18px",
      border: "1px solid #bbf7d0"
    },
    clientsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "16px",
      marginTop: "18px"
    },
    clientCard: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderLeft: "6px solid #2563eb",
      borderRadius: "18px",
      padding: "18px",
      boxShadow: "0 6px 20px rgba(15, 23, 42, 0.07)"
    },
    clientName: {
      margin: "0 0 12px",
      color: "#0f172a",
      fontWeight: 900,
      fontSize: "20px"
    },
    clientText: {
      margin: "7px 0",
      color: "#475569",
      fontSize: "15px"
    },
    badge: {
      display: "inline-block",
      padding: "5px 9px",
      borderRadius: "999px",
      background: "#dbeafe",
      color: "#1d4ed8",
      fontWeight: 800,
      fontSize: "13px"
    },
    kpiRow: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "12px",
      marginBottom: "22px"
    },
    kpi: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "18px",
      padding: "18px",
      boxShadow: "0 6px 20px rgba(15, 23, 42, 0.07)"
    },
    kpiLabel: {
      margin: 0,
      color: "#64748b",
      fontWeight: 800
    },
    kpiValue: {
      margin: "8px 0 0",
      color: "#0f172a",
      fontSize: "26px",
      fontWeight: 900
    }
  };

  const totalCompras = clientes.reduce(
    (acc, cliente) => acc + Number(cliente.ventas_sum_total || 0),
    0
  );

  const totalVentas = clientes.reduce(
    (acc, cliente) => acc + Number(cliente.ventas_count || 0),
    0
  );

  if (loading) {
    return (
      <div style={styles.page}>
        <h2 style={{ color: "#0f172a" }}>Cargando clientes...</h2>
        <p style={{ color: "#64748b" }}>
          Consultando historial comercial.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>👤 Clientes</h1>
        <p style={styles.subtitle}>
          Gestión comercial de compradores, historial de ventas y rentabilidad por cliente.
        </p>
      </div>

      {mensaje && (
        <div style={styles.message}>
          {mensaje}
        </div>
      )}

      <div style={styles.kpiRow}>
        <div style={styles.kpi}>
          <p style={styles.kpiLabel}>Clientes registrados</p>
          <p style={styles.kpiValue}>{clientes.length}</p>
        </div>

        <div style={styles.kpi}>
          <p style={styles.kpiLabel}>Ventas completadas</p>
          <p style={styles.kpiValue}>{totalVentas}</p>
        </div>

        <div style={styles.kpi}>
          <p style={styles.kpiLabel}>Total comprado</p>
          <p style={styles.kpiValue}>{formatoMoneda(totalCompras)}</p>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>
          {editandoId ? "✏️ Editar cliente" : "➕ Nuevo cliente"}
        </h2>

        <div style={styles.grid}>
          <input
            style={styles.input}
            placeholder="Nombre"
            value={nuevoCliente.nombre}
            onChange={(e) =>
              setNuevoCliente({
                ...nuevoCliente,
                nombre: e.target.value
              })
            }
          />

          <input
            style={styles.input}
            placeholder="Teléfono"
            value={nuevoCliente.telefono}
            onChange={(e) =>
              setNuevoCliente({
                ...nuevoCliente,
                telefono: e.target.value
              })
            }
          />

          <input
            style={styles.input}
            placeholder="Email"
            value={nuevoCliente.email}
            onChange={(e) =>
              setNuevoCliente({
                ...nuevoCliente,
                email: e.target.value
              })
            }
          />

          <input
            style={styles.input}
            placeholder="Dirección"
            value={nuevoCliente.direccion}
            onChange={(e) =>
              setNuevoCliente({
                ...nuevoCliente,
                direccion: e.target.value
              })
            }
          />

          <select
            style={styles.input}
            value={nuevoCliente.tipo_cliente}
            onChange={(e) =>
              setNuevoCliente({
                ...nuevoCliente,
                tipo_cliente: e.target.value
              })
            }
          >
            <option value="abasto">Abasto</option>
            <option value="pie_cria">Pie de cría</option>
            <option value="distribuidor">Distribuidor</option>
            <option value="otro">Otro</option>
          </select>

          <input
            style={styles.input}
            placeholder="Notas"
            value={nuevoCliente.notas}
            onChange={(e) =>
              setNuevoCliente({
                ...nuevoCliente,
                notas: e.target.value
              })
            }
          />
        </div>

        <div style={{ marginTop: "18px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button style={styles.button} onClick={guardarCliente}>
            {editandoId ? "Actualizar" : "Guardar"}
          </button>

          {editandoId && (
            <button style={styles.secondaryButton} onClick={resetFormulario}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>📋 Clientes registrados</h2>

        {clientes.length === 0 ? (
          <p style={{ color: "#64748b" }}>No hay clientes registrados.</p>
        ) : (
          <div style={styles.clientsGrid}>
            {clientes.map((cliente) => (
              <div key={cliente.id} style={styles.clientCard}>
                <h3 style={styles.clientName}>{cliente.nombre}</h3>

                <p style={styles.clientText}>
                  📞 {cliente.telefono || "N/A"}
                </p>

                <p style={styles.clientText}>
                  📧 {cliente.email || "N/A"}
                </p>

                <p style={styles.clientText}>
                  📍 {cliente.direccion || "N/A"}
                </p>

                <p style={styles.clientText}>
                  🏷 <span style={styles.badge}>{etiquetaTipoCliente(cliente.tipo_cliente)}</span>
                </p>

                <p style={styles.clientText}>
                  📝 {cliente.notas || "Sin notas"}
                </p>

                <p style={styles.clientText}>
                  🛒 Ventas completadas: <strong>{cliente.ventas_count || 0}</strong>
                </p>

                <p style={styles.clientText}>
                  💰 Total comprado: <strong>{formatoMoneda(cliente.ventas_sum_total || 0)}</strong>
                </p>

                <div style={{ marginTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    style={styles.secondaryButton}
                    onClick={() => editarCliente(cliente)}
                  >
                    Editar
                  </button>

                  <button
                    style={styles.dangerButton}
                    onClick={() => eliminarCliente(cliente.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}