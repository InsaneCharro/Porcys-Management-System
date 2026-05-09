import { useEffect, useState } from "react";
import axios from "axios";

export default function VentasPage() {
  const [animales, setAnimales] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [historial, setHistorial] = useState([]);

  const [animalId, setAnimalId] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [precioKg, setPrecioKg] = useState("");
  const [pesoVenta, setPesoVenta] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [animalesRes, clientesRes, historialRes] =
        await Promise.all([
          axios.get("http://127.0.0.1:8000/api/animales"),
          axios.get("http://127.0.0.1:8000/api/clientes"),
          axios.get("http://127.0.0.1:8000/api/ventas/historial")
        ]);

      const disponibles = animalesRes.data.filter(
        a =>
          a.estado !== "muerto" &&
          a.estado !== "vendido"
      );

      setAnimales(disponibles);
      setClientes(clientesRes.data);
      setHistorial(historialRes.data);

    } catch (err) {
      console.error(err);
      alert("Error cargando datos");
    } finally {
      setLoading(false);
    }
  };

  const total =
    (Number(precioKg) || 0) *
    (Number(pesoVenta) || 0);

  const registrarVenta = async () => {
    try {
      if (
        !animalId ||
        !clienteId ||
        !precioKg ||
        !pesoVenta
      ) {
        alert("Completa todos los campos");
        return;
      }

      await axios.post(
        "http://127.0.0.1:8000/api/ventas",
        {
          animal_id: animalId,
          cliente_id: clienteId,
          precio_kg: precioKg,
          peso_venta: pesoVenta
        }
      );

      alert("✅ Venta registrada correctamente");

      setAnimalId("");
      setClienteId("");
      setPrecioKg("");
      setPesoVenta("");

      cargarDatos();

    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.error ||
        "Error registrando venta"
      );
    }
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
        <h2>Cargando módulo de ventas...</h2>
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
        💰 Comercialización
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
        <h2>🐷 Registrar venta</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "15px",
            marginTop: "20px"
          }}
        >
          <select
            value={animalId}
            onChange={(e) =>
              setAnimalId(e.target.value)
            }
          >
            <option value="">
              Seleccionar animal
            </option>

            {animales.map(animal => (
              <option
                key={animal.id}
                value={animal.id}
              >
                {animal.identificador_unico}
              </option>
            ))}
          </select>

          <select
            value={clienteId}
            onChange={(e) =>
              setClienteId(e.target.value)
            }
          >
            <option value="">
              Seleccionar cliente
            </option>

            {clientes.map(cliente => (
              <option
                key={cliente.id}
                value={cliente.id}
              >
                {cliente.nombre}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Precio por kg"
            value={precioKg}
            onChange={(e) =>
              setPrecioKg(e.target.value)
            }
          />

          <input
            type="number"
            placeholder="Peso venta (kg)"
            value={pesoVenta}
            onChange={(e) =>
              setPesoVenta(e.target.value)
            }
          />
        </div>

        <div
          style={{
            marginTop: "20px",
            fontSize: "24px",
            fontWeight: "bold"
          }}
        >
          Total: MXN ${total.toFixed(2)}
        </div>

        <button
          onClick={registrarVenta}
          style={{
            marginTop: "20px",
            padding: "12px 20px",
            border: "none",
            borderRadius: "10px",
            background: "#4CAF50",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Registrar venta
        </button>
      </div>

      {/* HISTORIAL */}
      <div
        style={{
          background: "#1e1e1e",
          padding: "25px",
          borderRadius: "16px"
        }}
      >
        <h2>📋 Historial de ventas</h2>

        {historial.length === 0 ? (
          <p>No hay ventas registradas</p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "20px",
              marginTop: "20px"
            }}
          >
            {historial.map((venta) => (
              <div
                key={venta.id}
                style={{
                  background: "#2a2a2a",
                  padding: "20px",
                  borderRadius: "14px",
                  borderLeft:
                    "5px solid #4CAF50"
                }}
              >
                <h3>
                  🐷 {venta.animal?.identificador_unico}
                </h3>

                <p>
                  👤 Cliente:{" "}
                  {venta.cliente?.nombre}
                </p>

                <p>
                  🏷 Tipo: {venta.tipo_venta}
                </p>

                <p>
                  ⚖ Peso: {venta.peso_venta} kg
                </p>

                <p>
                  💵 Precio/kg: MXN $
                  {Number(
                    venta.precio_kg
                  ).toFixed(2)}
                </p>

                <p
                  style={{
                    fontWeight: "bold",
                    fontSize: "20px",
                    color: "#4CAF50"
                  }}
                >
                  Total: MXN $
                  {Number(
                    venta.total
                  ).toFixed(2)}
                </p>

                <p>
                  📅{" "}
                  {new Date(
                    venta.fecha
                  ).toLocaleDateString("es-MX")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}