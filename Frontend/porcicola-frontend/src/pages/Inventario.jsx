import { useEffect, useState } from "react";
import axios from "axios";

export default function Inventario() {
  const [inventario, setInventario] = useState([]);
  const [cantidad, setCantidad] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  

  // =========================
  // 🔄 CARGAR INVENTARIO
  // =========================
  const cargarInventario = () => {
    axios.get("http://127.0.0.1:8000/api/inventario")
      .then(res => setInventario(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    cargarInventario();
  }, []);

  // =========================
  // 📥 ENTRADA
  // =========================
  const registrarEntrada = () => {
    if (!productoSeleccionado || !cantidad) {
      return alert("Selecciona producto y cantidad");
    }

    axios.post("http://127.0.0.1:8000/api/inventario/entrada", {
      producto_id: productoSeleccionado,
      cantidad: cantidad
    })
    .then(() => {
      alert("Entrada registrada");
      setCantidad("");
      cargarInventario();
    })
    .catch(err => {
      alert(err.response?.data?.error || "Error");
    });
  };

  // =========================
  // 📤 SALIDA
  // =========================
  const registrarSalida = () => {
    if (!productoSeleccionado || !cantidad) {
      return alert("Selecciona producto y cantidad");
    }

    axios.post("http://127.0.0.1:8000/api/inventario/salida", {
      producto_id: productoSeleccionado,
      cantidad: cantidad
    })
    .then(() => {
      alert("Salida registrada");
      setCantidad("");
      cargarInventario();
    })
    .catch(err => {
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
        producto_id: productoSeleccionado
      }
    );

    const data = response.data;

    const total = data.consumo_total || 0;
    const consumo = data.detalle || {};

    alert(
      `Consumo aplicado: ${total.toFixed(2)} kg\n\n` +
      "🐷 Consumo por etapa:\n" +
      Object.entries(consumo)
        .map(([etapa, valor]) => `${etapa}: ${valor} kg`)
        .join("\n")
    );

    cargarInventario();

  } catch (error) {
    console.error("ERROR COMPLETO:", error.response?.data || error);
    alert("Error en consumo automático (revisa consola)");
  }
};

  return (
    <div className="container">
      <h1>📦 Inventario</h1>

      {inventario.some(item => item.stock_kg < 50) && (
  <div style={{
    background: "#ff4d4d",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "15px",
    fontWeight: "bold"
  }}>
    ⚠️ Hay productos con stock bajo
  </div>
)}

      {/* ========================= */}
      {/* 📊 TABLA */}
      {/* ========================= */}
      <table className="tabla">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Stock (kg)</th>
            <th>Acción</th>
          </tr>
        </thead>

        <tbody>
          {inventario.map(item => (
            <tr key={item.id}>
              <td>{item.nombre_producto}</td>
              <td>
  <span
    style={{
      color:
        item.stock_kg < 50
          ? "red"
          : item.stock_kg < 100
          ? "orange"
          : "lightgreen",
      fontWeight: "bold"
    }}
  >
    {item.stock_kg} kg
  </span>
</td>
              <td>
                <button onClick={() => setProductoSeleccionado(item.id)}>
                  Seleccionar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ========================= */}
      {/* ⚙️ CONTROLES */}
      {/* ========================= */}
      <div className="form-peso">
        <h3>Movimiento de inventario</h3>
        <button onClick={aplicarConsumo}>
  🐷 Aplicar consumo automático
</button>
        <input
          type="number"
          placeholder="Cantidad (kg)"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
        />

        <button onClick={registrarEntrada}>
          ➕ Entrada
        </button>

        <button onClick={registrarSalida}>
          ➖ Salida
        </button>
      </div>
    </div>
  );
}