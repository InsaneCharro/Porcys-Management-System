import { useEffect, useState } from "react";
import axios from "axios";

export default function Inventario() {
  const [inventario, setInventario] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [cantidad, setCantidad] = useState("");
  const [motivoMerma, setMotivoMerma] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState("todos");
  const [filtroProductoHistorial, setFiltroProductoHistorial] = useState("todos");
  const [limiteHistorial, setLimiteHistorial] = useState(10);

  const cargarInventario = () => {
    axios
      .get("http://127.0.0.1:8000/api/inventario")
      .then((res) => setInventario(res.data || []))
      .catch((err) => console.error(err));
  };

  const cargarMovimientos = () => {
    axios
      .get("http://127.0.0.1:8000/api/inventario/movimientos")
      .then((res) => setMovimientos(res.data || []))
      .catch((err) => console.error(err));
  };

  const recargarDatos = () => {
    cargarInventario();
    cargarMovimientos();
  };

  useEffect(() => {
    recargarDatos();
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
        recargarDatos();
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
        recargarDatos();
      })
      .catch((err) => {
        alert(err.response?.data?.error || "Error");
      });
  };

  const registrarMerma = () => {
    if (!productoSeleccionado || !cantidad || !motivoMerma.trim()) {
      return alert("Selecciona producto, cantidad y motivo de merma");
    }

    const producto = inventario.find((item) => item.id === productoSeleccionado);

    const confirmar = window.confirm(
      `Vas a registrar una merma de ${cantidad} kg para ${
        producto?.nombre_producto || "el producto seleccionado"
      }.\n\nMotivo: ${motivoMerma}\n\nEsta acción descontará stock y quedará registrada en movimientos. ¿Continuar?`
    );

    if (!confirmar) {
      return;
    }

    axios
      .post("http://127.0.0.1:8000/api/inventario/merma", {
        producto_id: productoSeleccionado,
        cantidad: cantidad,
        motivo: motivoMerma,
      })
      .then(() => {
        alert("Merma registrada correctamente");
        setCantidad("");
        setMotivoMerma("");
        recargarDatos();
      })
      .catch((err) => {
        alert(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Error registrando merma"
        );
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

      recargarDatos();
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

  const formatearFecha = (fecha) => {
    if (!fecha) {
      return "Sin fecha";
    }

    const fechaObj = new Date(fecha);

    if (Number.isNaN(fechaObj.getTime())) {
      return String(fecha);
    }

    return fechaObj.toLocaleString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const etiquetaMovimiento = (movimiento) => {
    if (movimiento.tipo_origen === "merma") {
      return "MERMA";
    }

    return String(movimiento.tipo || "sin tipo").toUpperCase();
  };

  const estiloMovimiento = (movimiento) => {
    if (movimiento.tipo_origen === "merma") {
      return {
        background: "#fee2e2",
        color: "#991b1b",
        border: "1px solid #fecaca",
      };
    }

    if (movimiento.tipo === "entrada") {
      return {
        background: "#dcfce7",
        color: "#166534",
        border: "1px solid #bbf7d0",
      };
    }

    if (movimiento.tipo === "consumo") {
      return {
        background: "#e0f2fe",
        color: "#075985",
        border: "1px solid #bae6fd",
      };
    }

    return {
      background: "#fef3c7",
      color: "#92400e",
      border: "1px solid #fde68a",
    };
  };

  const movimientosFiltrados = movimientos
    .filter((movimiento) => {
      if (filtroTipoMovimiento === "todos") {
        return true;
      }

      return etiquetaMovimiento(movimiento).toLowerCase() === filtroTipoMovimiento;
    })
    .filter((movimiento) => {
      if (filtroProductoHistorial === "todos") {
        return true;
      }

      const productoId =
        movimiento.inventario_id ||
        movimiento.producto_id ||
        movimiento.inventario?.id;

      return Number(productoId) === Number(filtroProductoHistorial);
    })
    .slice(0, Number(limiteHistorial));

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
    movementBadge: (visual) => ({
      display: "inline-block",
      padding: "5px 9px",
      borderRadius: "999px",
      background: visual.background,
      color: visual.color,
      border: visual.border,
      fontWeight: 900,
      fontSize: "12px",
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "14px",
          }}
        >
          <div>
            <h3 style={{ margin: "0 0 8px", color: "#0f172a", fontWeight: 900 }}>
              Historial de movimientos de inventario
            </h3>

            <p style={{ margin: 0, color: "#475569" }}>
              Entradas, salidas, consumos automáticos y mermas registradas en inventario.
              El historial se mantiene contraído para no saturar la pantalla.
            </p>
          </div>

          <button
            type="button"
            style={mostrarHistorial ? styles.button : styles.secondaryButton}
            onClick={() => setMostrarHistorial(!mostrarHistorial)}
          >
            {mostrarHistorial ? "Ocultar historial" : "Mostrar historial"}
          </button>
        </div>

        {mostrarHistorial && (
          <>
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "16px",
              }}
            >
              <select
                style={styles.input}
                value={filtroTipoMovimiento}
                onChange={(e) => setFiltroTipoMovimiento(e.target.value)}
              >
                <option value="todos">Todos los movimientos</option>
                <option value="entrada">Entradas</option>
                <option value="salida">Salidas</option>
                <option value="consumo">Consumos automáticos</option>
                <option value="merma">Mermas</option>
              </select>

              <select
                style={styles.input}
                value={filtroProductoHistorial}
                onChange={(e) => setFiltroProductoHistorial(e.target.value)}
              >
                <option value="todos">Todos los productos</option>
                {inventario.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre_producto}
                  </option>
                ))}
              </select>

              <select
                style={styles.input}
                value={limiteHistorial}
                onChange={(e) => setLimiteHistorial(e.target.value)}
              >
                <option value="10">Últimos 10</option>
                <option value="25">Últimos 25</option>
                <option value="50">Últimos 50</option>
                <option value="100">Últimos 100</option>
              </select>
            </div>

            {movimientos.length === 0 ? (
              <p style={{ color: "#64748b", fontWeight: 700 }}>
                No hay movimientos registrados.
              </p>
            ) : movimientosFiltrados.length === 0 ? (
              <p style={{ color: "#64748b", fontWeight: 700 }}>
                No hay movimientos que coincidan con los filtros seleccionados.
              </p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Fecha</th>
                    <th style={styles.th}>Producto</th>
                    <th style={styles.th}>Tipo</th>
                    <th style={styles.th}>Cantidad</th>
                    <th style={styles.th}>Stock actual del producto</th>
                    <th style={styles.th}>Descripción</th>
                  </tr>
                </thead>

                <tbody>
                  {movimientosFiltrados.map((movimiento) => (
                    <tr key={movimiento.id}>
                      <td style={styles.td}>
                        {formatearFecha(movimiento.fecha_movimiento || movimiento.created_at)}
                      </td>

                      <td style={styles.td}>
                        {movimiento.inventario?.nombre_producto || "Producto no encontrado"}
                      </td>

                      <td style={styles.td}>
                        <span style={styles.movementBadge(estiloMovimiento(movimiento))}>
                          {etiquetaMovimiento(movimiento)}
                        </span>
                      </td>

                      <td style={styles.td}>
                        {Number(movimiento.cantidad || 0).toFixed(2)} kg
                      </td>

                      <td style={styles.td}>
                        {movimiento.inventario?.stock_kg !== undefined
                          ? `${Number(movimiento.inventario.stock_kg || 0).toFixed(2)} kg`
                          : "Sin dato"}
                      </td>

                      <td style={styles.td}>
                        {movimiento.descripcion || movimiento.tipo_origen || "Sin descripción"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
}