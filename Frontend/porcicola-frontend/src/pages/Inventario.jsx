import { useEffect, useState } from "react";
import axios from "axios";

export default function Inventario() {
  const [inventario, setInventario] = useState([]);
  const [cantidad, setCantidad] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const cargarInventario = () => {
    axios
      .get("http://127.0.0.1:8000/api/inventario")
      .then((res) => setInventario(res.data || []))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    cargarInventario();
  }, []);

  const registrarEntrada = () => {
    if (!productoSeleccionado || !cantidad) {
      return alert("Selecciona producto y cantidad");
    }

    axios
      .post("http://127.0.0.1:8000/api/inventario/entrada", {
        producto_id: productoSeleccionado,
        cantidad: cantidad,
      })
      .then(() => {
        alert("Entrada registrada");
        setCantidad("");
        cargarInventario();
      })
      .catch((err) => {
        alert(err.response?.data?.error || "Error");
      });
  };

  const registrarSalida = () => {
    if (!productoSeleccionado || !cantidad) {
      return alert("Selecciona producto y cantidad");
    }

    axios
      .post("http://127.0.0.1:8000/api/inventario/salida", {
        producto_id: productoSeleccionado,
        cantidad: cantidad,
      })
      .then(() => {
        alert("Salida registrada");
        setCantidad("");
        cargarInventario();
      })
      .catch((err) => {
        alert(err.response?.data?.error || "Error");
      });
  };

  const aplicarConsumo = async () => {
    try {
      if (!productoSeleccionado) {
        alert("Selecciona un producto primero");
        return;
      }

      const response = await axios.post(
        "http://127.0.0.1:8000/api/inventario/consumo",
        {
          producto_id: productoSeleccionado,
        }
      );

      const data = response.data;

      const total = data.consumo_total || 0;
      const consumo = data.detalle || {};

      const producto = inventario.find((item) => item.id === productoSeleccionado);

      alert(
        `Consumo aplicado al producto seleccionado: ${
          producto?.nombre_producto || "Producto"
        }\n\n` +
          `Total descontado: ${total.toFixed(2)} kg\n\n` +
          "🐷 Desglose usado para calcular el consumo por etapa:\n" +
          Object.entries(consumo)
            .map(([etapa, valor]) => `${etapa}: ${valor} kg`)
            .join("\n") +
          "\n\nNota: este botón descuenta únicamente el producto seleccionado.\n" +
          "La formulación por ingredientes se realizará en el módulo Alimentación."
      );

      cargarInventario();
    } catch (error) {
      console.error("ERROR COMPLETO:", error.response?.data || error);
      alert("Error en consumo automático (revisa consola)");
    }
  };

  const stockVisual = (stock) => {
    const valor = Number(stock || 0);

    if (valor < 50) {
      return {
        color: "#dc2626",
        bg: "#fee2e2",
        label: "Crítico",
      };
    }

    if (valor < 100) {
      return {
        color: "#f97316",
        bg: "#ffedd5",
        label: "Bajo",
      };
    }

    return {
      color: "#16a34a",
      bg: "#dcfce7",
      label: "Suficiente",
    };
  };

  const productoActual = inventario.find((item) => item.id === productoSeleccionado);
  const hayStockBajo = inventario.some((item) => Number(item.stock_kg || 0) < 50);

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f8fafc",
      color: "#0f172a",
      padding: "24px 32px",
    },
    title: {
      fontSize: "40px",
      fontWeight: 900,
      letterSpacing: "-0.04em",
      margin: "0 0 6px",
      color: "#0f172a",
    },
    subtitle: {
      margin: "0 0 22px",
      color: "#475569",
      fontSize: "15px",
    },
    alert: {
      background: "#fee2e2",
      color: "#991b1b",
      padding: "13px 16px",
      borderRadius: "14px",
      marginBottom: "18px",
      fontWeight: 900,
      border: "1px solid #fecaca",
    },
    card: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "20px",
      boxShadow: "0 8px 28px rgba(15, 23, 42, 0.08)",
      padding: "20px",
      marginBottom: "22px",
      color: "#0f172a",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      background: "#ffffff",
      borderRadius: "16px",
      overflow: "hidden",
    },
    th: {
      background: "#e2e8f0",
      color: "#0f172a",
      padding: "14px",
      textAlign: "left",
      fontWeight: 900,
      borderBottom: "1px solid #cbd5e1",
    },
    td: {
      padding: "14px",
      color: "#475569",
      borderBottom: "1px solid #e2e8f0",
      fontWeight: 700,
    },
    badge: (visual) => ({
      display: "inline-block",
      padding: "5px 9px",
      borderRadius: "999px",
      background: visual.bg,
      color: visual.color,
      fontWeight: 900,
      border: `1px solid ${visual.color}`,
      fontSize: "13px",
    }),
    button: {
      padding: "9px 12px",
      border: "none",
      borderRadius: "12px",
      background: "#2563eb",
      color: "#ffffff",
      fontWeight: 800,
      cursor: "pointer",
    },
    secondaryButton: {
      padding: "9px 12px",
      border: "1px solid #cbd5e1",
      borderRadius: "12px",
      background: "#ffffff",
      color: "#0f172a",
      fontWeight: 800,
      cursor: "pointer",
    },
    input: {
      padding: "10px 12px",
      border: "1px solid #cbd5e1",
      borderRadius: "12px",
      background: "#ffffff",
      color: "#0f172a",
      minWidth: "190px",
    },
    controls: {
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
      alignItems: "center",
    },
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>📦 Inventario</h1>
      <p style={styles.subtitle}>
        Control de stock de alimento, ingredientes y movimientos de inventario.
      </p>

      {hayStockBajo && (
        <div style={styles.alert}>⚠️ Hay productos con stock bajo</div>
      )}

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Producto</th>
              <th style={styles.th}>Stock</th>
              <th style={styles.th}>Estado</th>
              <th style={styles.th}>Acción</th>
            </tr>
          </thead>

          <tbody>
            {inventario.map((item) => {
              const visual = stockVisual(item.stock_kg);
              const seleccionado = productoSeleccionado === item.id;

              return (
                <tr
                  key={item.id}
                  style={{
                    background: seleccionado ? "#eff6ff" : "#ffffff",
                  }}
                >
                  <td style={styles.td}>{item.nombre_producto}</td>

                  <td style={styles.td}>
                    <strong style={{ color: visual.color }}>
                      {Number(item.stock_kg || 0).toFixed(2)} kg
                    </strong>
                  </td>

                  <td style={styles.td}>
                    <span style={styles.badge(visual)}>{visual.label}</span>
                  </td>

                  <td style={styles.td}>
                    <button
                      style={seleccionado ? styles.button : styles.secondaryButton}
                      onClick={() => setProductoSeleccionado(item.id)}
                    >
                      {seleccionado ? "Seleccionado" : "Seleccionar"}
                    </button>
                  </td>
                </tr>
              );
            })}

            {inventario.length === 0 && (
              <tr>
                <td style={styles.td} colSpan="4">
                  No hay productos en inventario.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.card}>
        <h3 style={{ margin: "0 0 14px", color: "#0f172a", fontWeight: 900 }}>
          Movimiento de inventario
        </h3>

        <p style={{ margin: "0 0 16px", color: "#475569" }}>
          Producto seleccionado:{" "}
          <strong style={{ color: "#0f172a" }}>
            {productoActual?.nombre_producto || "Ninguno"}
          </strong>
        </p>

        <div style={styles.controls}>
          <button style={styles.secondaryButton} onClick={aplicarConsumo}>
            🐷 Aplicar consumo automático
          </button>

          <input
            style={styles.input}
            type="number"
            placeholder="Cantidad (kg)"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
          />

          <button style={styles.button} onClick={registrarEntrada}>
            ➕ Entrada
          </button>

          <button
            style={{ ...styles.button, background: "#dc2626" }}
            onClick={registrarSalida}
          >
            ➖ Salida
          </button>
        </div>
      </div>
    </div>
  );
}