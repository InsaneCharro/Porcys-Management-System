import { useEffect, useState } from "react";
import axios from "axios";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

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
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/clientes");
      setClientes(res.data);
    } catch (err) {
      console.error(err);
      alert("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  const guardarCliente = async () => {
    try {
      if (!nuevoCliente.nombre.trim()) {
        alert("El nombre es obligatorio");
        return;
      }

      if (editandoId) {
        await axios.put(
          `http://127.0.0.1:8000/api/clientes/${editandoId}`,
          nuevoCliente
        );

        alert("Cliente actualizado correctamente");
      } else {
        await axios.post(
          "http://127.0.0.1:8000/api/clientes",
          nuevoCliente
        );

        alert("Cliente registrado correctamente");
      }

      resetFormulario();
      cargarClientes();

    } catch (err) {
      console.error(err);
      alert("Error al guardar cliente");
    }
  };

  const eliminarCliente = async (id) => {
    if (!window.confirm("¿Eliminar cliente?")) return;

    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/clientes/${id}`
      );

      cargarClientes();

    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.error ||
        "No se pudo eliminar"
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

  if (loading) {
    return (
      <div
        style={{
          background: "#121212",
          minHeight: "100vh",
          color: "white",
          padding: "30px"
        }}
      >
        <h2>Cargando clientes...</h2>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#121212",
        minHeight: "100vh",
        color: "white",
        padding: "30px"
      }}
    >
      <h1
        style={{
          fontSize: "42px",
          marginBottom: "30px"
        }}
      >
        👤 Clientes
      </h1>

      {/* FORM */}
      <div
        style={{
          background: "#1e1e1e",
          padding: "25px",
          borderRadius: "16px",
          marginBottom: "35px"
        }}
      >
        <h2>
          {editandoId
            ? "✏️ Editar cliente"
            : "➕ Nuevo cliente"}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "15px",
            marginTop: "20px"
          }}
        >
          <input
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

        <div style={{ marginTop: "20px" }}>
          <button onClick={guardarCliente}>
            {editandoId
              ? "Actualizar"
              : "Guardar"}
          </button>

          {editandoId && (
            <button
              onClick={resetFormulario}
              style={{ marginLeft: "10px" }}
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* TABLA */}
      <div
        style={{
          background: "#1e1e1e",
          padding: "25px",
          borderRadius: "16px"
        }}
      >
        <h2>📋 Clientes registrados</h2>

        {clientes.length === 0 ? (
          <p>No hay clientes registrados</p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "20px",
              marginTop: "20px"
            }}
          >
            {clientes.map((cliente) => (
              <div
                key={cliente.id}
                style={{
                  background: "#2a2a2a",
                  padding: "20px",
                  borderRadius: "14px",
                  borderLeft: "5px solid #2196f3"
                }}
              >
                <h3>{cliente.nombre}</h3>

                <p>📞 {cliente.telefono || "N/A"}</p>
                <p>📧 {cliente.email || "N/A"}</p>
                <p>📍 {cliente.direccion || "N/A"}</p>
                <p>🏷 Tipo: {cliente.tipo_cliente}</p>
                <p>📝 {cliente.notas || "Sin notas"}</p>
                <p>🛒 Compras: {cliente.ventas_count}</p>

                <div style={{ marginTop: "15px" }}>
                  <button
                    onClick={() => editarCliente(cliente)}
                  >
                    Editar
                  </button>

                  <button
                    onClick={() =>
                      eliminarCliente(cliente.id)
                    }
                    style={{
                      marginLeft: "10px",
                      background: "#8b0000",
                      color: "white"
                    }}
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